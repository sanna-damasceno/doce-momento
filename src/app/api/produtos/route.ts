
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  let client;

  try {
    client = await pool.connect();

    const result = await client.query(
      'SELECT * FROM produtos ORDER BY id ASC'
    );

    return NextResponse.json({
      success: true,
      produtos: result.rows,
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar produtos:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Erro ao conectar à base de dados';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}
