
import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000;

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET não configurada corretamente.');
  }

  return secret;
}

function sign(value: string) {
  return createHmac('sha256', getSecret())
    .update(value)
    .digest('hex');
}

export function createAdminSession() {
  const expiresAt = Date.now() + SESSION_DURATION;
  const payload = String(expiresAt);

  return `${payload}.${sign(payload)}`;
}

export function isValidAdminSession(token?: string) {
  if (!token) return false;

  const [expiresAt, signature, extra] = token.split('.');

  if (!expiresAt || !signature || extra !== undefined) {
    return false;
  }

  if (!/^\d+$/.test(expiresAt)) return false;
  if (!/^[a-f0-9]{64}$/.test(signature)) return false;
  if (Number(expiresAt) <= Date.now()) return false;

  const expected = Buffer.from(sign(expiresAt), 'hex');
  const received = Buffer.from(signature, 'hex');

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}

export function getAdminCookie(request: Request) {
  const cookies = request.headers.get('cookie') || '';

  const cookie = cookies
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${COOKIE_NAME}=`));

  return cookie
    ? decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1))
    : undefined;
}

export function adminCookie(token: string, clear = false) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const maxAge = clear ? 0 : SESSION_DURATION / 1000;
  const value = clear ? '' : encodeURIComponent(token);

  return `${COOKIE_NAME}=${value}; HttpOnly; Path=/api/admin; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}
