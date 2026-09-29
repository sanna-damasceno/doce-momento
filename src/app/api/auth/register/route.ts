import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    // 1. Incluir o 'phone' na desestruturação dos dados recebidos
    const { name, email, phone, password } = await request.json();

    // 2. Validação básica (pode incluir o phone se obrigatório)
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }

    // 3. Verificar se o e-mail já está registado
    const checkUserQuery = 'SELECT * FROM users WHERE email = $1';
    const existingUser = await query(checkUserQuery, [email]);

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 400 });
    }

    // 4. Encriptar a senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Inserir o utilizador INCLUINDO o 'phone' ($4) na base de dados
    const insertQuery = `
      INSERT INTO users (name, email, phone, password_hash) 
      VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone;
    `;
    const newUser = await query(insertQuery, [name, email, phone, passwordHash]);

    return NextResponse.json({ 
      success: true, 
      message: 'Conta criada com sucesso!',
      user: newUser.rows[0] 
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao registar utilizador:', error);
    return NextResponse.json({ error: 'Erro interno ao criar conta.' }, { status: 500 });
  }
}