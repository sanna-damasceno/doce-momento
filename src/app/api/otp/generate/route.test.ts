/**
 * @jest-environment node
 */
import { POST } from './route';
import { query } from '@/lib/db';


jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn(),
    })),
  },
}));

const mockQuery = query as jest.Mock;

const mockSendMail = (
    jest.requireMock('nodemailer') as {
    default: {
        createTransport: jest.Mock;
    };
}
).default.createTransport.mock.results[0].value.sendMail as jest.Mock;;

function createRequest(body: unknown) {
  return new Request('http://localhost/api/otp/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('Geração de OTP', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          email: 'cliente@email.com',
          expires_at: new Date(),
        },
      ],
    });

    mockSendMail.mockResolvedValue({} as never);
  });

  it('deve rejeitar e-mail vazio', async () => {
    const response = await POST(
      createRequest({ email: '   ' })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar e-mail inválido', async () => {
    const response = await POST(
      createRequest({ email: 'email-invalido' })
    );

    expect(response.status).toBe(400);
  });

  it('deve rejeitar JSON inválido', async () => {
    const request = new Request(
      'http://localhost/api/otp/generate',
      {
        method: 'POST',
        body: '{json inválido',
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('deve normalizar o e-mail antes de salvar e enviar', async () => {
    const response = await POST(
      createRequest({ email: ' Cliente@Email.com ' })
    );

    expect(response.status).toBe(201);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      [
        'cliente@email.com',
        expect.any(String),
        expect.any(Date),
      ]
    );

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'cliente@email.com',
      })
    );
  });

  it('deve retornar erro quando o envio do e-mail falhar', async () => {
    mockSendMail.mockRejectedValueOnce(
      new Error('Falha no envio')
    );

    const response = await POST(
      createRequest({ email: 'cliente@email.com' })
    );

    expect(response.status).toBe(500);

    // Verifica se o OTP salvo foi invalidado
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});
