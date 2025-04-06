#!/bin/bash

# Script aprimorado para limpar completamente o projeto PauloCell antes do deploy em produção
# Uso: bash scripts/clean-project.sh [diretório-projeto]

# Diretório base do projeto (usar diretório atual se não especificado)
PROJECT_DIR=${1:-$(pwd)}

echo "=== Iniciando limpeza completa do projeto PauloCell ==="
echo "Diretório do projeto: $PROJECT_DIR"

# Criar diretório para backup temporário dos arquivos removidos
BACKUP_DIR="$PROJECT_DIR/.cleanup_backup_$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup temporário dos arquivos removidos: $BACKUP_DIR"

# Função para fazer backup antes de remover
backup_and_remove() {
  local src="$1"
  if [ -e "$src" ]; then
    local dest="$BACKUP_DIR/$(basename "$src")"
    cp -r "$src" "$dest"
    rm -rf "$src"
    echo "✅ Removido: $src"
  fi
}

# ==========================================
# 1. REMOÇÃO DE ARQUIVOS DE DOCUMENTAÇÃO
# ==========================================
echo "=== Removendo arquivos de documentação desnecessários ==="

# Manter apenas README.md principal e README-MIGRACAO.md
find "$PROJECT_DIR" -type f -name "*.md" | grep -v "README.md" | grep -v "README-MIGRACAO.md" | grep -v "CHANGELOG.md" | while read file; do
  backup_and_remove "$file"
done

# Remover todos os arquivos HTML de documentação
find "$PROJECT_DIR" -type f -name "guia-*.html" -o -name "*-guide.html" -o -name "*-tutorial.html" | while read file; do
  backup_and_remove "$file"
done

# ==========================================
# 2. REMOÇÃO DE ARQUIVOS DE DESENVOLVIMENTO E TEMPORÁRIOS
# ==========================================
echo "=== Removendo arquivos de desenvolvimento e temporários ==="

# Remover diretórios de IDE e configurações locais
for dir in .vscode .idea .eclipse .settings .github __pycache__ .pytest_cache .nyc_output coverage; do
  backup_and_remove "$PROJECT_DIR/$dir"
done

# Remover arquivos de sistema operacional
find "$PROJECT_DIR" -name ".DS_Store" -o -name "Thumbs.db" -o -name "desktop.ini" -o -name "*.swp" | while read file; do
  backup_and_remove "$file"
done

# Remover arquivos de log
find "$PROJECT_DIR" -name "*.log" -o -name "npm-debug.log*" -o -name "yarn-debug.log*" -o -name "yarn-error.log*" | while read file; do
  backup_and_remove "$file"
done

# Remover arquivos temporários do Vite
find "$PROJECT_DIR" -name "*.timestamp-*" | while read file; do
  backup_and_remove "$file"
done

# ==========================================
# 3. REMOÇÃO DE ARQUIVOS DE CONFIGURAÇÃO REDUNDANTES
# ==========================================
echo "=== Removendo arquivos de configuração redundantes ==="

# Remover configurações de desenvolvimento
backup_and_remove "$PROJECT_DIR/.env.development"
backup_and_remove "$PROJECT_DIR/.env.local"
backup_and_remove "$PROJECT_DIR/.env.test"

# Scripts de desenvolvimento Windows/Mac
find "$PROJECT_DIR" -name "*.bat" -o -name "*.cmd" -o -name "*.sh" | grep -v "scripts/" | grep -v "clean-project.sh" | grep -v "setup-hostinger-vps.sh" | grep -v "backup-data.sh" | grep -v "deploy.sh" | while read file; do
  backup_and_remove "$file"
done

# ==========================================
# 4. REMOÇÃO DE ARQUIVOS DE CÓDIGO LEGADO E DESCONTINUADO
# ==========================================
echo "=== Removendo arquivos de código legado ==="

# Firebase (manter cópia de backup)
if [ -f "$PROJECT_DIR/src/lib/firebase.ts" ]; then
  cp "$PROJECT_DIR/src/lib/firebase.ts" "$BACKUP_DIR/firebase.ts.bak"
  rm -f "$PROJECT_DIR/src/lib/firebase.ts"
  echo "✅ Arquivo firebase.ts removido e salvo como backup"
fi

# Outros arquivos legados ou de teste
find "$PROJECT_DIR" -name "*-test.*" -o -name "*Test.*" -o -name "*Tester.*" -o -name "*Demo.*" -o -name "*Example.*" | while read file; do
  backup_and_remove "$file"
done

# ==========================================
# 5. REMOÇÃO DE DIRETÓRIOS DESNECESSÁRIOS
# ==========================================
echo "=== Removendo diretórios desnecessários ==="

# Diretórios de build, testes e exemplos
for dir in dist build .cache tests test __tests__ examples demo mock mocks docs .firebase backup-scripts; do
  backup_and_remove "$PROJECT_DIR/$dir"
done

# Remover node_modules (pode ser reinstalado com npm install)
if [ -d "$PROJECT_DIR/node_modules" ]; then
  echo "Removendo node_modules..."
  rm -rf "$PROJECT_DIR/node_modules"
  echo "✅ Diretório node_modules removido"
fi

# ==========================================
# 6. REMOÇÃO DE ARQUIVOS DE GRANDE PORTE DESNECESSÁRIOS
# ==========================================
echo "=== Removendo arquivos grandes desnecessários ==="

# Instaladores, executáveis, etc.
find "$PROJECT_DIR" -name "*.exe" -o -name "*.msi" -o -name "*.dmg" -o -name "*.pkg" -o -name "*.deb" -o -name "*.rpm" | while read file; do
  backup_and_remove "$file"
done

# Arquivos de mídia grandes que podem ser amostras
find "$PROJECT_DIR" -size +5M -not -path "*/node_modules/*" | while read file; do
  echo "Arquivo grande encontrado: $file ($(du -h "$file" | cut -f1))"
  read -p "Remover este arquivo? (s/n): " choice
  if [ "$choice" = "s" ]; then
    backup_and_remove "$file"
  fi
done

# ==========================================
# 7. OTIMIZAÇÃO DE CÓDIGO
# ==========================================
echo "=== Otimizando o código ==="

# Otimizar package.json (remover scripts e dependências de desenvolvimento não essenciais)
echo "Recomendado: Revisar manualmente package.json para remover dependências de desenvolvimento não essenciais"

# ==========================================
# 8. LIMPEZA FINAL
# ==========================================
echo "=== Limpeza final ==="

# Remover diretórios vazios
find "$PROJECT_DIR" -type d -empty -not -path "*/.git/*" -delete
echo "✅ Diretórios vazios removidos"

# ==========================================
# RESUMO E CONCLUSÃO
# ==========================================
echo ""
echo "=== Limpeza concluída! ==="
echo "Total de espaço recuperado: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo ""
echo "Os arquivos removidos foram salvos em: $BACKUP_DIR"
echo "Você pode excluir este diretório de backup quando tiver certeza de que tudo está funcionando corretamente:"
echo "  rm -rf \"$BACKUP_DIR\""
echo ""
echo "Próximos passos:"
echo "1. Instale as dependências: npm install"
echo "2. Configure as variáveis de ambiente: cp .env.example .env && nano .env"
echo "3. Teste o projeto localmente: npm run dev"
echo "4. Faça o build e deploy: npm run deploy"
echo ""
echo "O projeto está pronto para produção!" 