
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  let client;

  try {
    // 1. Verificar se o usuário está autenticado
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

    // 2. Validar os dados enviados
    const body = await request.json();
    const { produto_id, quantidade, embalagem, observacao } = body;

    if (
      !Number.isInteger(Number(produto_id)) ||
      Number(produto_id) <= 0 ||
      !Number.isInteger(Number(quantidade ?? 1)) ||
      Number(quantidade ?? 1) <= 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Produto ou quantidade inválidos.' },
        { status: 400 }
      );
    }

    // 3. Confirmar que o usuário existe no banco
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

    // 4. Inserir o item no carrinho
    await client.query(
      `INSERT INTO carrinho_itens
        (usuario_id, produto_id, quantidade, embalagem, observacao)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        Number(produto_id),
        Number(quantidade ?? 1),
        embalagem || 'Embalagem Simples',
        observacao || '',
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
    // 5. Liberar a conexão mesmo se ocorrer um erro
    client?.release();
  }
}
