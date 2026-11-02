
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    // 1. Ler os dados recebidos
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Dados enviados em formato inválido.' },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      action,
    } = body ?? {};

    // 2. Validar os tipos dos campos
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof phone !== 'string' ||
      typeof password !== 'string' ||
      typeof confirmPassword !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    // 3. Validar campos obrigatórios
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    // 4. Validar a ação solicitada
    if (!['INIT_REGISTER', 'COMPLETE_REGISTER'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida.' },
        { status: 400 }
      );
    }

    // 5. Normalizar os dados
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // 6. Validar nome
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      return NextResponse.json(
        { error: 'O nome deve ter entre 2 e 100 caracteres.' },
        { status: 400 }
      );
    }

    // 7. Validar e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Informe um endereço de e-mail válido.' },
        { status: 400 }
      );
    }

    // 8. Validar telefone brasileiro
    const phoneDigits = normalizedPhone.replace(/\D/g, '');

    if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
      return NextResponse.json(
        { error: 'Informe um telefone válido com DDD.' },
        { status: 400 }
      );
    }

    // 9. Validar senha
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'As senhas não coincidem.' },
        { status: 400 }
      );
    }

    // 10. Verificar se o e-mail já está cadastrado
    const existingUser = await query(
      `
        SELECT id
        FROM public.users
        WHERE LOWER(TRIM(email)) = $1
      `,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este e-mail já está em uso.' },
        { status: 400 }
      );
    }

    // AÇÃO 1: INICIAR REGISTRO
    if (action === 'INIT_REGISTER') {
      return NextResponse.json({
        success: true,
        message: 'Dados válidos. Solicite a verificação OTP.',
      });
    }

    // AÇÃO 2: FINALIZAR REGISTRO

    // 11. Confirmar que existe um OTP validado para o e-mail
    const otpVerification = await query(
      `
        SELECT id
        FROM public.otps
        WHERE LOWER(TRIM(email)) = $1
          AND used = TRUE
          AND verified_at IS NOT NULL
          AND verified_at >= NOW() - INTERVAL '15 minutes'
        ORDER BY verified_at DESC
        LIMIT 1;
      `,
      [normalizedEmail]
    );

    if (otpVerification.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'E-mail não verificado ou prazo de verificação expirado. Valide seu código novamente.',
        },
        { status: 403 }
      );
    }

    // 12. Criptografar a senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 13. Criar usuário com e-mail verificado
    const insertQuery = `
      INSERT INTO public.users (
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
      normalizedName,
      normalizedEmail,
      normalizedPhone,
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

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);

    return NextResponse.json(
      { error: 'Erro interno ao criar conta.' },
      { status: 500 }
    );
  }
}
