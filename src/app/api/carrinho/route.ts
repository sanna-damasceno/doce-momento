
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Função auxiliar para obter o ID do utilizador logado
async function getUserId() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  return userId ? parseInt(userId, 10) : null;
}

// GET: Lista os itens do carrinho do utilizador logado
export async function GET() {
  let client;

  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilizador não autenticado' },
        { status: 401 }
      );
    }

    client = await pool.connect();

    const query = `
      SELECT
        c.id as carrinho_item_id,
        c.quantidade,
        c.embalagem,
        c.mensagem,
        p.id as produto_id,
        p.nome,
        p.categoria,
        p.preco,
        p.imagem,
        p.slug
      FROM carrinho_itens c
      JOIN produtos p ON c.produto_id = p.id
      WHERE c.usuario_id = $1
      ORDER BY c.id ASC;
    `;

    const result = await client.query(query, [userId]);

    return NextResponse.json({
      success: true,
      itens: result.rows,
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar carrinho:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Erro interno ao buscar carrinho.';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}

// POST: Adiciona um produto ao carrinho
export async function POST(request: Request) {
  let client;

  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilizador não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      produto_id,
      quantidade = 1,
      embalagem,
      mensagem,
    } = body;

    client = await pool.connect();

    // Verificar se o produto já existe no carrinho
    const checkQuery = `
      SELECT id, quantidade
      FROM carrinho_itens
      WHERE usuario_id = $1
        AND produto_id = $2
        AND COALESCE(embalagem, '') = COALESCE($3, '')
    `;

    const existing = await client.query(checkQuery, [
      userId,
      produto_id,
      embalagem,
    ]);

    if (existing.rows.length > 0) {
      const novoQtd = existing.rows[0].quantidade + quantidade;

      await client.query(
        'UPDATE carrinho_itens SET quantidade = $1 WHERE id = $2',
        [novoQtd, existing.rows[0].id]
      );
    } else {
      const insertQuery = `
        INSERT INTO carrinho_itens (
          usuario_id,
          produto_id,
          quantidade,
          embalagem,
          mensagem
        )
        VALUES ($1, $2, $3, $4, $5)
      `;

      await client.query(insertQuery, [
        userId,
        produto_id,
        quantidade,
        embalagem,
        mensagem,
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Produto adicionado ao carrinho com sucesso!',
    });
  } catch (error: unknown) {
    console.error('Erro ao adicionar ao carrinho:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Erro interno ao adicionar produto.';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}

// DELETE: Remove um item ou limpa o carrinho inteiro
export async function DELETE(request: Request) {
  let client;

  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilizador não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limparTudo = searchParams.get('limpar');

    client = await pool.connect();

    if (limparTudo === 'true') {
      await client.query(
        'DELETE FROM carrinho_itens WHERE usuario_id = $1',
        [userId]
      );
    } else if (id) {
      await client.query(
        'DELETE FROM carrinho_itens WHERE id = $1 AND usuario_id = $2',
        [id, userId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Erro ao remover do carrinho:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Erro interno ao remover item.';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}
