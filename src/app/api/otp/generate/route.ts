import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request: Request) {
  try {
    // 1. Ler e validar os dados recebidos
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Dados inválidos.' },
        { status: 400 }
      );
    }

    const { email } = body;

    if (typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'O e-mail é obrigatório.' },
        { status: 400 }
      );
    }

    // 2. Normalizar o e-mail
    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Informe um e-mail válido.' },
        { status: 400 }
      );
    }

    // 3. Gerar código seguro de 6 dígitos
    const otpCode = crypto.randomInt(100000, 1000000).toString();

    // 4. Criar hash SHA-256 do código
    const codeHash = crypto
      .createHash('sha256')
      .update(otpCode)
      .digest('hex');

    // 5. Definir expiração em 5 minutos
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 6. Salvar o código no banco de dados
    const result = await query(
      `
        INSERT INTO public.otps
          (email, code_hash, expires_at, attempts, used)
        VALUES ($1, $2, $3, 0, FALSE)
        RETURNING id, email, expires_at;
      `,
      [normalizedEmail, codeHash, expiresAt]
    );

    const otpId = result.rows[0].id;

    // 7. Enviar o código por e-mail
    try {
      await transporter.sendMail({
        from: `"Doce Momento" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: 'Seu Código de Verificação - Doce Momento',
        html: `
          <div style="font-family: Arial, sans-serif; color: #3D2C1E; padding: 20px; background-color: #FDFBF7; border-radius: 8px;">
            <h2 style="color: #C94A67;">Doce Momento - Confirmação de Segurança</h2>
            <p>Olá,</p>
            <p>O seu código de verificação para concluir o cadastro é:</p>

            <div style="background: #F5EBE6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #3D2C1E; border-radius: 6px; margin: 20px 0;">
              ${otpCode}
            </div>

            <p>Este código expira em <strong>5 minutos</strong>.</p>
            <p style="font-size: 12px; color: #8C7A6B; margin-top: 30px;">
              Se não solicitou este código, por favor ignore esta mensagem.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      // Se o envio falhar, invalida o código que foi salvo
      await query(
        'UPDATE public.otps SET used = TRUE WHERE id = $1',
        [otpId]
      );

      throw emailError;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Código enviado com sucesso para o e-mail.',
        data: result.rows[0],
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erro ao gerar/enviar OTP por e-mail:', error);

    return NextResponse.json(
      { error: 'Erro ao enviar o e-mail de verificação.' },
      { status: 500 }
    );
  }
}