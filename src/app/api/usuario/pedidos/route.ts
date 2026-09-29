import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

// GET: Lista todos os pedidos do utilizador ou os detalhes de um pedido específico
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }

    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Utilizador não encontrado.' }, { status: 404 });
    }
    const userEmail = userResult.rows[0].email;

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    // Se um ID específico foi fornecido, retorna os detalhes do pedido e os seus itens
    if (orderId) {
      const orderQuery = await query(`
        SELECT 
          id, 
          customer_name, 
          customer_email, 
          customer_phone,
          shipping_address,
          delivery_date,
          subtotal,
          shipping_fee,
          discount,
          total_amount, 
          status, 
          payment_status, 
          payment_id,
          payment_type, 
          notes,
          created_at 
        FROM orders 
        WHERE id = $1 AND customer_email = $2
      `, [orderId, userEmail]);

      if (orderQuery.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Pedido não encontrado.' }, { status: 404 });
      }

      const order = orderQuery.rows[0];

      // Tenta buscar os itens do pedido (caso tenha uma tabela de itens relacional, ex: order_items ou items)
      // Se a sua tabela tiver outro nome, ajuste aqui. Caso guarde os itens num campo JSON, ajuste conforme necessário.
      let items = [];
      try {
        const itemsQuery = await query(`
          SELECT 
            id, 
            product_name, 
            quantity, 
            unit_price, 
            unit_price AS price, 
            customization,
            created_at
          FROM order_items 
          WHERE order_id = $1
        `, [orderId]);
        items = itemsQuery.rows;
      } catch (e) {
        items = [];
      }

      return NextResponse.json({ success: true, order, items }, { status: 200 });
    }

    // Caso contrário, lista todos os pedidos do utilizador
    const result = await query(`
      SELECT id, customer_name, customer_email, total_amount, status, payment_status, payment_type, delivery_date, created_at, shipping_fee 
      FROM orders 
      WHERE customer_email = $1 
      ORDER BY created_at DESC;
    `, [userEmail]);

    return NextResponse.json({ success: true, orders: result.rows }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ success: false, error: 'Erro interno ao processar a requisição.' }, { status: 500 });
  }
}

// PATCH: Cancela um pedido (se o pagamento ainda não estiver confirmado)
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }

    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Utilizador não encontrado.' }, { status: 404 });
    }
    const userEmail = userResult.rows[0].email;

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'ID do pedido não fornecido.' }, { status: 400 });
    }

    // Verifica se o pedido pertence ao utilizador e qual o estado atual do pagamento
    const orderCheck = await query(`
      SELECT * FROM orders WHERE id = $1 AND customer_email = $2
    `, [orderId, userEmail]);

    if (orderCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Pedido não encontrado.' }, { status: 404 });
    }

    const order = orderCheck.rows[0];

    // Regra: Só pode cancelar se o pagamento NÃO estiver confirmado/pago
    // (Ajuste os valores 'Pago', 'Confirmado', etc., conforme o que grava na sua base de dados)
    const paymentStatus = order.payment_status?.toLowerCase() || '';
    if (paymentStatus === 'pago' || paymentStatus === 'confirmed' || paymentStatus === 'approved') {
      return NextResponse.json({ 
        success: false, 
        error: 'Não é possível cancelar um pedido com pagamento já confirmado.' 
      }, { status: 400 });
    }

    // Atualiza o status do pedido para 'Cancelado'
    await query(`
      UPDATE orders 
      SET status = 'Cancelado', payment_status = 'Cancelado' 
      WHERE id = $1
    `, [orderId]);

    return NextResponse.json({ success: true, message: 'Pedido cancelado com sucesso.' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao cancelar pedido:', error);
    return NextResponse.json({ success: false, error: 'Erro interno ao cancelar o pedido.' }, { status: 500 });
  }
}