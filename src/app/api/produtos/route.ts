import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Certifique-se de que a variável DATABASE_URL está definida no seu ficheiro .env.local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM produtos ORDER BY id ASC');
    client.release();

    return NextResponse.json({ success: true, produtos: result.rows });
  } catch (error: any) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao conectar à base de dados' },
      { status: 500 }
    );
  }
}