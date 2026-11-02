
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  let client;

  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilizador não autenticado' },
        { status: 401 }
      );
    }

    client = await pool.connect();

    // Consulta os dados do utilizador na tabela users
    const result = await client.query(
      `
        SELECT name, email, phone
        FROM users
        WHERE id = $1;
      `,
      [userId]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];

      return NextResponse.json({
        success: true,
        usuario: {
          nome: user.name,
          email: user.email,
          telefone: user.phone,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Utilizador não encontrado' },
      { status: 404 }
    );

  } catch (error: unknown) {
    console.error('Erro ao buscar utilizador:', error);

    const mensagem =
      error instanceof Error
        ? error.message
        : 'Erro interno ao buscar utilizador.';

    return NextResponse.json(
      { success: false, error: mensagem },
      { status: 500 }
    );

  } finally {
    client?.release();
  }
}
