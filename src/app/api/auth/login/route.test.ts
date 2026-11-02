
/** @jest-environment node */

import { POST } from './route';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

const mockQuery = query as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;
const mockCookies = cookies as jest.Mock;

describe('POST /api/auth/login', () => {
  const mockUser = {
    id: 1,
    name: 'Maria',
    email: 'maria@email.com',
    phone: '92999999999',
    password_hash: 'hash-da-senha',
  };

  const mockCookieStore = {
    set: jest.fn(),
  };

  const createRequest = (body: unknown) => {
    return new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockCookies.mockResolvedValue(mockCookieStore);
  });

  it('deve rejeitar e-mail vazio', async () => {
    const response = await POST(
      createRequest({ email: '', password: '123456' })
    );

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Preencha o e-mail e a senha.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('deve rejeitar senha vazia', async () => {
    const response = await POST(
      createRequest({ email: 'maria@email.com', password: '' })
    );

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Preencha o e-mail e a senha.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('deve rejeitar e-mail em formato inválido', async () => {
    const response = await POST(
      createRequest({ email: 'mariaemail.com', password: '123456' })
    );

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Informe um endereço de e-mail válido.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('deve normalizar e-mail com espaços e letras maiúsculas', async () => {
    mockQuery.mockResolvedValue({ rows: [mockUser] });
    mockCompare.mockResolvedValue(true);

    const response = await POST(
      createRequest({
        email: '  MARIA@EMAIL.COM  ',
        password: '123456',
      })
    );

    expect(response.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('LOWER(TRIM(email))'),
      ['maria@email.com']
    );
  });

  it('deve rejeitar e-mail inexistente', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const response = await POST(
      createRequest({
        email: 'inexistente@email.com',
        password: '123456',
      })
    );

    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('E-mail ou senha incorretos.');
    expect(mockCompare).not.toHaveBeenCalled();
  });

  it('deve rejeitar senha incorreta', async () => {
    mockQuery.mockResolvedValue({ rows: [mockUser] });
    mockCompare.mockResolvedValue(false);

    const response = await POST(
      createRequest({
        email: 'maria@email.com',
        password: 'senhaerrada',
      })
    );

    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('E-mail ou senha incorretos.');
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it('deve permitir login com credenciais válidas', async () => {
    mockQuery.mockResolvedValue({ rows: [mockUser] });
    mockCompare.mockResolvedValue(true);

    const response = await POST(
      createRequest({
        email: 'maria@email.com',
        password: '123456',
      })
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('maria@email.com');

    expect(mockCompare).toHaveBeenCalledWith(
      '123456',
      mockUser.password_hash
    );

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'user_id',
        value: '1',
        httpOnly: true,
      })
    );
  });

  it('deve rejeitar corpo JSON inválido', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{json inválido',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Dados enviados em formato inválido.');
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
