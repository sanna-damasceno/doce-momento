import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Função auxiliar para validar e pegar o ID do utilizador logado
async function getUserId() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  return userId ? parseInt(userId, 10) : null;
}

// GET: Lista os itens reais do carrinho do utilizador logado
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Utilizador não autenticado' }, { status: 401 });
    }

    const client = await pool.connect();
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
    client.release();

    return NextResponse.json({ success: true, itens: result.rows });
  } catch (error: any) {
    console.error('Erro ao buscar carrinho:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Adiciona um produto ao carrinho na base de dados para o utilizador logado
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Utilizador não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { produto_id, quantidade = 1, embalagem, mensagem } = body;

    const client = await pool.connect();
    
    // Verificar se o item já existe no carrinho com a mesma embalagem/mensagem para este utilizador
    const checkQuery = `
      SELECT id, quantidade FROM carrinho_itens 
      WHERE usuario_id = $1 AND produto_id = $2 AND COALESCE(embalagem, '') = COALESCE($3, '')
    `;
    const existing = await client.query(checkQuery, [userId, produto_id, embalagem]);

    if (existing.rows.length > 0) {
      const novoQtd = existing.rows[0].quantidade + quantidade;
      await client.query('UPDATE carrinho_itens SET quantidade = $1 WHERE id = $2', [novoQtd, existing.rows[0].id]);
    } else {
      const insertQuery = `
        INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade, embalagem, mensagem)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(insertQuery, [userId, produto_id, quantidade, embalagem, mensagem]);
    }

    client.release();
    return NextResponse.json({ success: true, message: 'Produto adicionado ao carrinho com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao adicionar ao carrinho:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove um item ou limpa o carrinho inteiro do utilizador logado
export async function DELETE(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Utilizador não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limparTudo = searchParams.get('limpar');

    const client = await pool.connect();

    if (limparTudo === 'true') {
      await client.query('DELETE FROM carrinho_itens WHERE usuario_id = $1', [userId]);
    } else if (id) {
      await client.query('DELETE FROM carrinho_itens WHERE id = $1 AND usuario_id = $2', [id, userId]);
    }

    client.release();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao remover do carrinho:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}