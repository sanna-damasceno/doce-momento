
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, phone, password, action } = await request.json();

    // Validação básica dos campos
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }

    // AÇÃO 1: INICIAR REGISTRO
    if (action === 'INIT_REGISTER') {
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'Este e-mail já está em uso.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Dados válidos. Solicite a verificação OTP.',
      });
    }

    // AÇÃO 2: FINALIZAR REGISTRO
    if (action === 'COMPLETE_REGISTER') {

      // 1. Confirmar que existe um OTP validado para o e-mail
      const otpVerification = await query(
        `
          SELECT id
          FROM otps
          WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
            AND used = TRUE
            AND verified_at IS NOT NULL
            AND verified_at >= NOW() - INTERVAL '15 minutes'
          ORDER BY verified_at DESC
          LIMIT 1;
        `,
        [email]
      );

      if (otpVerification.rows.length === 0) {
        return NextResponse.json(
          {
            error: 'E-mail não verificado ou prazo de verificação expirado. Valide seu código novamente.',
          },
          { status: 403 }
        );
      }

      // 2. Verificar novamente se o usuário já foi cadastrado
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'Este e-mail já foi cadastrado.' },
          { status: 400 }
        );
      }

      // 3. Criptografar a senha
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 4. Criar usuário com e-mail verificado
      const insertQuery = `
        INSERT INTO users (
          name,
          email,
          phone,
          password_hash,
          email_verified
        )
        VALUES ($1, $2, $3, $4, TRUE)
        RETURNING id, name, email, phone, email_verified;
      `;

      const newUser = await query(insertQuery, [
        name,
        email,
        phone,
        passwordHash,
      ]);

      return NextResponse.json(
        {
          success: true,
          message: 'Conta criada e e-mail verificado com sucesso!',
          user: newUser.rows[0],
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: 'Ação inválida.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);

    return NextResponse.json(
      { error: 'Erro interno ao criar conta.' },
      { status: 500 }
    );
  }
}
