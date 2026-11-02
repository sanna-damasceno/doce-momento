
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { cookies } from 'next/headers';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  customization?: unknown;
}

interface OrderRequest {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  delivery_date: string;
  subtotal: number;
  shipping_fee: number;
  discount?: number;
  total_amount: number;
  items: OrderItem[];
  notes?: string;
  payment_type: string;
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderRequest;

    // 1. Verificar se o usuário está autenticado
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId || !/^\d+$/.test(userId)) {
      return NextResponse.json(
        { error: 'Você precisa estar autenticado para realizar uma compra.' },
        { status: 401 }
      );
    }

    // 2. Consultar o usuário no banco de dados
    const userResult = await query(
      `
        SELECT id, email, email_verified
        FROM public.users
        WHERE id = $1;
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado. Faça login novamente.' },
        { status: 401 }
      );
    }

    const authenticatedUser = userResult.rows[0];

    // 3. Verificar se o e-mail foi validado
    if (authenticatedUser.email_verified !== true) {
      return NextResponse.json(
        {
          error: 'Seu e-mail ainda não foi verificado. Verifique seu cadastro antes de comprar.'
        },
        { status: 403 }
      );
    }
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
      payment_type,
    } = body;

    if (
      !customer_email ||
      customer_email.trim().toLowerCase() !==
        authenticatedUser.email.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: 'O e-mail do pedido deve ser o mesmo da sua conta.' },
        { status: 403 }
      );
    }

    if (!customer_email || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Dados incompletos para criar o pedido.' },
        { status: 400 }
      );
    }



    const deliveryDate = String(delivery_date || '');
    const [year, month, day] = deliveryDate.split('-').map(Number);

    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + 3);

    const validDate =
      /^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) &&
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month - 1 &&
      selectedDate.getDate() === day;

    if (!validDate || selectedDate < minDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'A data de entrega deve ser pelo menos 3 dias após a data do pedido.',
        },
        { status: 400 }
      );
    }

    // 1. Inserir o pedido na base de dados
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
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      delivery_date,
      subtotal,
      shipping_fee,
      discount || 0,
      total_amount,
      notes,
      payment_type,
    ];

    const orderResult = await query(orderQuery, orderValues);
    const orderId = orderResult.rows[0].id;

    // 2. Inserir os itens do pedido
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
        item.customization ? JSON.stringify(item.customization) : null,
      ];

      await query(itemQuery, itemValues);
    }

    // 3. Criar preferência de pagamento no Mercado Pago
    const preference = new Preference(client);

    const mpItems = items.map((item, index) => ({
      id: `${orderId}-${index + 1}`,
      title: item.product_name,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    }));

    // Adicionar taxa de entrega
    mpItems.push({
      id: `${orderId}-shipping`,
      title: 'Taxa de Entrega',
      quantity: 1,
      unit_price: Number(shipping_fee),
    });

    const preferenceResponse = await preference.create({
      body: {
        items: mpItems,
        external_reference: String(orderId),
        notification_url:
          'https://doce-momento-lilac.vercel.app/api/webhook/mercadopago',
      },
    });

    // 4. Guardar o ID da preferência na tabela do pedido
    const updatePaymentQuery = `
      UPDATE orders SET payment_id = $1 WHERE id = $2;
    `;

    await query(updatePaymentQuery, [preferenceResponse.id, orderId]);

    // 5. Retornar o link de pagamento
    return NextResponse.json(
      {
        success: true,
        orderId,
        init_point: preferenceResponse.init_point,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Erro ao processar pedido e pagamento:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Erro interno ao processar o pagamento.';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
