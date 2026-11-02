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

    const request = new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_email: 'cliente@email.com',
        items: [
          {
            product_name: 'Bolo de chocolate',
            quantity: 1,
            unit_price: 50,
          },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('e-mail ainda não foi verificado');

    // Não deve criar preferência de pagamento.
    expect(mockPreferenceCreate).not.toHaveBeenCalled();

    // A consulta ao banco deve ter sido feita apenas para verificar o usuário.
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});