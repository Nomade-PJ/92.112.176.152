#!/bin/bash

# Script para verificar o status do sistema PauloCell em produção
# Uso: ./scripts/check-status.sh [--full]

# Definir cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar parâmetros
FULL_CHECK=false

for arg in "$@"; do
  case $arg in
    --full)
      FULL_CHECK=true
      shift
      ;;
  esac
done

# Obter URL da aplicação
get_app_url() {
  if [ -f ".env" ]; then
    APP_URL=$(grep "VITE_APP_URL" .env | cut -d '=' -f2)
    if [ -z "$APP_URL" ]; then
      APP_URL="http://localhost:3000"
    fi
  else
    APP_URL="http://localhost:3000"
  fi
  echo $APP_URL
}

# Exibir título
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}        PauloCell - Status do Sistema        ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Verificar se o servidor está em execução
if command -v pm2 &> /dev/null; then
  echo -e "${BLUE}===== Status do Processo PM2 =====${NC}"
  pm2 list | grep paulocell
  echo ""
  
  # Verificar memória e CPU
  echo -e "${BLUE}===== Uso de Recursos =====${NC}"
  pm2 show paulocell | grep -E "memory|cpu"
  echo ""
  
  # Verificar logs recentes
  echo -e "${BLUE}===== Logs Recentes =====${NC}"
  pm2 logs --lines 10 paulocell --nostream
  echo ""
else
  echo -e "${YELLOW}PM2 não encontrado. Verificando processo Node.js...${NC}"
  ps aux | grep "node.*server.js" | grep -v grep
  if [ $? -ne 0 ]; then
    echo -e "${RED}Nenhum processo do servidor encontrado.${NC}"
  fi
  echo ""
fi

# Verificar status de recursos do sistema
echo -e "${BLUE}===== Recursos do Sistema =====${NC}"
echo -e "${YELLOW}CPU:${NC}"
top -bn1 | head -3
echo ""
echo -e "${YELLOW}Memória:${NC}"
free -h
echo ""
echo -e "${YELLOW}Disco:${NC}"
df -h | grep -E '(Filesystem|/$)'
echo ""

# Verificar status do Nginx
if command -v nginx &> /dev/null; then
  echo -e "${BLUE}===== Status do Nginx =====${NC}"
  if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}Nginx está ativo e em execução${NC}"
  else
    echo -e "${RED}Nginx não está em execução${NC}"
  fi
  nginx -t 2>&1
  echo ""
fi

# Verificar status da API
APP_URL=$(get_app_url)
echo -e "${BLUE}===== Status da API =====${NC}"
echo -e "Verificando URL: ${APP_URL}/api/status"

if command -v curl &> /dev/null; then
  status_code=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/api/status")
  if [ $status_code -eq 200 ]; then
    echo -e "${GREEN}API está respondendo (status code: $status_code)${NC}"
    if [ "$FULL_CHECK" = true ]; then
      echo -e "${YELLOW}Resposta da API:${NC}"
      curl -s "${APP_URL}/api/status"
      echo ""
    fi
  else
    echo -e "${RED}API não está respondendo corretamente (status code: $status_code)${NC}"
  fi
else
  echo -e "${YELLOW}Comando 'curl' não encontrado. Não foi possível verificar a API.${NC}"
fi
echo ""

# Verificação completa (todos os endpoints importantes)
if [ "$FULL_CHECK" = true ]; then
  echo -e "${BLUE}===== Verificação Completa da API =====${NC}"
  
  endpoints=("customers" "devices" "services" "inventory")
  
  for endpoint in "${endpoints[@]}"; do
    echo -e "${YELLOW}Verificando endpoint: /api/${endpoint}${NC}"
    
    if command -v curl &> /dev/null; then
      status_code=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/api/${endpoint}")
      if [ $status_code -eq 200 ]; then
        echo -e "${GREEN}Endpoint /api/${endpoint} está respondendo (status code: $status_code)${NC}"
      else
        echo -e "${RED}Endpoint /api/${endpoint} não está respondendo corretamente (status code: $status_code)${NC}"
      fi
    else
      echo -e "${YELLOW}Comando 'curl' não encontrado. Não foi possível verificar o endpoint.${NC}"
    fi
  done
  echo ""
fi

# Verificar status de backup
echo -e "${BLUE}===== Status dos Backups =====${NC}"
if [ -d "/root/backups" ]; then
  echo -e "${YELLOW}Últimos backups do banco de dados:${NC}"
  ls -lt /root/backups/*.sql.gz 2>/dev/null | head -5 || echo "Nenhum backup encontrado."
  
  echo -e "${YELLOW}Últimos backups de arquivos:${NC}"
  ls -lt /root/backups/*.tar.gz 2>/dev/null | head -5 || echo "Nenhum backup encontrado."
else
  echo -e "${YELLOW}Diretório de backups não encontrado.${NC}"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}          Verificação Concluída         ${NC}"
echo -e "${BLUE}============================================${NC}" 