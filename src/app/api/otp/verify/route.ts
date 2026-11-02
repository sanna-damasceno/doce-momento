import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // 1. Ler os dados recebidos
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Dados inválidos.' },
        { status: 400 }
      );
    }

    const { email, code } = body;

    // 2. Validar os campos
    if (
      typeof email !== 'string' ||
      typeof code !== 'string' ||
      !email.trim() ||
      !code.trim()
    ) {
      return NextResponse.json(
        { error: 'E-mail e código são obrigatórios.' },
        { status: 400 }
      );
    }

    // 3. Normalizar o e-mail
    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Informe um e-mail válido.' },
        { status: 400 }
      );
    }

    // 4. Validar o formato do código
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'O código deve conter exatamente 6 dígitos.' },
        { status: 400 }
      );
    }

    // 5. Buscar o último código não utilizado
    const selectQuery = `
      SELECT *
      FROM public.otps
      WHERE LOWER(TRIM(email)) = $1
        AND used = FALSE
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    const result = await query(selectQuery, [normalizedEmail]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum código pendente encontrado para este e-mail.' },
        { status: 404 }
      );
    }

    const otpRecord = result.rows[0];

    // 6. Verificar o limite de tentativas
    if (otpRecord.attempts >= 3) {
      return NextResponse.json(
        {
          error: 'Limite de tentativas excedido. Solicite um novo código.'
        },
        { status: 403 }
      );
    }

    // 7. Verificar a expiração do código
    const now = new Date();

    if (new Date(otpRecord.expires_at).getTime() <= now.getTime()) {
      return NextResponse.json(
        { error: 'O código expirou. Por favor, solicite um novo.' },
        { status: 410 }
      );
    }

    // 8. Gerar o hash do código recebido
    const inputCodeHash = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    // 9. Comparar os hashes de maneira segura
    const inputBuffer = Buffer.from(inputCodeHash, 'hex');
    const storedBuffer = Buffer.from(otpRecord.code_hash, 'hex');

    const isValid =
      inputBuffer.length === storedBuffer.length &&
      crypto.timingSafeEqual(inputBuffer, storedBuffer);

    if (!isValid) {
      // Incrementar tentativas incorretas
      await query(
        `
          UPDATE public.otps
          SET attempts = attempts + 1
          WHERE id = $1;
        `,
        [otpRecord.id]
      );

      const remainingAttempts = Math.max(
        0,
        3 - (otpRecord.attempts + 1)
      );

      return NextResponse.json(
        {
          error: `Código incorreto. Restam ${remainingAttempts} tentativa(s).`
        },
        { status: 400 }
      );
    }

    // 10. Marcar o código como utilizado e registrar a verificação
    await query(
      `
        UPDATE public.otps
        SET used = TRUE,
            verified_at = CURRENT_TIMESTAMP
        WHERE id = $1;
      `,
      [otpRecord.id]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Código validado com sucesso!'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao verificar OTP:', error);

    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}