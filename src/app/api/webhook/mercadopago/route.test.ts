/**
 * @jest-environment node
 */

const mockQuery = jest.fn();
const mockPaymentGet = jest.fn();
const mockSendMail = jest.fn();

jest.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn(),
  Payment: jest.fn().mockImplementation(() => ({
    get: (...args: unknown[]) => mockPaymentGet(...args),
  })),
}));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: (...args: unknown[]) => mockSendMail(...args),
    })),
  },
}));

import { POST } from './route';

describe('POST /api/webhook/mercadopago', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.MP_ACCESS_TOKEN = 'test-token';

    mockPaymentGet.mockResolvedValue({
      id: 12345,
      status: 'approved',
      external_reference: '15',
    });

    mockSendMail.mockResolvedValue({});
  });

  afterAll(() => {
    delete process.env.MP_ACCESS_TOKEN;
  });

  function createRequest() {
    return new Request(
      'http://localhost:3000/api/webhook/mercadopago',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'payment',
          data: {
            id: '12345',
          },
        }),
      }
    );
  }

  it('deve atualizar o pedido quando o pagamento for aprovado', async () => {
    // Primeira consulta: UPDATE do pedido retorna uma linha atualizada.
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 15 }],
      rowCount: 1,
    });

    // Segunda consulta: dados do pedido.
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 15,
          customer_name: 'Cliente Teste',
          customer_email: 'cliente@email.com',
          shipping_address: 'Rua Teste, 100',
          delivery_date: '2026-11-10',
          subtotal: 50,
          shipping_fee: 5,
          discount: 0,
          total_amount: 55,
          status: 'Pago / Em Preparo',
          payment_status: 'aprovado',
          payment_type: 'Pix',
          notes: null,
          created_at: '2026-11-02T12:00:00Z',
        },
      ],
      rowCount: 1,
    });

    // Terceira consulta: itens do pedido.
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          product_name: 'Bolo de chocolate',
          quantity: 1,
          unit_price: 50,
          customization: null,
        },
      ],
      rowCount: 1,
    });

    const response = await POST(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);

    // Confirma que o pedido recebeu o status de aprovado.
    expect(mockQuery.mock.calls[0][0]).toContain(
      "payment_status = $1"
    );

    expect(mockQuery.mock.calls[0][1]).toEqual([
      'aprovado',
      'Pago / Em Preparo',
      '15',
    ]);

    // Confirma que o e-mail de confirmação foi enviado.
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('não deve enviar outro e-mail quando o webhook for repetido', async () => {
    // O UPDATE não altera nada porque o pedido já está aprovado.
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    // O pedido já existe e está aprovado.
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 15,
          payment_status: 'aprovado',
        },
      ],
      rowCount: 1,
    });

    const response = await POST(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(data.alreadyApproved).toBe(true);

    // Não deve buscar os itens nem gerar outro comprovante.
    expect(mockQuery).toHaveBeenCalledTimes(2);

    // Não deve enviar e-mail novamente.
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});