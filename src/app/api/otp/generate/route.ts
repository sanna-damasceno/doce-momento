import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Configuração do transportador do Nodemailer com o Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'O e-mail é obrigatório.' }, { status: 400 });
    }

    // 1. Gerar o código de 6 dígitos
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Criar o hash SHA-256
    const codeHash = crypto.createHash('sha256').update(otpCode).digest('hex');

    // 3. Expiração em 5 minutos
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 4. Inserir na base de dados
    const sqlQuery = `
      INSERT INTO otps (email, code_hash, expires_at, attempts, used)
      VALUES ($1, $2, $3, 0, FALSE)
      RETURNING id, email, expires_at;
    `;
    const result = await query(sqlQuery, [email, codeHash, expiresAt]);

    // 5. Enviar o e-mail real para o cliente
    await transporter.sendMail({
      from: `"Doce Momento" <${process.env.EMAIL_USER}>`,
      to: email,
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
          <p style="font-size: 12px; color: #8C7A6B; margin-top: 30px;">Se não solicitou este código, por favor ignore esta mensagem.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Código enviado com sucesso para o e-mail.',
      data: result.rows[0],
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao gerar/enviar OTP por e-mail:', error);
    return NextResponse.json({ error: 'Erro ao enviar o e-mail de verificação.' }, { status: 500 });
  }
}