import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'E-mail e código são obrigatórios.' },
        { status: 400 }
      );
    }

    // 1. Procurar o último OTP gerado para este e-mail que ainda não foi marcado como usado
    const selectQuery = `
      SELECT * FROM otps 
      WHERE email = $1 AND used = FALSE 
      ORDER BY created_at DESC 
      LIMIT 1;
    `;
    const result = await query(selectQuery, [email]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum código pendente encontrado para este e-mail.' },
        { status: 404 }
      );
    }

    const otpRecord = result.rows[0];

    // 2. Verificar limite de tentativas (ex: máximo de 3 tentativas)
    if (otpRecord.attempts >= 3) {
      return NextResponse.json(
        { error: 'Limite de tentativas excedido. Solicite um novo código.' },
        { status: 403 }
      );
    }

    // 3. Verificar expiração temporal
    const now = new Date();
    if (new Date(otpRecord.expires_at) < now) {
      return NextResponse.json(
        { error: 'O código expirou. Por favor, solicite um novo.' },
        { status: 410 }
      );
    }

    // 4. Calcular o hash do código recebido para comparação
    const inputCodeHash = crypto.createHash('sha256').update(code.toString()).digest('hex');

    // 5. Comparar os hashes
    if (inputCodeHash !== otpRecord.code_hash) {
      // Incrementar contador de tentativas falhadas na base de dados
      await query(
        'UPDATE otps SET attempts = attempts + 1 WHERE id = $1;',
        [otpRecord.id]
      );

      const remainingAttempts = 3 - (otpRecord.attempts + 1);
      return NextResponse.json(
        { 
          error: `Código incorreto. Restam ${Math.max(0, remainingAttempts)} tentativa(s).` 
        },
        { status: 400 }
      );
    }

    // 6. Sucesso! Marcar o OTP como utilizado
    await query(
      'UPDATE otps SET used = TRUE WHERE id = $1;',
      [otpRecord.id]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Código validado com sucesso! Autenticação concluída.'
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