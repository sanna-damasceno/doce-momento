
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import {
  adminCookie,
  createAdminSession,
} from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    return NextResponse.json(
      { error: 'Senha administrativa não configurada.' },
      { status: 500 }
    );
  }

  let password: unknown;

  try {
    const body = await request.json();
    password = body.password;
  } catch {
    return NextResponse.json(
      { error: 'Requisição inválida.' },
      { status: 400 }
    );
  }

  if (typeof password !== 'string' || password.length > 1024) {
    return NextResponse.json(
      { error: 'Senha inválida.' },
      { status: 401 }
    );
  }

  const received = Buffer.from(password);
  const expected = Buffer.from(configuredPassword);

  const valid =
    received.length === expected.length &&
    timingSafeEqual(received, expected);

  if (!valid) {
    return NextResponse.json(
      { error: 'Senha incorreta.' },
      { status: 401 }
    );
  }

  const token = createAdminSession();

  const response = NextResponse.json({ success: true });

  response.headers.set('Set-Cookie', adminCookie(token));
  response.headers.set('Cache-Control', 'no-store');

  return response;
}
