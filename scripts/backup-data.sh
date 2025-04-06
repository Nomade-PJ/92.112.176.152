#!/bin/bash

# Script para fazer backup dos dados do Supabase para o PauloCell
# Uso: bash scripts/backup-data.sh [diretório-destino]

# Formatar data atual
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# Diretório base do projeto
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
PROJECT_DIR=$(readlink -f "$SCRIPT_DIR/..")

# Diretório de destino para backups (pode ser sobrescrito pelo parâmetro)
BACKUP_DIR=${1:-"$PROJECT_DIR/backups"}

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Nome do arquivo de backup
BACKUP_FILE="$BACKUP_DIR/paulocell_backup_$DATE.json"

# Carregar variáveis de ambiente
if [ -f "$PROJECT_DIR/.env" ]; then
  source "$PROJECT_DIR/.env"
elif [ -f "$PROJECT_DIR/.env.production" ]; then
  source "$PROJECT_DIR/.env.production"
fi

# Verificar se as variáveis do Supabase estão definidas
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "⚠️ Variáveis de ambiente do Supabase não encontradas!"
  echo "Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env"
  exit 1
fi

echo "=== Iniciando backup dos dados do Supabase ==="
echo "URL do Supabase: $VITE_SUPABASE_URL"
echo "Arquivo de backup: $BACKUP_FILE"

# Função para fazer backup de uma tabela específica
backup_table() {
  TABLE_NAME=$1
  TEMP_FILE="$BACKUP_DIR/temp_$TABLE_NAME.json"
  
  echo "Fazendo backup da tabela: $TABLE_NAME"
  
  # Usar curl para acessar a API REST do Supabase
  curl -s -X GET "$VITE_SUPABASE_URL/rest/v1/$TABLE_NAME" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" > "$TEMP_FILE"
  
  # Verificar se o download foi bem-sucedido
  if [ $? -ne 0 ] || [ ! -s "$TEMP_FILE" ]; then
    echo "❌ Erro ao fazer backup da tabela $TABLE_NAME"
    rm -f "$TEMP_FILE"
    return 1
  fi
  
  # Verificar se o resultado é um JSON válido
  if ! jq . "$TEMP_FILE" > /dev/null 2>&1; then
    echo "❌ Erro: dados da tabela $TABLE_NAME não são um JSON válido"
    cat "$TEMP_FILE" | head -n 50
    rm -f "$TEMP_FILE"
    return 1
  fi
  
  echo "✅ Backup da tabela $TABLE_NAME concluído"
  return 0
}

# Iniciar objeto JSON completo
echo "{" > "$BACKUP_FILE"

# Lista de tabelas para backup
TABLES=("customers" "devices" "services" "inventory" "documents" "settings" "trash_bin" "statistics" "activity_logs")

# Contador para controlar vírgulas entre tabelas
COUNT=0
TOTAL=${#TABLES[@]}

# Fazer backup de cada tabela
for TABLE in "${TABLES[@]}"; do
  TEMP_FILE="$BACKUP_DIR/temp_$TABLE.json"
  
  # Fazer backup da tabela
  backup_table "$TABLE"
  
  if [ $? -eq 0 ]; then
    # Adicionar dados da tabela ao arquivo de backup
    COUNT=$((COUNT+1))
    
    echo "  \"$TABLE\": " >> "$BACKUP_FILE"
    cat "$TEMP_FILE" >> "$BACKUP_FILE"
    
    # Adicionar vírgula se não for a última tabela
    if [ $COUNT -lt $TOTAL ]; then
      echo "," >> "$BACKUP_FILE"
    fi
  fi
  
  # Remover arquivo temporário
  rm -f "$TEMP_FILE"
done

# Fechar objeto JSON
echo "}" >> "$BACKUP_FILE"

# Validar arquivo JSON final
if ! jq . "$BACKUP_FILE" > /dev/null 2>&1; then
  echo "❌ Erro: arquivo de backup final não é um JSON válido"
  mv "$BACKUP_FILE" "$BACKUP_FILE.error"
  echo "Arquivo de backup movido para $BACKUP_FILE.error para inspeção"
  exit 1
fi

# Comprimir arquivo de backup
gzip -f "$BACKUP_FILE"
COMPRESSED_FILE="$BACKUP_FILE.gz"

echo "=== Backup concluído com sucesso! ==="
echo "Arquivo: $COMPRESSED_FILE"
echo "Tamanho: $(du -h "$COMPRESSED_FILE" | cut -f1)"

# Manter apenas os últimos 10 backups
echo "Removendo backups antigos (mantendo os 10 mais recentes)..."
ls -t "$BACKUP_DIR"/paulocell_backup_*.gz | tail -n +11 | xargs -I {} rm -f {}

echo "Backups disponíveis:"
ls -lh "$BACKUP_DIR"/paulocell_backup_*.gz | sort -r

exit 0 