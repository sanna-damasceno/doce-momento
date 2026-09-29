import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    // 1. Validar se o utilizador está logado pelo cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilizador não autenticado. Faça login para adicionar ao carrinho.' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { produto_id, quantidade, embalagem, observacao } = body;
    
    const client = await pool.connect();

    // 2. Inserir associado ao ID real do utilizador logado ($1)
    const insertQuery = `
      INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade, embalagem, observacao)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await client.query(insertQuery, [
      userId, 
      produto_id, 
      quantidade || 1, 
      embalagem || 'Embalagem Simples', 
      observacao || ''
    ]);

    client.release();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DETALHE DO ERRO NA API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}