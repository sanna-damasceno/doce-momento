import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { MercadoPagoConfig, Payment } from 'mercadopago';

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

        const externalReference = paymentInfo.external_reference; // Este é o nosso orderId que enviámos na preference!
        const paymentStatus = paymentInfo.status; // ex: 'approved', 'pending', 'rejected'

        if (externalReference) {
          // Mapeia o estado do Mercado Pago para o estado do seu negócio
          let dbPaymentStatus = 'pendente';
          let dbOrderStatus = 'Pendente';

          if (paymentStatus === 'approved') {
            dbPaymentStatus = 'aprovado';
            dbOrderStatus = 'Pago / Em Preparo';
          } else if (paymentStatus === 'rejected') {
            dbPaymentStatus = 'rejeitado';
            dbOrderStatus = 'Cancelado';
          }

          // Atualiza o estado do pedido na base de dados PostgreSQL usando 'pg'
          const updateQuery = `
            UPDATE orders 
            SET payment_status = $1, status = $2, updated_at = NOW() 
            WHERE id = $3;
          `;
          
          await query(updateQuery, [dbPaymentStatus, dbOrderStatus, externalReference]);
          console.log(`Pedido ${externalReference} atualizado para o estado de pagamento: ${paymentStatus}`);
        }
      }
    }

    // Responde sempre com 200 OK para confirmar ao Mercado Pago que a notificação foi recebida
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
    // Retorna 200 mesmo em caso de erro interno para evitar que o Mercado Pago fique a reenviar infinitamente, 
    // mas regista o erro nos logs do servidor.
    return NextResponse.json({ error: 'Erro interno ao processar webhook' }, { status: 200 });
  }
}