# Changelog PauloCell

## [2.0.0] - Março 2024 - Migração para Supabase e VPS Hostinger

### Adicionado
- Integração com Supabase como banco de dados PostgreSQL
- Autenticação com Supabase Auth (suporte para Google OAuth e Email/Senha)
- Scripts de configuração para o VPS da Hostinger
- Sistema de backup automatizado para banco de dados e arquivos
- Monitoramento e logs via Supabase e PM2
- Ambiente de produção otimizado com Nginx e certificados SSL/TLS
- Novos scripts para facilitar o deploy e manutenção

### Alterado
- Migração completa do armazenamento localStorage para Supabase
- Modificação do sistema de autenticação (Firebase para Supabase)
- Otimização do servidor Express para produção
- Refatoração dos contextos de autenticação e dados
- Melhorias de segurança em todo o sistema

### Removido
- Dependência do Firebase
- Armazenamento local via localStorage
- Arquivos e documentação desnecessários
- Scripts de desenvolvimento obsoletos
- Configurações duplicadas ou não utilizadas

### Correções
- Problemas de sincronização de dados entre dispositivos
- Questões de segurança relacionadas ao armazenamento local
- Tratamento de erros aprimorado em toda a aplicação
- Melhorias na validação de formulários
- Otimização da performance em dispositivos móveis

## [1.5.0] - Janeiro 2024

### Adicionado
- Integração com EmailJS para envio de notificações
- Exportação de dados em formatos PDF e Excel
- Estatísticas e relatórios avançados
- Tema escuro e personalização da interface

### Alterado
- Melhorias na interface do usuário
- Otimização da performance
- Atualização de dependências

### Correções
- Correções de bugs menores
- Melhorias na responsividade

## [1.0.0] - Novembro 2023

### Adicionado
- Versão inicial do sistema PauloCell
- Gestão de clientes
- Gestão de dispositivos
- Gestão de serviços
- Inventário básico
- Geração de documentos simples
- Autenticação com Firebase 