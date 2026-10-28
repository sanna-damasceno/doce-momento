
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const paginasRestritas = [
    '/carrinho',
    '/pedidos',
    '/perfil',
  ];

  const precisaLogin = paginasRestritas.some(
    (pagina) =>
      pathname === pagina || pathname.startsWith(`${pagina}/`)
  );

  if (precisaLogin) {
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      const urlLogin = new URL('/login', request.url);
      urlLogin.searchParams.set('redirect', pathname);

      return NextResponse.redirect(urlLogin);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/carrinho/:path*',
    '/pedidos/:path*',
    '/perfil/:path*',
  ],
};
