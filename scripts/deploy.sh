#!/bin/bash

# Script para automatizar o deploy do PauloCell em produção
# Uso: bash scripts/deploy.sh [--clean] [--migrate]

# Definir cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Obter diretório do script
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
PROJECT_DIR=$(readlink -f "$SCRIPT_DIR/..")

# Função para exibir mensagens
show_message() {
  echo -e "${GREEN}==>${NC} $1"
}

show_warning() {
  echo -e "${YELLOW}==>${NC} $1"
}

show_error() {
  echo -e "${RED}==>${NC} $1"
}

# Função para verificar se um comando foi executado com sucesso
check_status() {
  if [ $? -eq 0 ]; then
    show_message "$1"
  else
    show_error "$2"
    exit 1
  fi
}

# Verificar parâmetros
CLEAN=false
MIGRATE=false

for arg in "$@"; do
  case $arg in
    --clean)
      CLEAN=true
      shift
      ;;
    --migrate)
      MIGRATE=true
      shift
      ;;
  esac
done

# Exibir cabeçalho
echo "============================================"
echo "        PauloCell - Script de Deploy        "
echo "============================================"
echo ""

# Verificar ambiente
cd "$PROJECT_DIR"
if [ -f ".env" ]; then
  show_message "Arquivo .env encontrado"
else
  show_warning "Arquivo .env não encontrado. Criando a partir de .env.example..."
  cp .env.example .env
  check_status "Arquivo .env criado" "Falha ao criar arquivo .env"
  show_warning "Não esqueça de editar o arquivo .env com suas configurações reais!"
fi

# Limpar o projeto se solicitado
if [ "$CLEAN" = true ]; then
  show_message "Limpando o projeto..."
  if [ -f "scripts/clean-project.sh" ]; then
    bash scripts/clean-project.sh
    check_status "Projeto limpo com sucesso" "Falha ao limpar o projeto"
  else
    show_error "Script de limpeza não encontrado"
    exit 1
  fi
fi

# Instalar dependências
show_message "Instalando dependências..."
npm install
check_status "Dependências instaladas com sucesso" "Falha ao instalar dependências"

# Migrar dados para o Supabase se solicitado
if [ "$MIGRATE" = true ]; then
  show_message "Iniciando migração de dados para o Supabase..."
  npm run migrate
  check_status "Migração concluída com sucesso" "Falha na migração dos dados"
fi

# Fazer build do projeto
show_message "Fazendo build do projeto..."
npm run build
check_status "Build concluído com sucesso" "Falha no build do projeto"

# Verificar se estamos em ambiente de produção (VPS)
if command -v pm2 &> /dev/null; then
  show_message "PM2 detectado. Iniciando o servidor em modo de produção..."
  
  # Verificar se o aplicativo já está rodando no PM2
  if pm2 list | grep -q "paulocell"; then
    show_message "Reiniciando o servidor..."
    pm2 restart paulocell || pm2 start server.js --name paulocell
  else
    show_message "Iniciando o servidor pela primeira vez..."
    pm2 start server.js --name paulocell
  fi
  
  # Salvar configuração do PM2
  pm2 save
  
  show_message "Servidor iniciado com sucesso!"
  echo ""
  echo "============================================"
  echo "    Deploy em produção concluído!          "
  echo "============================================"
  echo ""
  pm2 list | grep paulocell
else
  # Em ambiente de desenvolvimento, usar preview do Vite
  show_message "PM2 não detectado. Iniciando preview em modo de desenvolvimento..."
  npm run preview
fi

echo ""
show_message "Deploy concluído com sucesso!"
echo ""
if [ -f ".env" ]; then
  SITE_URL=$(grep "VITE_APP_URL" .env | cut -d '=' -f2)
  if [ -n "$SITE_URL" ]; then
    show_message "Seu site está disponível em: $SITE_URL"
  else
    show_message "Seu site está em execução!"
  fi
fi 