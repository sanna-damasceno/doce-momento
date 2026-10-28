
import { NextResponse } from 'next/server';
import { adminCookie } from '@/lib/admin-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.headers.set('Set-Cookie', adminCookie('', true));
  response.headers.set('Cache-Control', 'no-store');

  return response;
}
