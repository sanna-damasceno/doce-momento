
/**
 * @jest-environment node
 */

import { POST } from './route';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
  },
}));

const mockQuery = query as jest.Mock;
const mockHash = bcrypt.hash as jest.Mock;

function createRequest(body: unknown) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

const validData = {
  name: 'Cliente Teste',
  email: 'cliente@email.com',
  phone: '(92) 99999-9999',
  password: '123456',
  confirmPassword: '123456',
  action: 'INIT_REGISTER',
};

describe('Cadastro de usuário', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockQuery.mockResolvedValue({
      rows: [],
    });

    mockHash.mockResolvedValue('senha_criptografada');
  });

  it('deve rejeitar JSON inválido', async () => {
    const request = new Request(
      'http://localhost/api/auth/register',
      {
        method: 'POST',
        body: '{json inválido',
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('deve rejeitar campos obrigatórios vazios', async () => {
    const response = await POST(
      createRequest({
        ...validData,
        name: ' ',
      })
    );

    expect(response.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('deve rejeitar ação inválida', async () => {
    const response = await POST(
      createRequest({
        ...validData,
        action: 'AÇÃO_INVALIDA',
      })
    );

    expect(response.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('deve rejeitar nome com menos de 2 caracteres', async () => {
    const response = await POST(
      createRequest({
        ...validData,
        name: 'A',
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar e-mail inválido', async () => {
    const response = await POST(
      createRequest({
        ...validData,
        email: 'email-invalido',
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar telefone inválido', async () => {
    const response = await POST(
      createRequest({
        ...validData,
        phone: '12345',
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar senha com menos de 6 caracteres', async () => {
    const response = await POST(
      createRequest({
        ...validData,
        password: '123',
        confirmPassword: '123',
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar senhas diferentes', async () => {
    const response = await POST(
      createRequest({
        ...validData,
        confirmPassword: '654321',
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar e-mail já cadastrado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1 }],
    });

    const response = await POST(
      createRequest(validData)
    );

    expect(response.status).toBe(400);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('deve iniciar cadastro com dados válidos', async () => {
    const response = await POST(
      createRequest(validData)
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('deve normalizar os dados antes de consultar o banco', async () => {
    const response = await POST(
      createRequest({
        ...validData,
        name: ' Cliente Teste ',
        email: ' CLIENTE@EMAIL.COM ',
        phone: ' (92) 99999-9999 ',
      })
    );

    expect(response.status).toBe(200);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      ['cliente@email.com']
    );
  });

  it('deve rejeitar cadastro sem OTP verificado', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await POST(
      createRequest({
        ...validData,
        action: 'COMPLETE_REGISTER',
      })
    );

    expect(response.status).toBe(403);
    expect(mockHash).not.toHaveBeenCalled();
  });

  it('deve criar usuário quando o OTP estiver verificado', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: 'Cliente Teste',
            email: 'cliente@email.com',
            phone: '(92) 99999-9999',
            email_verified: true,
          },
        ],
      });

    const response = await POST(
      createRequest({
        ...validData,
        action: 'COMPLETE_REGISTER',
      })
    );

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.user.email_verified).toBe(true);

    expect(mockHash).toHaveBeenCalledWith(
      '123456',
      10
    );

    expect(mockQuery).toHaveBeenCalledTimes(3);
  });
});
