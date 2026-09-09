# ============================================
# DOCE MOMENTO - Dockerfile
# ============================================

# Usa a imagem oficial do Node.js 20 (versão leve Alpine)
FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas os arquivos de dependências primeiro
COPY package.json yarn.lock* ./

# Instala as dependências
RUN yarn install --frozen-lockfile || npm install

# Copia todo o código do projeto
COPY . .

# Expõe a porta 3000
EXPOSE 3000

# Define variáveis de ambiente
ENV NODE_ENV=development

# Comando para iniciar o Next.js em modo desenvolvimento
CMD ["yarn", "dev"]