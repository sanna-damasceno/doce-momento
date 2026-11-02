
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    // 1. Ler e validar os dados recebidos
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Dados enviados em formato inválido.' },
        { status: 400 }
      );
    }

    const { email, password } = body ?? {};

    // 2. Verificar os campos obrigatórios e seus tipos
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password.trim()
    ) {
      return NextResponse.json(
        { error: 'Preencha o e-mail e a senha.' },
        { status: 400 }
      );
    }

    // 3. Validar o formato do e-mail
    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Informe um endereço de e-mail válido.' },
        { status: 400 }
      );
    }

    // 4. Procurar o utilizador pelo e-mail
    const userQuery = `
      SELECT *
      FROM public.users
      WHERE LOWER(TRIM(email)) = $1
    `;

    const result = await query(userQuery, [normalizedEmail]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // 5. Verificar a senha
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    // 6. Criar o cookie de sessão
    const cookieStore = await cookies();

    cookieStore.set({
      name: 'user_id',
      value: String(user.id),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // 7. Retornar sucesso
    return NextResponse.json(
      {
        success: true,
        message: 'Login efetuado com sucesso!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao efetuar login:', error);

    return NextResponse.json(
      { error: 'Erro interno ao processar o login.' },
      { status: 500 }
    );
  }
}
