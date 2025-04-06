#!/bin/bash

# Script de configuração do VPS Hostinger para o PauloCell
# Uso: bash setup-hostinger-vps.sh seu-dominio.com email@exemplo.com

# Verificar se o domínio foi fornecido
if [ -z "$1" ]; then
  echo "Erro: Domínio não fornecido"
  echo "Uso: bash setup-hostinger-vps.sh seu-dominio.com email@exemplo.com"
  exit 1
fi

# Verificar se o email foi fornecido
if [ -z "$2" ]; then
  echo "Erro: Email não fornecido"
  echo "Uso: bash setup-hostinger-vps.sh seu-dominio.com email@exemplo.com"
  exit 1
fi

DOMAIN=$1
EMAIL=$2
APP_DIR="/var/www/paulocell"
BACKUP_DIR="/root/backups"

echo "=== Iniciando configuração do VPS para PauloCell ==="
echo "Domínio: $DOMAIN"
echo "Email: $EMAIL"

# Atualizar o sistema
echo "=== Atualizando o sistema ==="
apt update && apt upgrade -y

# Instalar dependências
echo "=== Instalando dependências ==="
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx git ufw fail2ban build-essential postgresql-client

# Configurar firewall
echo "=== Configurando firewall ==="
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# Configurar Fail2ban
echo "=== Configurando Fail2ban ==="
systemctl enable fail2ban
systemctl start fail2ban

# Criar diretório de aplicação
echo "=== Criando diretório da aplicação ==="
mkdir -p $APP_DIR
mkdir -p $BACKUP_DIR

# Configurar Nginx
echo "=== Configurando Nginx ==="
cat > /etc/nginx/sites-available/paulocell << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Cabeçalhos de segurança
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Configurações de cache para arquivos estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
    
    # Logs
    access_log /var/log/nginx/paulocell_access.log;
    error_log /var/log/nginx/paulocell_error.log;
}
EOF

# Ativar configuração do Nginx
ln -s /etc/nginx/sites-available/paulocell /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Configurar SSL com Certbot
echo "=== Configurando SSL com Certbot ==="
certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Instalar PM2 globalmente
echo "=== Instalando PM2 ==="
npm install -g pm2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Criar script de backup diário
echo "=== Configurando scripts de backup ==="
cat > $APP_DIR/backup-db.sh << EOF
#!/bin/bash
DATE=\$(date +%Y-%m-%d)
BACKUP_DIR="$BACKUP_DIR"

# Backup do Supabase usando pgdump (necessário configurar as variáveis de ambiente)
if [ -n "\$SUPABASE_DB_PASSWORD" ] && [ -n "\$SUPABASE_DB_HOST" ]; then
  PGPASSWORD=\$SUPABASE_DB_PASSWORD pg_dump -h \$SUPABASE_DB_HOST -U postgres -d postgres -f \$BACKUP_DIR/paulocell-\$DATE.sql
  # Compactar o backup
  gzip \$BACKUP_DIR/paulocell-\$DATE.sql
  echo "Backup do banco de dados concluído: \$BACKUP_DIR/paulocell-\$DATE.sql.gz"
else
  echo "Variáveis de ambiente do banco de dados não configuradas"
fi

# Remover backups mais antigos que 30 dias
find \$BACKUP_DIR -name "paulocell-*.sql.gz" -mtime +30 -delete
EOF

# Criar script de backup dos arquivos
cat > $APP_DIR/backup-files.sh << EOF
#!/bin/bash
DATE=\$(date +%Y-%m-%d)
BACKUP_DIR="$BACKUP_DIR"

# Backup dos arquivos da aplicação
tar -czf \$BACKUP_DIR/paulocell-files-\$DATE.tar.gz $APP_DIR

# Backup das configurações do Nginx
tar -czf \$BACKUP_DIR/paulocell-nginx-\$DATE.tar.gz /etc/nginx/sites-available/paulocell /etc/nginx/sites-enabled/paulocell

# Log
echo "Backup de arquivos concluído: \$BACKUP_DIR/paulocell-files-\$DATE.tar.gz"
echo "Backup do Nginx concluído: \$BACKUP_DIR/paulocell-nginx-\$DATE.tar.gz"

# Remover backups mais antigos que 30 dias
find \$BACKUP_DIR -name "paulocell-files-*.tar.gz" -mtime +30 -delete
find \$BACKUP_DIR -name "paulocell-nginx-*.tar.gz" -mtime +30 -delete
EOF

# Tornar scripts executáveis
chmod +x $APP_DIR/backup-db.sh
chmod +x $APP_DIR/backup-files.sh

# Configurar crontab para os backups
(crontab -l 2>/dev/null; echo "0 1 * * * $APP_DIR/backup-db.sh >> /var/log/paulocell-backup.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * 0 $APP_DIR/backup-files.sh >> /var/log/paulocell-files-backup.log 2>&1") | crontab -

# Criar script de deploy
echo "=== Criando script de deploy ==="
cat > $APP_DIR/deploy.sh << EOF
#!/bin/bash
# Script de deploy para o PauloCell

# Ir para o diretório da aplicação
cd $APP_DIR

# Puxar as últimas alterações do repositório
git pull

# Instalar dependências
npm install

# Construir a aplicação
npm run build

# Reiniciar o servidor
pm2 restart paulocell || pm2 start server.js --name paulocell

echo "Deploy concluído!"
EOF

chmod +x $APP_DIR/deploy.sh

# Criar script para verificar e reiniciar o servidor se necessário
cat > $APP_DIR/check-server.sh << EOF
#!/bin/bash
# Verifica se o servidor está rodando e reinicia se necessário

# Verificar se o processo do PM2 está rodando
if ! pm2 show paulocell > /dev/null 2>&1; then
  echo "Servidor paulocell não está rodando. Reiniciando..."
  cd $APP_DIR
  pm2 start server.js --name paulocell
else
  # Verificar se o servidor está respondendo
  if ! curl -s http://localhost:3000/api/status > /dev/null; then
    echo "Servidor não está respondendo. Reiniciando..."
    pm2 restart paulocell
  else
    echo "Servidor está funcionando normalmente."
  fi
fi
EOF

chmod +x $APP_DIR/check-server.sh

# Adicionar verificação do servidor a cada 10 minutos
(crontab -l 2>/dev/null; echo "*/10 * * * * $APP_DIR/check-server.sh >> /var/log/paulocell-server-check.log 2>&1") | crontab -

# Configurar log rotation para os logs da aplicação
cat > /etc/logrotate.d/paulocell << EOF
/var/log/paulocell-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
}
EOF

echo "=== Configuração concluída! ==="
echo "Próximos passos:"
echo "1. Clone seu repositório git no diretório $APP_DIR"
echo "2. Configure as variáveis de ambiente no arquivo .env"
echo "3. Execute o script de deploy: $APP_DIR/deploy.sh"
echo "4. Configure as variáveis do Supabase para os backups do banco de dados"
echo ""
echo "Seu site estará disponível em: https://$DOMAIN" 