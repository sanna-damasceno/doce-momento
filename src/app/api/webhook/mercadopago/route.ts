import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import nodemailer from 'nodemailer';

// Inicializa o cliente do Mercado Pago com o token de acesso
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // O Mercado Pago envia vários tipos de notificações. 
    // Interessamo-nos pelas notificações do tipo 'payment'.
    if (body.type === 'payment' || body.action === 'payment.created' || body.action === 'payment.updated') {
      const paymentId = body.data?.id;

      if (paymentId) {
        // Consulta os detalhes atualizados do pagamento diretamente na API do Mercado Pago
        const paymentClient = new Payment(client);
        const paymentInfo = await paymentClient.get({ id: paymentId });

        const externalReference = paymentInfo.external_reference; // Este é o nosso orderId que enviamos na preference!
        const paymentStatus = paymentInfo.status; // ex: 'approved', 'pending', 'rejected'

        if (externalReference) {
          // Mapeia o estado do Mercado Pago para o estado do seu negócio
          let dbPaymentStatus = 'pendente';
          let dbOrderStatus = 'Pendente';

          if (paymentStatus === 'approved') {
            dbPaymentStatus = 'aprovado';
            dbOrderStatus = 'Pago / Em Preparo';
          } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
            dbPaymentStatus = 'rejeitado';
            dbOrderStatus = 'Cancelado';
          }

          // 1. VERIFICAÇÃO DE IDEMPOTÊNCIA: 
          // Consulta o estado atual do pedido no banco antes de atualizar e enviar e-mails
          const checkOrderQuery = `SELECT status, email, total FROM orders WHERE id = $1;`;
          const orderResult = await query(checkOrderQuery, [externalReference]);

          if (orderResult.rows.length > 0) {
            const currentOrder = orderResult.rows[0];

            // Só processa se o pedido ainda NÃO estiver marcado como pago (evita reenvios e duplicidade)
            if (currentOrder.status !== 'Pago / Em Preparo' && dbOrderStatus === 'Pago / Em Preparo') {
              
              // 2. Atualiza o estado do pedido na base de dados PostgreSQL
              const updateQuery = `
                UPDATE orders 
                SET payment_status = $1, status = $2, updated_at = NOW() 
                WHERE id = $3;
              `;
              await query(updateQuery, [dbPaymentStatus, dbOrderStatus, externalReference]);
              console.log(`Pedido ${externalReference} atualizado para o estado: ${dbOrderStatus}`);

              // 3. Envia o e-mail de confirmação da compra automaticamente (RF19 / RN09)
              await sendConfirmationEmail(currentOrder.email, externalReference, currentOrder.total);
            } else {
              // Se já foi processado antes, apenas atualiza o status de pagamento se necessário, sem disparar e-mails duplicados
              const updateQuery = `
                UPDATE orders 
                SET payment_status = $1, updated_at = NOW() 
                WHERE id = $2;
              `;
              await query(updateQuery, [dbPaymentStatus, externalReference]);
            }
          }
        }
      }
    }

    // Responde sempre com 200 OK para confirmar ao Mercado Pago que a notificação foi recebida
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
    // Retorna 200 para evitar que o Mercado Pago fique reenviando infinitamente em caso de falha pontual
    return NextResponse.json({ error: 'Erro interno ao processar webhook' }, { status: 200 });
  }
}

// Função auxiliar para envio do e-mail de confirmação
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
    console.log(`E-mail de confirmação enviado com sucesso para ${toEmail}`);
  } catch (emailError) {
    console.error('Erro ao enviar e-mail de confirmação:', emailError);
  }
}