import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value; 

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Utilizador não autenticado' }, { status: 401 });
    }

    const client = await pool.connect();
    
    // Consulta correta baseada na sua tabela 'users'
    const result = await client.query(`
      SELECT name, email, phone FROM users WHERE id = $1;
    `, [userId]);
    
    client.release();

    if (result.rows.length > 0) {
      const user = result.rows[0];
      return NextResponse.json({ 
        success: true, 
        usuario: { 
          nome: user.name,     // Mapeado para o front-end ler como 'nome'
          email: user.email, 
          telefone: user.phone // Mapeado para o front-end ler como 'telefone'
        } 
      });
    } else {
      return NextResponse.json({ success: false, error: 'Utilizador não encontrado' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}