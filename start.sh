#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  SpeakFlow — Script de Inicialização
#  Uso:
#    ./start.sh           → Inicia em modo DESENVOLVIMENTO
#    ./start.sh prod      → Build + inicia em modo PRODUÇÃO
#    ./start.sh setup     → Instala dependências + build (1ª vez)
# ─────────────────────────────────────────────────────────────────

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

banner() {
  echo ""
  echo -e "${BLUE}  🎙️  SpeakFlow${NC}"
  echo -e "${BLUE}  ─────────────────────────────${NC}"
}

check_env() {
  if [ ! -f "apps/web/.env.local" ]; then
    echo -e "${YELLOW}⚠️  Arquivo apps/web/.env.local não encontrado.${NC}"
    echo -e "${YELLOW}   Copie o exemplo e preencha as chaves:${NC}"
    echo -e "   ${YELLOW}cp apps/web/.env.example apps/web/.env.local${NC}"
    echo ""
  fi
}

check_node() {
  REQUIRED="18"
  CURRENT=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$CURRENT" -lt "$REQUIRED" ]; then
    echo -e "${RED}❌ Node.js $REQUIRED+ é necessário. Versão atual: $(node -v)${NC}"
    exit 1
  fi
}

kill_existing() {
  echo -e "${YELLOW}▶  Verificando se o sistema já está rodando...${NC}"
  # Mata processos do servidor Next.js customizado
  pkill -f "node.*server.js" 2>/dev/null || true
  
  # Libera forçadamente a porta 3000 se ainda houver algo preso
  if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}▶  Encerrando processo preso na porta 3000...${NC}"
    kill -9 $(lsof -Pi :3000 -sTCP:LISTEN -t) 2>/dev/null || true
  fi
  sleep 1
}

MODE="${1:-dev}"

banner
check_node
kill_existing

case "$MODE" in

  # ── Setup: instala dependências e builda ──────────────────────
  setup)
    echo -e "${GREEN}▶  Instalando dependências...${NC}"
    npm install

    echo -e "${GREEN}▶  Gerando cliente Prisma...${NC}"
    (cd packages/db && npx prisma generate) 2>/dev/null || true

    echo -e "${GREEN}▶  Buildando o projeto...${NC}"
    npm run build

    echo ""
    echo -e "${GREEN}✅  Setup concluído! Agora execute:${NC}"
    echo -e "    ./start.sh       # desenvolvimento"
    echo -e "    ./start.sh prod  # produção"
    ;;

  # ── Produção: build + start ───────────────────────────────────
  prod)
    check_env
    echo -e "${GREEN}▶  Buildando para produção...${NC}"
    npm run build

    echo -e "${GREEN}▶  Iniciando servidor de produção na porta 3000...${NC}"
    echo ""
    cd apps/web
    NODE_ENV=production node server.js
    ;;

  # ── Desenvolvimento (padrão) ──────────────────────────────────
  dev|*)
    check_env
    echo -e "${GREEN}▶  Limpando cache do Next.js...${NC}"
    rm -rf apps/web/.next
    echo -e "${GREEN}▶  Iniciando em modo desenvolvimento na porta 3000...${NC}"
    echo -e "   ${BLUE}http://localhost:3000${NC}"
    echo ""
    cd apps/web
    node server.js
    ;;

esac
