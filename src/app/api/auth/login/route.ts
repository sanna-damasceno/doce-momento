import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Validação básica
    if (!email || !password) {
      return NextResponse.json({ error: 'Preencha o e-mail e a senha.' }, { status: 400 });
    }

    // 2. Procurar o utilizador pelo e-mail na base de dados
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const result = await query(userQuery, [email]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
    }

    const user = result.rows[0];

    // 3. Verificar a palavra-passe com o bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
    }

    // 4. Gravar o cookie 'user_id' com a sessão do utilizador logado
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'user_id',
      value: String(user.id),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias de sessão válida
    });

    // 5. Sucesso no login (Apenas 2 argumentos: os dados e o status 200)
    return NextResponse.json({
      success: true,
      message: 'Login efetuado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao efetuar login:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o login.' }, { status: 500 });
  }
}