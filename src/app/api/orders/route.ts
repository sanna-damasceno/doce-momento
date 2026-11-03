
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { cookies } from 'next/headers';

interface OrderItem {
  product_id: number;
  quantity: number;
  customization?: {
    embalagem?: string;
    observacao?: string;
  };
}

interface OrderRequest {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  delivery_date: string;
  items: OrderItem[];
  notes?: string;
  payment_type: string;
  ga_client_id?: string | null;
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
});

const TAXA_ENTREGA = 0.01;
const PRECO_EMBALAGEM_PRESENTE = 5.00;
const EMBALAGENS_PERMITIDAS = [
  'Embalagem Simples',
  'Caixa para Presente',
];

function obterDataMinimaEntrega() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Manaus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const ano = Number(partes.find(p => p.type === 'year')?.value);
  const mes = Number(partes.find(p => p.type === 'month')?.value);
  const dia = Number(partes.find(p => p.type === 'day')?.value);

  const data = new Date(Date.UTC(ano, mes - 1, dia + 3));

  return data.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    // 1. Ler e validar o corpo da requisição
    let body: OrderRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Dados do pedido inválidos.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Dados do pedido inválidos.' },
        { status: 400 }
      );
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      delivery_date,
      items,
      notes,
      payment_type,
      ga_client_id,
    } = body;

    // 2. Verificar autenticação
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId || !/^\d+$/.test(userId)) {
      return NextResponse.json(
        { error: 'Você precisa estar autenticado para realizar uma compra.' },
        { status: 401 }
      );
    }

    // 3. Consultar usuário
    const userResult = await query(
      `SELECT id, email, email_verified
       FROM public.users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado. Faça login novamente.' },
        { status: 401 }
      );
    }

    const authenticatedUser = userResult.rows[0];

    if (authenticatedUser.email_verified !== true) {
      return NextResponse.json(
        { error: 'Seu e-mail ainda não foi verificado.' },
        { status: 403 }
      );
    }

    // 4. Validar dados pessoais e de entrega
    if (
      typeof customer_name !== 'string' ||
      !customer_name.trim() ||
      typeof customer_email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email.trim()) ||
      typeof customer_phone !== 'string' ||
      !/^\d{10,13}$/.test(customer_phone.replace(/\D/g, '')) ||
      typeof shipping_address !== 'string' ||
      !shipping_address.trim() ||
      shipping_address.trim().length > 500
    ) {
      return NextResponse.json(
        { error: 'Verifique os dados pessoais e o endereço de entrega.' },
        { status: 400 }
      );
    }

    if (
      customer_email.trim().toLowerCase() !==
      authenticatedUser.email.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: 'O e-mail do pedido deve ser o mesmo da sua conta.' },
        { status: 403 }
      );
    }

    // 5. Validar observações
    if (
      notes !== undefined &&
      (typeof notes !== 'string' || notes.length > 200)
    ) {
      return NextResponse.json(
        { error: 'As observações devem ter no máximo 200 caracteres.' },
        { status: 400 }
      );
    }

    // 6. Validar forma de pagamento
    if (!['credit_card', 'pix'].includes(payment_type)) {
      return NextResponse.json(
        { error: 'Forma de pagamento inválida.' },
        { status: 400 }
      );
    }

    // 7. Validar data de entrega
    if (
      typeof delivery_date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(delivery_date)
    ) {
      return NextResponse.json(
        { error: 'Data de entrega inválida.' },
        { status: 400 }
      );
    }

    const [ano, mes, dia] = delivery_date.split('-').map(Number);
    const dataSelecionada = new Date(Date.UTC(ano, mes - 1, dia));

    const dataReal =
      dataSelecionada.getUTCFullYear() === ano &&
      dataSelecionada.getUTCMonth() === mes - 1 &&
      dataSelecionada.getUTCDate() === dia;

    if (
      !dataReal ||
      delivery_date < obterDataMinimaEntrega()
    ) {
      return NextResponse.json(
        {
          error: 'A data de entrega deve ser pelo menos 3 dias após a data do pedido.',
        },
        { status: 400 }
      );
    }

    // 8. Validar itens do pedido
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json(
        { error: 'O pedido deve conter entre 1 e 50 itens.' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (
        !Number.isInteger(item.product_id) ||
        item.product_id <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99
      ) {
        return NextResponse.json(
          { error: 'Produto ou quantidade inválidos.' },
          { status: 400 }
        );
      }

      const embalagem =
        item.customization?.embalagem || 'Embalagem Simples';

      const observacao = item.customization?.observacao || '';

      if (
        !EMBALAGENS_PERMITIDAS.includes(embalagem) ||
        typeof observacao !== 'string' ||
        observacao.length > 200
      ) {
        return NextResponse.json(
          { error: 'Embalagem ou observação de produto inválida.' },
          { status: 400 }
        );
      }
    }

    // 9. Buscar preços reais dos produtos no banco
    const idsProdutos = [...new Set(items.map(item => item.product_id))];

    const produtosResult = await query(
      `SELECT id, nome, preco, preco_promocional
       FROM public.produtos
       WHERE id = ANY($1::int[])`,
      [idsProdutos]
    );

    if (produtosResult.rows.length !== idsProdutos.length) {
      return NextResponse.json(
        { error: 'Um ou mais produtos não foram encontrados.' },
        { status: 400 }
      );
    }

    const produtosMap = new Map(
      produtosResult.rows.map(produto => [
        Number(produto.id),
        produto,
      ])
    );

    // 10. Calcular valores usando os preços do banco
    let subtotalProdutos = 0;
    let custoEmbalagens = 0;

    const itensCalculados = items.map(item => {
      const produto = produtosMap.get(item.product_id);

      if (!produto) {
        throw new Error('Produto não encontrado.');
      }

      const precoNormal = Number(produto.preco);
      const precoPromocional =
        produto.preco_promocional == null
          ? null
          : Number(produto.preco_promocional);

      const preco =
        precoPromocional !== null &&
        precoPromocional > 0 &&
        precoPromocional < precoNormal
          ? precoPromocional
          : precoNormal;

      if (!Number.isFinite(preco) || preco < 0) {
        throw new Error('Preço de produto inválido no cadastro.');
      }

      const embalagem =
        item.customization?.embalagem || 'Embalagem Simples';

      const observacao =
        item.customization?.observacao?.trim() || '';

      const valorEmbalagem =
        embalagem === 'Caixa para Presente'
          ? PRECO_EMBALAGEM_PRESENTE
          : 0;

      subtotalProdutos += preco * item.quantity;
      custoEmbalagens += valorEmbalagem;

      return {
        product_name: produto.nome,
        quantity: item.quantity,
        unit_price: preco,
        customization: JSON.stringify({
          embalagem,
          observacao,
        }),
      };
    });

    const subtotal = subtotalProdutos + custoEmbalagens;
    const discount = 0;
    const totalAmount = subtotal + TAXA_ENTREGA;

    // 11. Criar pedido no banco
    const orderResult = await query(
      `INSERT INTO orders (
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        delivery_date,
        subtotal,
        shipping_fee,
        discount,
        total_amount,
        notes,
        status,
        payment_status,
        payment_type,
        ga_client_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        'Pendente', 'pendente', $11, $12)
      RETURNING id`,
      [
        customer_name.trim(),
        authenticatedUser.email,
        customer_phone.trim(),
        shipping_address.trim(),
        delivery_date,
        subtotal,
        TAXA_ENTREGA,
        discount,
        totalAmount,
        notes?.trim() || '',
        payment_type,
        typeof ga_client_id === 'string' && ga_client_id.length <= 100
          ? ga_client_id
          : null,
      ]
    );

    const orderId = orderResult.rows[0].id;

    // 12. Inserir itens do pedido
    for (const item of itensCalculados) {
      await query(
        `INSERT INTO order_items (
          order_id,
          product_name,
          quantity,
          unit_price,
          customization
        )
        VALUES ($1, $2, $3, $4, $5)`,
        [
          orderId,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.customization,
        ]
      );
    }

    // 13. Criar preferência de pagamento no Mercado Pago
    const preference = new Preference(client);

    const mpItems = itensCalculados.map((item, index) => ({
      id: `${orderId}-${index + 1}`,
      title: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    // Cobrar embalagens para presente separadamente
    if (custoEmbalagens > 0) {
      mpItems.push({
        id: `${orderId}-gift`,
        title: 'Embalagem para Presente',
        quantity: 1,
        unit_price: custoEmbalagens,
      });
    }

    mpItems.push({
      id: `${orderId}-shipping`,
      title: 'Taxa de Entrega',
      quantity: 1,
      unit_price: TAXA_ENTREGA,
    });

    const preferenceResponse = await preference.create({
      body: {
        items: mpItems,
        external_reference: String(orderId),
        notification_url:
          'https://doce-momento-lilac.vercel.app/api/webhook/mercadopago',
      },
    });

    // 14. Salvar preferência de pagamento
    await query(
      'UPDATE orders SET payment_id = $1 WHERE id = $2',
      [preferenceResponse.id, orderId]
    );

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

    return NextResponse.json(
      { error: 'Não foi possível processar o pedido. Tente novamente.' },
      { status: 500 }
    );
  }
}
