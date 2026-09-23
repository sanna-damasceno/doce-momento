import { NextResponse } from 'next/server';
import { query } from '@/lib/db'; // Usa a função 'query' correta do nosso lib/db.ts

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, whatsapp } = body;

    // Validação básica
    if (!nome || !email || !whatsapp) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }

    // Insere os dados na tabela do PostgreSQL usando a função query
    await query(
      'INSERT INTO leads (nome, email, whatsapp) VALUES ($1, $2, $3)',
      [nome, email, whatsapp]
    );

    return NextResponse.json({ success: true, message: 'Lead cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar lead:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar no banco de dados.' }, { status: 500 });
  }
}