#!/bin/bash

# Script para configurar permissões e tornar os scripts executáveis
# Uso: bash setup-scripts.sh

# Cores para saída
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Obter diretório do script
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")

echo -e "${GREEN}Configurando permissões de scripts...${NC}"

# Tornar todos os scripts executáveis
chmod +x "$SCRIPT_DIR"/*.sh

# Listar scripts configurados
echo -e "${GREEN}Scripts configurados com sucesso:${NC}"
ls -la "$SCRIPT_DIR"/*.sh

echo ""
echo -e "${GREEN}Agora você pode executar os scripts diretamente:${NC}"
echo "  ./scripts/deploy.sh"
echo "  ./scripts/clean-project.sh"
echo "  ./scripts/backup-data.sh"
echo "  ./scripts/check-status.sh"
echo "  ./scripts/setup-hostinger-vps.sh"
echo ""
echo -e "${GREEN}Para executar a migração de dados:${NC}"
echo "  npm run migrate" 