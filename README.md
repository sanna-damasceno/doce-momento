# 🍰 Doce Momento

O **Doce Momento** é uma aplicação web desenvolvida para uma confeitaria, com o objetivo de facilitar a divulgação de produtos e a realização de pedidos online.

A plataforma permite que os clientes visualizem o catálogo de produtos, personalizem seus pedidos, informem os dados de entrega e realizem pagamentos online. O sistema também conta com confirmação de pagamentos, envio de e-mails com comprovantes em PDF e ferramentas de monitoramento.

## 🚀 Tecnologias utilizadas

### Front-end
- **Next.js 16** – Framework para desenvolvimento da aplicação web.
- **React** – Biblioteca para construção das interfaces.
- **TypeScript** – Linguagem utilizada para desenvolvimento com tipagem estática.
- **Tailwind CSS** – Framework para estilização da aplicação.

### Back-end e banco de dados
- **Next.js API Routes** – Desenvolvimento das rotas da aplicação.
- **Node.js** – Ambiente de execução JavaScript.
- **PostgreSQL** – Banco de dados relacional.
- **Supabase** – Serviço utilizado para hospedagem do banco de dados.

### Integrações e ferramentas
- **Mercado Pago** – Processamento e confirmação de pagamentos.
- **Nodemailer** – Envio de e-mails.
- **PDF-lib** – Geração de comprovantes de pedidos em PDF.
- **Google Analytics 4** – Análise de métricas e eventos de utilização.
- **Microsoft Clarity** – Análise de sessões e interações dos usuários.
- **Discord Webhook** – Envio de alertas de falhas do sistema.
- **Docker e Docker Compose** – Containerização da aplicação e do banco de dados.
- **Vercel** – Hospedagem e publicação da aplicação.

## 📋 Requisitos para execução

Para executar o projeto localmente, é necessário ter:

- [Node.js](https://nodejs.org/) – versão compatível com o projeto.
- [npm](https://www.npmjs.com/) – gerenciador de pacotes.
- [Git](https://git-scm.com/) – para clonar o repositório.
- Acesso a um banco de dados PostgreSQL.

Para execução com Docker, também é necessário:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/).
- Docker Compose.

## ⚙️ Configuração das variáveis de ambiente

Após clonar o repositório, crie um arquivo chamado `.env.local` na raiz do projeto e configure as seguintes variáveis:

```env
# Banco de Dados
DATABASE_URL=

# JWT
JWT_SECRET=

# URL pública da aplicação
NEXT_PUBLIC_URL=

# E-mail
EMAIL_USER=
EMAIL_PASS=

# Mercado Pago
MP_ACCESS_TOKEN=

# Discord
DISCORD_WEBHOOK_URL=

# Administração
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=

# Google Analytics 4
NEXT_PUBLIC_GA_ID=
GA4_API_SECRET=
```

### Descrição das variáveis

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão com o banco de dados PostgreSQL. |
| `JWT_SECRET` | Chave secreta utilizada na autenticação JWT. |
| `NEXT_PUBLIC_URL` | Endereço público da aplicação. |
| `EMAIL_USER` | Conta de e-mail utilizada para envio de mensagens. |
| `EMAIL_PASS` | Senha ou credencial de acesso da conta de e-mail. |
| `MP_ACCESS_TOKEN` | Token de acesso à API do Mercado Pago. |
| `DISCORD_WEBHOOK_URL` | URL do Webhook para envio de alertas ao Discord. |
| `ADMIN_PASSWORD` | Senha de acesso administrativo. |
| `ADMIN_SESSION_SECRET` | Chave secreta utilizada para proteger a sessão administrativa. |
| `NEXT_PUBLIC_GA_ID` | Identificador de medição do Google Analytics 4. |
| `GA4_API_SECRET` | Segredo utilizado na integração com o Measurement Protocol do GA4. |

**Importante:** preencha as variáveis com os valores correspondentes ao seu ambiente. O arquivo `.env.local` não deve ser enviado ao GitHub, pois contém informações sensíveis.

## 💻 Instruções para execução local

### 1. Clonar o repositório

```bash
git clone https://github.com/sanna-damasceno/doce-momento.git
```

### 2. Acessar a pasta do projeto

```bash
cd doce-momento
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Configurar as variáveis de ambiente

Crie o arquivo `.env.local` na raiz do projeto e preencha as variáveis descritas na seção anterior.

### 5. Executar a aplicação

```bash
npm run dev
```

### 6. Acessar a aplicação

Abra o navegador e acesse:

```text
http://localhost:3000
```

### 7. Verificar e gerar a versão de produção

Para verificar o código e compilar a aplicação:

```bash
npm run lint
npm run build
```

Para iniciar a versão de produção:

```bash
npm start
```
## 🐳 Instruções para execução com Docker

O projeto utiliza Docker e Docker Compose para executar a aplicação Next.js e o banco de dados PostgreSQL em contêineres separados.

### 1. Pré-requisitos

- Docker Desktop instalado.
- Docker Compose disponível.

### 2. Construir e iniciar os contêineres

Na raiz do projeto, onde estão localizados o `Dockerfile` e o `docker-compose.yml`, execute:

```bash
docker compose up --build
```

Esse comando constrói a imagem da aplicação e inicia os serviços configurados.

### 3. Serviços disponíveis

A configuração utiliza dois contêineres:

| Serviço | Descrição | Porta |
|---|---|---|
| `app` | Aplicação Next.js em modo de desenvolvimento. | 3000 |
| `postgres` | Banco de dados PostgreSQL 15. | 5432 |

O banco de dados utiliza:
- Usuário: `postgres`
- Banco: `docemomento`
- Senha: `postgres`

A aplicação utiliza a seguinte URL de conexão dentro da rede Docker:

```text
postgresql://postgres:postgres@postgres:5432/docemomento?schema=public
```

### 4. Acessar a aplicação

Após a inicialização dos serviços, acesse:

http://localhost:3000

### 5. Consultar os contêineres

```bash
docker ps
```

### 6. Consultar os logs

```bash
docker compose logs -f
```

### 7. Encerrar os serviços

```bash
docker compose down
```

Para remover também os volumes e os dados persistidos do banco:

```bash
docker compose down -v
```

**Atenção:** o comando `docker compose down -v` apaga os dados armazenados no volume do PostgreSQL.

**Observação:** a configuração atual utiliza o servidor de desenvolvimento do Next.js. As demais variáveis de ambiente das integrações externas precisam ser configuradas no contêiner para que esses recursos funcionem durante a execução com Docker.

## 📊 Monitoramento e observabilidade

O projeto utiliza ferramentas para acompanhar a utilização da aplicação e identificar possíveis falhas:

- **Google Analytics 4:** coleta de métricas e eventos de utilização.
- **Microsoft Clarity:** análise das sessões e interações dos usuários.
- **Discord Webhook:** envio de alertas relacionados a falhas no processamento de pagamentos, registro de eventos e envio de e-mails.
- **Logs da aplicação:** registro de informações e erros para auxiliar no diagnóstico de problemas.

## 🌐 Aplicação publicada

A aplicação está disponível em:

https://doce-momento-lilac.vercel.app/

## 📂 Repositório

https://github.com/sanna-damasceno/doce-momento

---

Desenvolvido como projeto acadêmico de Engenharia de Software – Instituto Federal do Amazonas (IFAM), Campus Parintins.