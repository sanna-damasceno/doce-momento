
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  getAdminCookie,
  isValidAdminSession,
} from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verifica se existe uma sessão administrativa válida.
  const token = getAdminCookie(request);

  if (!isValidAdminSession(token)) {
    return NextResponse.json(
      { error: 'Sessão inválida ou expirada. Entre novamente.' },
      {
        status: 401,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  try {
    // Busca os usuários cadastrados.
    const usersResult = await query(`
      SELECT id, name, email, phone, created_at
      FROM users
      ORDER BY created_at DESC, id DESC
    `);

    // Busca os pedidos.
    const ordersResult = await query(`
      SELECT *
      FROM orders
      ORDER BY created_at DESC, id DESC
    `);

    // Busca os produtos de todos os pedidos.
    const itemsResult = await query(`
      SELECT *
      FROM order_items
      ORDER BY order_id, id
    `);

    // Agrupa os produtos pelo ID do pedido.
    const itemsByOrder = new Map<number, Record<string, unknown>[]>();

    for (const item of itemsResult.rows) {
      const orderId = Number(item.order_id);
      const items = itemsByOrder.get(orderId) || [];

      items.push(item);
      itemsByOrder.set(orderId, items);
    }

    // Adiciona os produtos correspondentes a cada pedido.
    const orders = ordersResult.rows.map((order) => ({
      ...order,
      items: itemsByOrder.get(Number(order.id)) || [],
    }));

    return NextResponse.json(
      {
        users: usersResult.rows,
        orders,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Erro na área administrativa:', error);

    return NextResponse.json(
      { error: 'Não foi possível consultar os dados.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
