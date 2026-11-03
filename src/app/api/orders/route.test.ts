
/**
 * @jest-environment node
 */

const mockQuery = jest.fn();
const mockCookies = jest.fn();
const mockPreferenceCreate = jest.fn();

jest.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

jest.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}));

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn(),
  Preference: jest.fn().mockImplementation(() => ({
    create: (...args: unknown[]) => mockPreferenceCreate(...args),
  })),
}));

import { POST } from './route';

describe('POST /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({
        value: '10',
      }),
    });
  });

  const criarRequest = (body: unknown) =>
    new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

  const usuarioVerificado = {
    id: 10,
    email: 'cliente@email.com',
    email_verified: true,
  };

  const pedidoValido = {
    customer_name: 'Cliente Teste',
    customer_email: 'cliente@email.com',
    customer_phone: '92999999999',
    shipping_address: 'Rua das Flores, 123',
    delivery_date: '2099-12-20',
    payment_type: 'pix',
    notes: 'Entregar pela manhã',
    items: [
      {
        product_id: 1,
        quantity: 2,
        customization: {
          embalagem: 'Embalagem Simples',
          observacao: '',
        },
      },
    ],
  };

  it('deve impedir pagamento quando o e-mail não foi verificado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          email: 'cliente@email.com',
          email_verified: false,
        },
      ],
      rowCount: 1,
    });

    const response = await POST(criarRequest(pedidoValido));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('e-mail ainda não foi verificado');
    expect(mockPreferenceCreate).not.toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('deve rejeitar usuário não autenticado', async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    const response = await POST(criarRequest(pedidoValido));

    expect(response.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('deve rejeitar e-mail diferente do cadastro', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [usuarioVerificado],
    });

    const response = await POST(
      criarRequest({
        ...pedidoValido,
        customer_email: 'outro@email.com',
      })
    );

    expect(response.status).toBe(403);
    expect(mockPreferenceCreate).not.toHaveBeenCalled();
  });

  it('deve rejeitar telefone inválido', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [usuarioVerificado],
    });

    const response = await POST(
      criarRequest({
        ...pedidoValido,
        customer_phone: '123',
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar endereço vazio', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [usuarioVerificado],
    });

    const response = await POST(
      criarRequest({
        ...pedidoValido,
        shipping_address: '   ',
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar data de entrega inválida', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [usuarioVerificado],
    });

    const response = await POST(
      criarRequest({
        ...pedidoValido,
        delivery_date: '2026-02-30',
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar data de entrega com menos de três dias', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [usuarioVerificado],
    });

    const response = await POST(
      criarRequest({
        ...pedidoValido,
        delivery_date: '2020-01-01',
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar forma de pagamento inválida', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [usuarioVerificado],
    });

    const response = await POST(
      criarRequest({
        ...pedidoValido,
        payment_type: 'dinheiro',
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar pedido sem itens', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [usuarioVerificado],
    });

    const response = await POST(
      criarRequest({
        ...pedidoValido,
        items: [],
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar quantidade inválida', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [usuarioVerificado],
    });

    const response = await POST(
      criarRequest({
        ...pedidoValido,
        items: [
          {
            product_id: 1,
            quantity: 0,
          },
        ],
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar embalagem inválida', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [usuarioVerificado],
    });

    const response = await POST(
      criarRequest({
        ...pedidoValido,
        items: [
          {
            product_id: 1,
            quantity: 1,
            customization: {
              embalagem: 'Embalagem inválida',
            },
          },
        ],
      })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar observações acima de 200 caracteres', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [usuarioVerificado],
    });

    const response = await POST(
      criarRequest({
        ...pedidoValido,
        notes: 'A'.repeat(201),
      })
    );

    expect(response.status).toBe(400);
  });

    it('deve criar um pedido válido e gerar o pagamento', async () => {
    mockQuery
      // 1. Usuário autenticado
      .mockResolvedValueOnce({
        rows: [usuarioVerificado],
      })
      // 2. Produto encontrado
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Bolo de Chocolate',
            preco: 20,
            preco_promocional: 15,
          },
        ],
      })
      // 3. Pedido criado
      .mockResolvedValueOnce({
        rows: [{ id: 100 }],
      })
      // 4. Item inserido
      .mockResolvedValueOnce({
        rows: [],
      })
      // 5. Preferência salva
      .mockResolvedValueOnce({
        rows: [],
      });

    mockPreferenceCreate.mockResolvedValueOnce({
      id: 'preference_123',
      init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
    });

    const response = await POST(criarRequest(pedidoValido));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.orderId).toBe(100);
    expect(data.init_point).toContain('mercadopago.com.br');

    // Verifica o cálculo: 2 x R$ 15,00 + R$ 0,01 de entrega
    expect(mockQuery.mock.calls[2][1]).toEqual(
      expect.arrayContaining([30, 0.01, 0, 30.01])
    );

    expect(mockPreferenceCreate).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledTimes(5);
  });

  it('deve adicionar R$ 5,00 ao pedido com embalagem para presente', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [usuarioVerificado],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Bolo de Chocolate',
            preco: 20,
            preco_promocional: 15,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 101 }],
      })
      .mockResolvedValueOnce({
        rows: [],
      })
      .mockResolvedValueOnce({
        rows: [],
      });

    mockPreferenceCreate.mockResolvedValueOnce({
      id: 'preference_456',
      init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=456',
    });

    const pedidoComPresente = {
      ...pedidoValido,
      items: [
        {
          product_id: 1,
          quantity: 2,
          customization: {
            embalagem: 'Caixa para Presente',
            observacao: '',
          },
        },
      ],
    };

    const response = await POST(criarRequest(pedidoComPresente));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);

    // R$ 30,00 dos produtos + R$ 5,00 da embalagem
    expect(mockQuery.mock.calls[2][1]).toEqual(
      expect.arrayContaining([35, 0.01, 0, 35.01])
    );

    // Verifica se a embalagem foi incluída no pagamento
    const preferencia = mockPreferenceCreate.mock.calls[0][0];

    expect(preferencia.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Embalagem para Presente',
          quantity: 1,
          unit_price: 5,
        }),
      ])
    );
  });

  it('deve rejeitar pedido com produto inexistente', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [usuarioVerificado],
      })
      .mockResolvedValueOnce({
        rows: [],
      });

    const response = await POST(criarRequest(pedidoValido));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('produtos não foram encontrados');

    // Não deve criar pedido nem preferência de pagamento
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockPreferenceCreate).not.toHaveBeenCalled();
  });
});
