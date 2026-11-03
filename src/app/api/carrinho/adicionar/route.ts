
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const embalagensPermitidas = [
  'Embalagem Simples',
  'Caixa para Presente',
];

export async function POST(request: Request) {
  let client;

  try {
    // 1. Verificar autenticação
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId || !/^\d+$/.test(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faça login para adicionar produtos ao carrinho.',
        },
        { status: 401 }
      );
    }

    // 2. Ler e validar o JSON
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos.' },
        { status: 400 }
      );
    }

    const { produto_id, quantidade, embalagem, observacao } = body;

    // 3. Validar produto
    if (
      typeof produto_id !== 'number' ||
      !Number.isInteger(produto_id) ||
      produto_id <= 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Produto inválido.' },
        { status: 400 }
      );
    }

    // 4. Validar quantidade
    const quantidadeFinal = quantidade ?? 1;

    if (
      typeof quantidadeFinal !== 'number' ||
      !Number.isInteger(quantidadeFinal) ||
      quantidadeFinal < 1 ||
      quantidadeFinal > 99
    ) {
      return NextResponse.json(
        { success: false, error: 'A quantidade deve ser um número inteiro entre 1 e 99.' },
        { status: 400 }
      );
    }

    // 5. Validar embalagem
    const embalagemFinal = embalagem ?? 'Embalagem Simples';

    if (
      typeof embalagemFinal !== 'string' ||
      !embalagensPermitidas.includes(embalagemFinal)
    ) {
      return NextResponse.json(
        { success: false, error: 'Tipo de embalagem inválido.' },
        { status: 400 }
      );
    }

    // 6. Validar observação
    const observacaoFinal = observacao ?? '';

    if (
      typeof observacaoFinal !== 'string' ||
      observacaoFinal.length > 200
    ) {
      return NextResponse.json(
        { success: false, error: 'A observação deve ter no máximo 200 caracteres.' },
        { status: 400 }
      );
    }

    // 7. Consultar banco de dados
    client = await pool.connect();

    const usuario = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (usuario.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não encontrado. Faça login novamente.',
        },
        { status: 401 }
      );
    }

    // 8. Confirmar que o produto existe
    const produto = await client.query(
      'SELECT id FROM produtos WHERE id = $1',
      [produto_id]
    );

    if (produto.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado.' },
        { status: 404 }
      );
    }

    // 9. Adicionar ao carrinho
    await client.query(
      `INSERT INTO carrinho_itens
        (usuario_id, produto_id, quantidade, embalagem, observacao)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        produto_id,
        quantidadeFinal,
        embalagemFinal,
        observacaoFinal.trim(),
      ]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro na API do carrinho:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Não foi possível adicionar o produto ao carrinho.',
      },
      { status: 500 }
    );

  } finally {
    client?.release();
  }
}
