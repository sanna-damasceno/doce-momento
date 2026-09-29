import { NextResponse } from 'next/server';
import { query } from '@/lib/db'; // A sua configuração do pg
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Inicializa o cliente do Mercado Pago com o Access Token
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      shipping_address, 
      delivery_date, 
      subtotal, 
      shipping_fee, 
      discount, 
      total_amount, 
      items, 
      notes,
      payment_type 
    } = body;

    if (!customer_email || !items || items.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos para criar o pedido.' }, { status: 400 });
    }

    // 1. Inserir o pedido na base de dados PostgreSQL usando 'pg'
    const orderQuery = `
      INSERT INTO orders (
        customer_name, customer_email, customer_phone, 
        shipping_address, delivery_date, subtotal, 
        shipping_fee, discount, total_amount, notes, status, payment_status, payment_type
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pendente', 'pendente', $11)
      RETURNING id;
    `;

    const orderValues = [
      customer_name, customer_email, customer_phone, 
      shipping_address, delivery_date, subtotal, 
      shipping_fee, discount || 0, total_amount, notes, payment_type
    ];

    const orderResult = await query(orderQuery, orderValues);
    const orderId = orderResult.rows[0].id;

    // 2. Inserir os itens do pedido na tabela 'order_items'
    for (const item of items) {
      const itemQuery = `
        INSERT INTO order_items (order_id, product_name, quantity, unit_price, customization)
        VALUES ($1, $2, $3, $4, $5);
      `;
      const itemValues = [
        orderId, 
        item.product_name, 
        item.quantity, 
        item.unit_price, 
        item.customization ? JSON.stringify(item.customization) : null
      ];
      await query(itemQuery, itemValues);
    }

// 3. Integrar com o Mercado Pago para gerar a Preferência de Pagamento
    const preference = new Preference(client);

    const preferenceResponse = await preference.create({
            body: {
                items: items.map((item: any) => ({
                title: item.product_name,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                })),
                external_reference: String(orderId),
            }
    });

    // 4. Guardar o ID da preferência/pagamento na tabela do pedido
    const updatePaymentQuery = `
      UPDATE orders SET payment_id = $1 WHERE id = $2;
    `;
    await query(updatePaymentQuery, [preferenceResponse.id, orderId]);

    // Retorna o link de redirecionamento do Mercado Pago para o frontend
    return NextResponse.json({ 
      success: true, 
      orderId, 
      init_point: preferenceResponse.init_point, // Link para o checkout do Mercado Pago
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao processar pedido e pagamento:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar o pagamento.' }, { status: 500 });
  }
}