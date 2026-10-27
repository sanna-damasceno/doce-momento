import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import nodemailer from 'nodemailer';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = await request.json();

    console.log('Webhook recebido:', JSON.stringify(body));

    const eventType =
      body.type ||
      body.topic ||
      url.searchParams.get('type') ||
      url.searchParams.get('topic');

    const paymentId =
      body.data?.id ??
      (eventType === 'payment' ? body.resource : null) ??
      url.searchParams.get('data.id') ??
      (url.searchParams.get('topic') === 'payment'
        ? url.searchParams.get('id')
        : null);

    console.log('Evento identificado:', {
      eventType,
      paymentId,
    });
    if (eventType !== 'payment' || !paymentId) {
      console.log('Notificação ignorada:', { eventType, paymentId });
      return NextResponse.json({ received: true });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN não configurado');
    }

    const paymentClient = new Payment(client);

    let paymentInfo;

    try {
      paymentInfo = await paymentClient.get({
        id: String(paymentId),
      });
    } catch (error: any) {
      console.error('Erro ao consultar pagamento:', {
        paymentId,
        status: error?.status,
        message: error?.message,
      });

      // O ID 123456 da simulação pode não existir na API.
      // Não aprovar nem atualizar nenhum pedido nesse caso.
      if (String(paymentId) === '123456' && error?.status === 404) {
        console.log('Simulação recebida: ID fictício, nenhuma atualização realizada.');

        return NextResponse.json({
          received: true,
          simulation: true,
        });
      }

      throw error;
    }

    console.log('Pagamento consultado:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference,
    });

    // Não atualizar o pedido se não estiver aprovado
    if (paymentInfo.status !== 'approved') {
      return NextResponse.json({
        received: true,
        paymentStatus: paymentInfo.status,
      });
    }

    const externalReference = paymentInfo.external_reference;

    if (!externalReference) {
      throw new Error(
        'Pagamento sem external_reference para identificar o pedido'
      );
    }

    const updateResult = await query(
      `UPDATE orders
       SET payment_status = $1,
           status = $2,
           updated_at = NOW()
       WHERE id = $3
          AND payment_status IS DISTINCT FROM $1
          RETURNING id`,
      ['aprovado', 'Pago / Em Preparo', externalReference]
    );

    if (updateResult.rowCount === 0) {
      const orderCheck = await query(
        `SELECT id, payment_status
        FROM orders
        WHERE id = $1`,
        [externalReference]
      );

      if (orderCheck.rows.length === 0) {
        throw new Error(
          `Nenhum pedido encontrado com ID ${externalReference}`
        );  
    }

    console.log(
      `Pedido ${externalReference} já estava aprovado. Nenhuma atualização necessária`
    );

      return NextResponse.json({
      received: true,
      alreadyApproved: true,
    });
  }

  console.log(`Pedido ${externalReference} atualizado para Pago`);

  // Buscar os dados do pedido para enviar o e-mail
  const orderResult = await query(
    `SELECT
         id,
         customer_name,
         customer_email,
         shipping_address,
         delivery_date,
         subtotal,
         shipping_fee,
         discount,
         total_amount,
         status,
         payment_status,
         payment_type,
         notes,
         created_at
       FROM orders
       WHERE id = $1`,
    [externalReference]
  );

  if (orderResult.rows.length === 0) {
      throw new Error(`Pedido ${externalReference} não encontrado`);
    }

  // Buscar os produtos do pedido
    const itemsResult = await query(
      `SELECT product_name, quantity, unit_price, customization
       FROM order_items
       WHERE order_id = $1
       ORDER BY id`,
      [externalReference]
    );

    await sendConfirmationEmail(
      orderResult.rows[0],
      itemsResult.rows
    );

  return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro real no webhook:', error);

    // Permite identificar falhas e possibilita novas tentativas
    return NextResponse.json(
      { received: false, error: 'Falha ao processar pagamento' },
      { status: 500 }
    );
  }
}



async function sendConfirmationEmail(order: any, items: any[]) {
  const formatMoney = (value: number | string) =>
    Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const formatDate = (value: string | Date) =>
    new Date(value).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    });

  try {
    // Gerar o PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595.28, 841.89]);
    let y = 790;

    const drawLine = (text: string, bold = false, size = 11) => {
      // Criar outra página quando necessário
      if (y < 65) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = 790;
      }

      page.drawText(text, {
        x: 45,
        y,
        size,
        font: bold ? boldFont : font,
        color: rgb(0.2, 0.2, 0.2),
        maxWidth: 500,
      });

      y -= size + 10;
    };

    drawLine('DOCE MOMENTO', true, 22);
    drawLine('COMPROVANTE DE PEDIDO PAGO', true, 14);
    y -= 10;

    drawLine(`Pedido: #${order.id}`, true);
    drawLine(`Data do pedido: ${formatDate(order.created_at)}`);
    drawLine(`Entrega prevista: ${formatDate(order.delivery_date)}`);
    drawLine(`Cliente: ${order.customer_name}`);
    drawLine(`E-mail: ${order.customer_email}`);
    drawLine(`Endereco: ${order.shipping_address}`);
    y -= 10;

    drawLine('ITENS DO PEDIDO', true, 13);

    for (const item of items) {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      const itemTotal = quantity * unitPrice;

      drawLine(`${quantity}x ${item.product_name}`, true);
      drawLine(
        `Valor unitario: ${formatMoney(unitPrice)} | Total: ${formatMoney(itemTotal)}`
      );

      if (item.customization) {
        drawLine(`Personalizacao: ${item.customization}`);
      }

      y -= 5;
    }

    y -= 10;
    drawLine(`Subtotal: ${formatMoney(order.subtotal)}`);
    drawLine(`Entrega: ${formatMoney(order.shipping_fee)}`);
    drawLine(`Desconto: ${formatMoney(order.discount ?? 0)}`);
    drawLine(`TOTAL: ${formatMoney(order.total_amount)}`, true, 15);
    y -= 10;

    drawLine(`Forma de pagamento: ${order.payment_type || 'Nao informado'}`);
    drawLine('Situacao do pagamento: APROVADO', true);
    drawLine(`Situacao do pedido: ${order.status}`);

    if (order.notes) {
      y -= 5;
      drawLine(`Observacoes: ${order.notes}`);
    }

    y -= 15;
    drawLine('Este comprovante nao substitui uma nota fiscal.');

    const pdfBytes = await pdfDoc.save();

    // Configurar o envio do e-mail
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Doce Momento" <${process.env.EMAIL_USER}>`,
      to: order.customer_email,
      subject: `Confirmacao do Pedido #${order.id} - Doce Momento`,
      text: [
        `Ola, ${order.customer_name}!`,
        '',
        `O pagamento do pedido #${order.id} foi aprovado.`,
        `Valor total: ${formatMoney(order.total_amount)}`,
        'O comprovante esta anexado em PDF.',
        '',
        'Com carinho,',
        'Equipe Doce Momento',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px;">
          <h2 style="color: #a8325b;">Obrigado pela sua compra! 🎉</h2>
          <p>Olá, ${order.customer_name}!</p>
          <p>O pagamento do pedido <strong>#${order.id}</strong> foi aprovado.</p>
          <p><strong>Data:</strong> ${formatDate(order.created_at)}</p>
          <p><strong>Valor total:</strong> ${formatMoney(order.total_amount)}</p>
          <p><strong>Pagamento:</strong> Aprovado</p>
          <p><strong>Situação do pedido:</strong> ${order.status}</p>
          <p>O comprovante com os detalhes da compra está anexado a este e-mail em PDF.</p>
          <p>Com carinho,<br><strong>Equipe Doce Momento</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `comprovante-pedido-${order.id}.pdf`,
          content: Buffer.from(pdfBytes),
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`E-mail com PDF enviado para ${order.customer_email}`);
  } catch (emailError) {
    console.error('Erro ao gerar PDF ou enviar e-mail:', emailError);
  }
}
