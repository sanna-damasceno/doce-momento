import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
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

    const paymentId = body.data?.id || body.id || url.searchParams.get('data.id');
    const eventType = body.type || url.searchParams.get('type');

    if (eventType !== 'payment' || !paymentId) {
      console.log('Notificação ignorada:', { eventType, paymentId });
      return NextResponse.json({ received: true });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN não configurado');
    }

    const paymentClient = new Payment(client);

    // Consulta o status real do pagamento
    const paymentInfo = await paymentClient.get({
      id: String(paymentId),
    });

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
       WHERE id = $3`,
      ['aprovado', 'Pago / Em Preparo', externalReference]
    );

    if (updateResult.rowCount === 0) {
      throw new Error(
        `Nenhum pedido encontrado com ID ${externalReference}`
      );
    }

    console.log(
  `Pedido ${externalReference} atualizado para Pago`
  );

  // Buscar os dados do pedido para enviar o e-mail
  const orderResult = await query(
    `SELECT customer_email, total_amount
    FROM orders
    WHERE id = $1`,
    [externalReference]
  );

  if (orderResult.rows.length > 0) {
    const order = orderResult.rows[0];

    await sendConfirmationEmail(
      order.customer_email,
      String(externalReference),
      Number(order.total_amount)
    );
  }

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


async function sendConfirmationEmail(toEmail: string, orderId: string, total: number) {
  try {
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
      to: toEmail,
      subject: `Confirmação do Pedido #${orderId} - Doce Momento`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #a8325b;">Obrigado pela sua compra! 🎉</h2>
          <p>O pagamento do seu pedido <strong>#${orderId}</strong> foi aprovado com sucesso.</p>
          <p><strong>Valor Total:</strong> R$ ${Number(total).toFixed(2)}</p>
          <p>Acesse a sua área de pedidos no site da <strong>Doce Momento</strong> para acompanhar o preparo e a entrega.</p>
          <br/>
          <p style="font-size: 12px; color: #666;">Com carinho,<br/><strong>Equipe Doce Momento</strong></p>
        </div>
      `,
    });
    console.log(`E-mail enviado para ${toEmail}`);
  } catch (emailError) {
    console.error('Erro ao enviar e-mail:', emailError);
  }
}