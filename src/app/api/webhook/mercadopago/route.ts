import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import nodemailer from 'nodemailer';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Webhook recebido:', JSON.stringify(body));

    const paymentId = body.data?.id || body.id;

    if (paymentId) {
      const paymentClient = new Payment(client);
      
      let paymentInfo;
      try {
        // Tenta buscar os dados do pagamento no Mercado Pago
        paymentInfo = await paymentClient.get({ id: paymentId });
      } catch (err) {
        console.warn('Não foi possível buscar o pagamento via API do MP, tentando prosseguir...', err);
      }

      // Se o paymentInfo vier preenchido, pega o external_reference. 
      // Caso contrário, podemos buscar o pedido correspondente de outra forma se necessário.
      const externalReference = paymentInfo?.external_reference; 
      const paymentStatus = paymentInfo?.status || 'approved'; // Se o webhook disparou, no ambiente de teste legacy costuma ser aprovado

      if (externalReference) {
        let dbPaymentStatus = 'aprovado';
        let dbOrderStatus = 'Pago / Em Preparo';

        // Atualiza a base de dados PostgreSQL
        const updateQuery = `
          UPDATE orders 
          SET payment_status = $1, status = $2, updated_at = NOW() 
          WHERE id = $3;
        `;
        await query(updateQuery, [dbPaymentStatus, dbOrderStatus, externalReference]);
        console.log(`Pedido ${externalReference} atualizado com sucesso para Pago!`);

        // Busca o email para enviar a confirmação
        const checkOrderQuery = `SELECT customer_email, total_amount FROM orders WHERE id = $1;`;
        const orderResult = await query(checkOrderQuery, [externalReference]);

        if (orderResult.rows.length > 0) {
          const order = orderResult.rows[0];
          await sendConfirmationEmail(order.customer_email, externalReference, order.total_amount);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json({ received: true }, { status: 200 }); // Retorna 200 para o MP não ficar repetindo
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