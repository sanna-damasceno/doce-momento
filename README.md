# 🍰 Doce Momento - Confeitaria Artesanal

Sistema de encomendas de doces gourmet para eventos, desenvolvido como Projeto Integrador da disciplina de Engenharia de Software.

## 📋 Sobre o Projeto

**Doce Momento** é uma plataforma web para uma confeitaria artesanal que permite aos clientes:
- Visualizar catálogo de doces (brigadeiros, bolos de pote, tortas, cupcakes, caixas presente)
- Personalizar pedidos (mensagem no cartão, tipo de embalagem)
- Escolher data de entrega (com antecedência mínima de 3 dias)
- Realizar pagamentos via Cartão de Crédito ou PIX
- Acompanhar status dos pedidos

## 🚀 Tecnologias

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Banco de Dados:** SQLite + Prisma ORM
- **Autenticação:** JWT + bcrypt
- **Container:** Docker + Docker Compose

## 📅 Cronograma (6 semanas)

| Semana | Foco |
|--------|------|
| 1 | Planejamento e infraestrutura |
| 2 | Autenticação e CRUD de produtos |
| 3 | Catálogo, carrinho e checkout |
| 4 | Área do cliente e dashboard admin |
| 5 | Pagamentos, testes e ajustes |
| 6 | Deploy, documentação e entrega final |

## 🐳 Como Rodar

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 20+ (opcional, para rodar sem Docker)

### Com Docker (recomendado)

```bash
# Clonar o repositório
git clone https://github.com/SEU-USUARIO/doce-momento.git
cd doce-momento

# Subir os containers
docker-compose up --build

# Acessar: http://localhost:3000
```

### Sem Docker

```bash
# Instalar dependências
npm install

# Configurar banco de dados
npx prisma migrate dev --name init

# Rodar em desenvolvimento
npm run dev
```

## 👨‍🏫 Disciplina

**Projeto Integrador — Projeto 1**  
Professor: Ronem Lavareda  
Curso: Engenharia de Software

## 📄 Licença

Este projeto é acadêmico e foi desenvolvido para fins educacionais.