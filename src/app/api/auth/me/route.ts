
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

    if (!userId || !/^\d+$/.test(userId)) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const result = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);

    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}
