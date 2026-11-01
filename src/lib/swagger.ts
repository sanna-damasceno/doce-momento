
export const swaggerSpec = {
  openapi: '3.0.0',

  info: {
    title: 'API Doce Momento',
    version: '1.0.0',
    description:
      'Documentação da API da plataforma Doce Momento, uma loja virtual de produtos de confeitaria artesanal.',
  },

  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Ambiente de desenvolvimento',
    },
  ],

  tags: [
    { name: 'Administração', description: 'Operações administrativas.' },
    { name: 'Autenticação', description: 'Autenticação e cadastro de clientes.' },
    { name: 'Carrinho', description: 'Gerenciamento do carrinho de compras.' },
    { name: 'Pedidos', description: 'Criação e gerenciamento de pedidos.' },
    { name: 'OTP', description: 'Geração e verificação de códigos.' },
    { name: 'Produtos', description: 'Consulta de produtos.' },
    { name: 'Usuários', description: 'Informações e pedidos dos usuários.' },
    { name: 'Pagamentos', description: 'Integração com Mercado Pago.' },
  ],

  paths: {
    '/api/admin/login': {
      post: {
        tags: ['Administração'],
        summary: 'Realizar login administrativo',
        responses: {
          '200': { description: 'Login administrativo realizado.' },
          '401': { description: 'Credenciais inválidas.' },
        },
      },
    },

    '/api/admin/logout': {
      get: {
        tags: ['Administração'],
        summary: 'Encerrar sessão administrativa',
        responses: {
          '200': { description: 'Sessão encerrada.' },
        },
      },
    },

    '/api/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Realizar login do cliente',
        responses: {
          '200': { description: 'Login realizado com sucesso.' },
          '401': { description: 'E-mail ou senha incorretos.' },
        },
      },
    },

    '/api/auth/logout': {
      post: {
        tags: ['Autenticação'],
        summary: 'Encerrar sessão do cliente',
        responses: {
          '200': { description: 'Sessão encerrada.' },
        },
      },
    },

    '/api/auth/me': {
      get: {
        tags: ['Autenticação'],
        summary: 'Verificar usuário autenticado',
        responses: {
          '200': { description: 'Usuário autenticado.' },
          '401': { description: 'Usuário não autenticado.' },
        },
      },
    },

    '/api/auth/register': {
      post: {
        tags: ['Autenticação'],
        summary: 'Cadastrar novo usuário',
        responses: {
          '201': { description: 'Usuário cadastrado.' },
          '400': { description: 'Dados inválidos.' },
        },
      },
    },

    '/api/carrinho': {
      get: {
        tags: ['Carrinho'],
        summary: 'Consultar carrinho de compras',
        responses: {
          '200': { description: 'Carrinho consultado.' },
        },
      },

      post: {
        tags: ['Carrinho'],
        summary: 'Adicionar ou atualizar itens do carrinho',
        responses: {
          '200': { description: 'Carrinho atualizado.' },
        },
      },

      delete: {
        tags: ['Carrinho'],
        summary: 'Remover itens do carrinho',
        responses: {
          '200': { description: 'Itens removidos.' },
        },
      },
    },

    '/api/carrinho/adicionar': {
      post: {
        tags: ['Carrinho'],
        summary: 'Adicionar produto ao carrinho',
        responses: {
          '200': { description: 'Produto adicionado ao carrinho.' },
        },
      },
    },

    '/api/orders': {
      post: {
        tags: ['Pedidos'],
        summary: 'Criar pedido',
        responses: {
          '201': { description: 'Pedido criado.' },
          '400': { description: 'Dados inválidos.' },
        },
      },
    },

    '/api/otp/generate': {
      post: {
        tags: ['OTP'],
        summary: 'Gerar código de verificação',
        responses: {
          '200': { description: 'Código gerado.' },
        },
      },
    },

    '/api/otp/verify': {
      post: {
        tags: ['OTP'],
        summary: 'Verificar código de verificação',
        responses: {
          '200': { description: 'Código validado.' },
          '400': { description: 'Código inválido ou expirado.' },
        },
      },
    },

    '/api/produtos': {
      get: {
        tags: ['Produtos'],
        summary: 'Consultar produtos',
        responses: {
          '200': { description: 'Lista de produtos retornada.' },
        },
      },
    },

    '/api/produtos/mais-vendidos': {
      get: {
        tags: ['Produtos'],
        summary: 'Consultar produtos mais vendidos',
        responses: {
          '200': { description: 'Lista de produtos mais vendidos.' },
        },
      },
    },

    '/api/usuario': {
      get: {
        tags: ['Usuários'],
        summary: 'Consultar informações do usuário',
        responses: {
          '200': { description: 'Informações do usuário retornadas.' },
          '401': { description: 'Usuário não autenticado.' },
        },
      },
    },

    '/api/usuario/pedidos': {
      get: {
        tags: ['Usuários'],
        summary: 'Consultar pedidos do usuário',
        responses: {
          '200': { description: 'Pedidos retornados.' },
        },
      },

      patch: {
        tags: ['Usuários'],
        summary: 'Atualizar informações de pedido',
        responses: {
          '200': { description: 'Pedido atualizado.' },
          '400': { description: 'Dados inválidos.' },
        },
      },
    },

    '/api/webhook/mercadopago': {
      post: {
        tags: ['Pagamentos'],
        summary: 'Receber notificações do Mercado Pago',
        description:
          'Recebe notificações de eventos relacionados aos pagamentos realizados pelo Mercado Pago.',
        responses: {
          '200': { description: 'Notificação recebida e processada.' },
          '400': { description: 'Notificação inválida.' },
        },
      },
    },
  },
};
