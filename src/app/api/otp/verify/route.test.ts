/**
 * @jest-environment node
 */
import { POST } from './route';
import { query } from '@/lib/db';
import crypto from 'crypto';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

const mockQuery = query as jest.Mock;

function gerarHash(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function criarRequest(email: string, code: string) {
  return new Request('http://localhost/api/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
}

const otpValido = {
  id: 1,
  email: 'cliente@email.com',
  code_hash: gerarHash('123456'),
  expires_at: new Date(Date.now() + 5 * 60 * 1000),
  attempts: 0,
  used: false,
};

describe('Verificação de OTP', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('deve aceitar um código válido', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [otpValido] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await POST(
      criarRequest('cliente@email.com', '123456')
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('deve rejeitar um código incorreto', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [otpValido] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await POST(
      criarRequest('cliente@email.com', '000000')
    );

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Código incorreto');
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('deve rejeitar um código expirado', async () => {
    const otpExpirado = {
      ...otpValido,
      expires_at: new Date(Date.now() - 1000),
    };

    mockQuery.mockResolvedValueOnce({ rows: [otpExpirado] });

    const response = await POST(
      criarRequest('cliente@email.com', '123456')
    );

    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toContain('expirou');
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('deve rejeitar um código já utilizado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await POST(
      criarRequest('cliente@email.com', '123456')
    );

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('Nenhum código pendente');
  });

  it('deve bloquear após três tentativas', async () => {
    const otpBloqueado = {
      ...otpValido,
      attempts: 3,
    };

    mockQuery.mockResolvedValueOnce({ rows: [otpBloqueado] });

    const response = await POST(
      criarRequest('cliente@email.com', '123456')
    );

    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Limite de tentativas excedido');
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});
