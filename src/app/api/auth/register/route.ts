import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, phone, password, action, code } = await request.json();

    // VALIDAÇÃO BÁSICA DOS CAMPOS
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }

    // AÇÃO 1: INICIAR REGISTRO (Antes de verificar o OTP)
    if (action === 'INIT_REGISTER') {
      // 1. Verificar se o e-mail já está cadastrado no banco 'users'
      const checkUserQuery = 'SELECT * FROM users WHERE email = $1';
      const existingUser = await query(checkUserQuery, [email]);

      if (existingUser.rows.length > 0) {
        return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 400 });
      }

      // Tudo certo! Dispara o envio do OTP chamando a sua rota existente '/api/otp/generate'
      return NextResponse.json({
        success: true,
        message: 'Dados válidos. Solicite a verificação OTP.',
      }, { status: 200 });
    }

    // AÇÃO 2: FINALIZAR REGISTRO (Após o OTP ter sido verificado com sucesso no frontend)
    if (action === 'COMPLETE_REGISTER') {
      // Verificar novamente se o usuário não foi criado enquanto ele digitava o OTP
      const checkUserQuery = 'SELECT * FROM users WHERE email = $1';
      const existingUser = await query(checkUserQuery, [email]);

      if (existingUser.rows.length > 0) {
        return NextResponse.json({ error: 'Este e-mail já foi cadastrado.' }, { status: 400 });
      }

      // Encriptar a senha
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Salvar o usuário na tabela 'users'
      const insertQuery = `
        INSERT INTO users (name, email, phone, password_hash) 
        VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone;
      `;
      const newUser = await query(insertQuery, [name, email, phone, passwordHash]);

      return NextResponse.json({ 
        success: true, 
        message: 'Conta criada e e-mail verificado com sucesso!',
        user: newUser.rows[0] 
      }, { status: 201 });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return NextResponse.json({ error: 'Erro interno ao criar conta.' }, { status: 500 });
  }
}