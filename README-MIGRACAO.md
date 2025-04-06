# Migração do PauloCell para Supabase e VPS Hostinger

Este documento descreve o processo de migração do sistema PauloCell da versão com armazenamento local (localStorage) e Firebase para uma versão em produção utilizando Supabase como banco de dados e hospedagem em um VPS da Hostinger.

## Índice

1. [Visão Geral da Migração](#visão-geral-da-migração)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração do Supabase](#configuração-do-supabase)
4. [Migração dos Dados](#migração-dos-dados)
5. [Deploy no VPS da Hostinger](#deploy-no-vps-da-hostinger)
6. [Automatização de Backups](#automatização-de-backups)
7. [Monitoramento e Logs](#monitoramento-e-logs)
8. [Resolução de Problemas](#resolução-de-problemas)

## Visão Geral da Migração

A migração do sistema envolveu as seguintes mudanças principais:

- Substituição do armazenamento local (localStorage) pelo Supabase PostgreSQL
- Migração da autenticação do Firebase para o Supabase Auth
- Configuração de um servidor Express otimizado para produção
- Implementação de backups automáticos
- Configuração do VPS na Hostinger para hospedar a aplicação

## Pré-requisitos

Antes de iniciar o processo de migração, certifique-se de ter:

- Conta no Supabase (https://supabase.com)
- Plano de VPS na Hostinger contratado
- Node.js 18+ instalado no VPS
- Acesso SSH ao VPS
- Domínio configurado (opcional, mas recomendado)

## Configuração do Supabase

### 1. Criação do Projeto

1. Acesse o dashboard do Supabase e crie um novo projeto
2. Anote a URL do projeto e a chave anônima (public key)
3. Anote também a chave de serviço (service role key) para uso no servidor

### 2. Configuração do Banco de Dados

Execute o script SQL fornecido no arquivo `supabase-schema.sql` no SQL Editor do Supabase:

1. No dashboard do Supabase, navegue até a seção "SQL Editor"
2. Crie um novo script
3. Cole o conteúdo do arquivo `supabase-schema.sql`
4. Execute o script para criar todas as tabelas e configurações necessárias

### 3. Configuração da Autenticação

1. No dashboard do Supabase, navegue até "Authentication" > "Providers"
2. Habilite o provedor "Email" e, se necessário, configure a verificação de email
3. Para configurar o login com Google:
   - Habilite o provedor "Google"
   - Configure um projeto no Google Cloud Console (https://console.cloud.google.com)
   - Crie credenciais OAuth e adicione as URLs de redirecionamento do Supabase
   - Copie o Client ID e Client Secret para o Supabase

## Migração dos Dados

### 1. Instalação das Dependências

Certifique-se de instalar a biblioteca do Supabase no projeto:

```bash
npm install @supabase/supabase-js
```

### 2. Configuração das Variáveis de Ambiente

Crie ou edite o arquivo `.env` com as configurações necessárias (use `.env.example` como referência).

### 3. Migração dos Dados do localStorage

A função `migrateLocalStorageToSupabase()` foi criada no arquivo `src/lib/supabase.ts` para facilitar a migração dos dados. Para utilizá-la:

1. Acesse o sistema na versão antiga (com localStorage)
2. Abra o console do navegador (F12)
3. Execute o código:

```javascript
import { migrateLocalStorageToSupabase } from './lib/supabase';
await migrateLocalStorageToSupabase();
```

Ou adicione um botão de migração na interface de administração do sistema.

## Deploy no VPS da Hostinger

### 1. Configuração Inicial do VPS

1. Acesse seu VPS via SSH:

```bash
ssh root@seu-ip-vps
```

2. Atualize o sistema:

```bash
apt update && apt upgrade -y
```

3. Instale o Node.js, Nginx e outras dependências:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx git
```

### 2. Configuração do Nginx

1. Crie um arquivo de configuração para o seu site:

```bash
nano /etc/nginx/sites-available/paulocell
```

2. Adicione a seguinte configuração, substituindo `seu-dominio.com` pelo seu domínio:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

3. Ative a configuração e reinicie o Nginx:

```bash
ln -s /etc/nginx/sites-available/paulocell /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

4. Configure SSL com Certbot:

```bash
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 3. Deploy do Código

1. Clone o repositório (ou faça upload via SFTP):

```bash
mkdir -p /var/www
cd /var/www
git clone https://seu-repositorio-git/paulocell.git
cd paulocell
```

2. Instale as dependências e faça o build:

```bash
npm install
npm run build
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
nano .env  # Edite com os valores corretos para produção
```

4. Instale o PM2 para gerenciar o processo do Node.js:

```bash
npm install -g pm2
pm2 start server.js --name paulocell
pm2 save
pm2 startup
```

## Automatização de Backups

### 1. Backup do Banco de Dados Supabase

O Supabase fornece backups automáticos incluídos em todos os planos pagos. No entanto, você pode criar backups adicionais usando a API do Supabase ou o CLI.

1. Instale o Supabase CLI:

```bash
npm install -g supabase
```

2. Crie um script de backup:

```bash
nano /var/www/paulocell/backup-script.sh
```

3. Adicione o seguinte conteúdo:

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# Backup do Supabase usando pgdump
PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump -h db.seu-projeto.supabase.co -U postgres -d postgres -f $BACKUP_DIR/paulocell-$DATE.sql

# Compactar o backup
gzip $BACKUP_DIR/paulocell-$DATE.sql

# Remover backups mais antigos que 30 dias
find $BACKUP_DIR -name "paulocell-*.sql.gz" -mtime +30 -delete
```

4. Torne o script executável e agende no crontab:

```bash
chmod +x /var/www/paulocell/backup-script.sh
crontab -e
```

5. Adicione a seguinte linha para executar diariamente à 1h da manhã:

```
0 1 * * * /var/www/paulocell/backup-script.sh >> /var/log/paulocell-backup.log 2>&1
```

### 2. Backup dos Arquivos do VPS

1. Crie um script para backup dos arquivos:

```bash
nano /var/www/paulocell/backup-files.sh
```

2. Adicione o seguinte conteúdo:

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# Backup dos arquivos da aplicação
tar -czf $BACKUP_DIR/paulocell-files-$DATE.tar.gz /var/www/paulocell

# Backup das configurações do Nginx
tar -czf $BACKUP_DIR/paulocell-nginx-$DATE.tar.gz /etc/nginx/sites-available/paulocell

# Remover backups mais antigos que 30 dias
find $BACKUP_DIR -name "paulocell-files-*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "paulocell-nginx-*.tar.gz" -mtime +30 -delete
```

3. Torne o script executável e agende no crontab:

```bash
chmod +x /var/www/paulocell/backup-files.sh
crontab -e
```

4. Adicione a seguinte linha para executar semanalmente:

```
0 2 * * 0 /var/www/paulocell/backup-files.sh >> /var/log/paulocell-files-backup.log 2>&1
```

## Monitoramento e Logs

### 1. Configuração de Logs no VPS

1. Configure o PM2 para armazenar logs:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

2. Verifique os logs:

```bash
pm2 logs paulocell
```

### 2. Monitoramento com o Dashboard do Supabase

O dashboard do Supabase fornece informações sobre:

- Uso do banco de dados
- Requisições de autenticação
- Performance das consultas
- Armazenamento utilizado

Acesse regularmente para monitorar o uso.

## Resolução de Problemas

### Problemas Comuns

1. **Erro de conexão com o Supabase**
   - Verifique as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   - Confirme se o projeto do Supabase está ativo
   - Certifique-se de que o URL e as chaves não contêm espaços ou caracteres especiais

2. **Erros ao executar scripts**
   - Problemas com ES modules: Certifique-se de que o Node.js está na versão 14+ e que o package.json tem `"type": "module"`
   - Execute os scripts com `node scripts/nome-do-script.js` em vez de `bash scripts/nome-do-script.js`
   - Em caso de erros de permissão, execute `chmod +x scripts/setup-scripts.sh && ./scripts/setup-scripts.sh` para configurar permissões

3. **Problemas de codificação em arquivos**
   - Se aparecerem caracteres estranhos (como `Ã£`), execute: `iconv -f ISO-8859-1 -t UTF-8 arquivo.sh > arquivo-fixed.sh && mv arquivo-fixed.sh arquivo.sh`
   - No Windows, abra os arquivos em um editor como o VS Code e salve com codificação UTF-8

4. **Erros de autenticação**
   - Verifique as configurações do provedor no painel do Supabase
   - Certifique-se de que as URLs de redirecionamento estão corretas

5. **Servidor Node.js caindo**
   - Verifique os logs: `pm2 logs paulocell`
   - Aumente a memória alocada: `pm2 start server.js --name paulocell --node-args="--max-old-space-size=1024"`

### Suporte

Para suporte adicional:

1. Consulte a [documentação do Supabase](https://supabase.com/docs)
2. Acesse o [suporte da Hostinger](https://www.hostinger.com.br/suporte)
3. Entre em contato com o desenvolvimento pelo email: seu.email@exemplo.com

---

## Status Atual da Migração

### Componentes Concluídos

✅ Configuração do servidor Express para produção  
✅ Schema do banco de dados Supabase  
✅ Scripts de migração de dados  
✅ Scripts de backup automático  
✅ Scripts de verificação do sistema  
✅ Integração com a API do Supabase  
✅ Documentação básica da migração  

### Próximos Passos

1. **Criar um projeto real no Supabase**
   - Registre-se em https://supabase.com e crie um novo projeto
   - Substitua as URLs e chaves de exemplo nos arquivos `.env` e `.env.production`
   - Execute o script SQL de schema para criar as tabelas no Supabase

2. **Configurar o VPS na Hostinger**
   - Contrate um plano VPS na Hostinger
   - Use o script `setup-hostinger-vps.sh` para configurar o ambiente
   - Configure um domínio para apontar para o VPS

3. **Migrar Dados do Sistema Atual**
   - Faça uma exportação do localStorage da aplicação atual
   - Execute o script `migrate-to-supabase.js` para carregar os dados no Supabase

4. **Testar o Sistema**
   - Verifique se todas as operações estão funcionando corretamente
   - Execute o script `check-status.sh --full` para uma verificação completa

5. **Monitoramento Contínuo**
   - Configure alertas para falhas no sistema
   - Verifique regularmente os backups

Documento criado em: Março 2024  
Última atualização: Abril 2024 