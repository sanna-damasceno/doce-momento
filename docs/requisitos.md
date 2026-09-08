# 📋 Levantamento de Requisitos

**Projeto:** Doce Momento - Confeitaria Artesanal  
**Disciplina:** Projeto Integrador — Projeto 1  
**Professor:** Ronem Lavareda  
**Data:** 08 de Setembro de 2026

---

## 🎯 Nome do Projeto

**"Doce Momento - Confeitaria Artesanal"**

Sistema de encomendas de doces gourmet para eventos, com entrega programada com no mínimo 3 dias de antecedência.

---

## ✅ Requisitos Funcionais (RF)

Os requisitos funcionais descrevem **o que o sistema deve fazer** (funcionalidades).

| Código | Requisito |
|--------|-----------|
| **RF01** | O sistema deve exibir um catálogo de doces com foto, descrição, preço unitário e categoria (brigadeiros, bolos de pote, tortas, cupcakes, caixas presente) |
| **RF02** | O sistema deve permitir filtrar produtos por categoria e faixa de preço |
| **RF03** | O sistema deve permitir adicionar produtos ao carrinho de compras |
| **RF04** | O sistema deve permitir personalizar o pedido (mensagem no cartão, tipo de embalagem: simples ou presente) |
| **RF05** | O sistema deve exigir seleção de data de entrega com antecedência mínima de 3 dias |
| **RF06** | O sistema deve calcular automaticamente o valor total (produtos + personalização + taxa de entrega fixa) |
| **RF07** | O sistema deve permitir cadastro e login de clientes (nome, e-mail, senha, telefone, endereço) |
| **RF08** | O sistema deve permitir que o cliente visualize seus pedidos e o status de cada um (Pendente, Em Preparo, Pronto, Entregue) |
| **RF09** | O sistema deve ter painel administrativo para cadastrar, editar e remover doces |
| **RF10** | O sistema deve permitir ao administrador visualizar todos os pedidos e atualizar o status |

---

## ⚙️ Requisitos Não Funcionais (RNF)

Os requisitos não funcionais descrevem **como o sistema deve ser** (qualidade, performance, segurança).

| Código | Requisito |
|--------|-----------|
| **RNF01** | Interface responsiva (mobile-first) |
| **RNF02** | Tempo de carregamento das páginas < 3 segundos |
| **RNF03** | Senhas armazenadas com hash (bcrypt) |
| **RNF04** | Validação de formulários no frontend e backend |
| **RNF05** | Sistema rodando em container Docker |
| **RNF06** | Código em TypeScript com tipagem forte |

---

## 📊 Resumo dos Requisitos

- **Total de Requisitos Funcionais:** 10
- **Total de Requisitos Não Funcionais:** 6
- **Total Geral:** 16 requisitos

---

## 🗂️ Mapeamento Requisitos → Telas

| Requisito | Tela Relacionada |
|-----------|------------------|
| RF01 | Catálogo de Doces |
| RF02 | Catálogo de Doces (filtros) |
| RF03 | Carrinho |
| RF04 | Detalhe do Produto |
| RF05 | Carrinho / Checkout |
| RF06 | Carrinho / Checkout |
| RF07 | Login / Cadastro |
| RF08 | Meus Pedidos |
| RF09 | CRUD de Produtos (Admin) |
| RF10 | Dashboard Admin / Gestão de Pedidos |

---

## 📝 Observações

- Todos os requisitos foram definidos com base na ideia do projeto: **confeitaria artesanal com encomendas programadas**.
- O diferencial do sistema é a **antecedência mínima de 3 dias** para encomendas (RF05), pois os doces são feitos sob encomenda.
- O sistema possui **duas áreas distintas**: pública (clientes) e administrativa (confeiteiro/admin).