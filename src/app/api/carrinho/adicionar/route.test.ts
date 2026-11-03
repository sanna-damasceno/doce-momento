/**
 * @jest-environment node
 */

import { POST } from './route';
import { cookies } from 'next/headers';
import { Pool } from 'pg';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  return {
    Pool: jest.fn(() => ({
      connect: jest.fn().mockResolvedValue(mockClient),
    })),
    __mockClient: mockClient,
  };
});

const { __mockClient: mockClient } = jest.requireMock('pg');

describe('POST /api/carrinho/adicionar', () => {
    const criarRequest = (body: unknown) =>
    new Request('http://localhost:3000/api/carrinho/adicionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

  beforeEach(() => {
    jest.clearAllMocks();

    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: '1' }),
    });

    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Usuário
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Produto
      .mockResolvedValueOnce({ rows: [] }); // Inserção
  });

  it('deve adicionar um produto ao carrinho com dados válidos', async () => {
    const request = criarRequest({
      produto_id: 1,
      quantidade: 2,
      embalagem: 'Embalagem Simples',
      observacao: 'Sem observações',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('deve rejeitar usuário não autenticado', async () => {
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    const response = await POST(criarRequest({ produto_id: 1 }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('deve rejeitar produto inválido', async () => {
    const response = await POST(
      criarRequest({ produto_id: -1, quantidade: 1 })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar quantidade inválida', async () => {
    const response = await POST(
      criarRequest({ produto_id: 1, quantidade: 0 })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar quantidade acima do limite', async () => {
    const response = await POST(
      criarRequest({ produto_id: 1, quantidade: 100 })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar embalagem inválida', async () => {
    const response = await POST(
      criarRequest({
        produto_id: 1,
        quantidade: 1,
        embalagem: 'Embalagem inválida',
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar observação com mais de 200 caracteres', async () => {
    const response = await POST(
      criarRequest({
        produto_id: 1,
        quantidade: 1,
        observacao: 'A'.repeat(201),
      })
    );

    expect(response.status).toBe(400);
  });
});