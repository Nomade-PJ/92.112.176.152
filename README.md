# Paulo Cell Sistema

Sistema de gerenciamento para assistência técnica de dispositivos móveis e eletrônicos.

## Sobre o projeto

O Paulo Cell Sistema é uma aplicação completa para gerenciamento de assistências técnicas, que inclui:

- Cadastro e gestão de clientes
- Controle de dispositivos
- Gerenciamento de serviços e ordens de serviço
- Controle de estoque
- Emissão de documentos
- Relatórios e estatísticas

## Tecnologias utilizadas

Este projeto foi construído com tecnologias modernas:

- **React** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Adiciona tipagem estática ao JavaScript
- **Vite** - Build tool rápida para desenvolvimento
- **Tailwind CSS** - Framework CSS para estilização
- **shadcn/ui** - Componentes de UI pré-construídos
- **Recharts** - Biblioteca para visualização de dados
- **Lucide Icons** - Conjunto de ícones para a interface

## Como executar o projeto

Para rodar o projeto localmente, siga estes passos:

```sh
# Passo 1: Clone o repositório
git clone <URL_DO_REPOSITÓRIO>

# Passo 2: Entre na pasta do projeto
cd paulocell-10

# Passo 3: Instale as dependências
npm install

# Passo 4: Inicie o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173` (ou a porta indicada no terminal).

## Estrutura do projeto

```
src/
├── components/     # Componentes reutilizáveis
├── contexts/       # Contextos React (Auth, Notification, etc.)
├── lib/            # Funções utilitárias e helpers
├── pages/          # Páginas da aplicação
└── App.tsx         # Componente principal e rotas
```

## Contato

Para mais informações sobre o sistema, entre em contato através de:

- Site: [paulocell.com.br](https://paulocell.com.br)
- Email: contato@paulocell.com.br

## Novas Funcionalidades

### Exportação de Documentos por Período

O sistema agora permite exportar documentos fiscais filtrados por período, com cada documento em uma página separada no PDF gerado:

- **Filtros disponíveis**:
  - Últimos 7 dias
  - Último mês
  - Últimos 12 meses

- **Funcionalidades**:
  - Exportação em formato PDF com layout profissional
  - Cada documento é exibido em uma página separada
  - Documentos ordenados por data (mais recentes primeiro)
  - Incluir todos os detalhes dos documentos (cliente, itens, valores, observações)

Para usar esta funcionalidade:
1. Acesse a tela de Documentos
2. Clique no botão "Exportar"
3. Selecione "Exportar como PDF"
4. Escolha o período desejado (7 dias, 1 mês ou 12 meses)
5. Clique em "Exportar"

O sistema irá gerar um arquivo PDF contendo todos os documentos do período selecionado, organizados em páginas individuais.

## Envio de Emails com EmailJS

O sistema utiliza o EmailJS para enviar os documentos fiscais por email diretamente para os clientes. Para configurar e testar:

### Configuração

1. A biblioteca EmailJS já está instalada no projeto
2. As credenciais podem ser configuradas de duas formas:
   - Através do arquivo `src/lib/email-utils.ts` (valores padrão)
   - Através de variáveis de ambiente (recomendado):
     ```
     VITE_EMAILJS_SERVICE_ID=seu_service_id
     VITE_EMAILJS_TEMPLATE_ID=template_7zp0tqw
     VITE_EMAILJS_USER_ID=sua_public_key
     VITE_EMAILJS_FROM_EMAIL=seu_email@exemplo.com
     ```
   - Alternativamente, via localStorage (para testes):
     ```javascript
     localStorage.setItem('pauloCell_emailjs_service_id', 'seu_service_id');
     localStorage.setItem('pauloCell_emailjs_template_id', 'template_7zp0tqw');
     localStorage.setItem('pauloCell_emailjs_user_id', 'sua_public_key');
     localStorage.setItem('pauloCell_emailjs_from_email', 'seu_email@exemplo.com');
     ```

3. Você precisa ter uma conta no EmailJS (emailjs.com) com:
   - Um serviço configurado (Gmail, Outlook, ou serviço transacional)
   - Um template de email criado (atualmente configurado como "Feedback Request")
   - Uma chave pública (Public Key) de sua conta

### Como Testar

1. Acesse qualquer documento fiscal (NF-e, NFC-e, NFS-e)
2. Clique no botão "Enviar por Email"
3. O sistema tentará encontrar automaticamente o email do cliente:
   - Se encontrar, enviará o email diretamente
   - Se não encontrar, solicitará que você insira o email
4. O sistema gerará o PDF e enviará por email usando o EmailJS
5. Verifique o console do navegador para acompanhar o progresso e identificar possíveis erros

### Resolução de Problemas Comuns

- **Falha na comunicação**: 
  - **SOLUÇÃO PRINCIPAL**: Verifique se as credenciais estão corretas e atualizadas:
    1. Acesse o [Dashboard do EmailJS](https://dashboard.emailjs.com/admin)
    2. Anote seu Service ID, Template ID e Public Key
    3. Atualize esses valores usando variáveis de ambiente ou localStorage conforme explicado acima
  - Verifique sua conexão com a internet
  - Confirme que o firewall ou proxy não está bloqueando as requisições para EmailJS
  - Tente novamente mais tarde, pois pode ser um problema temporário com o serviço
  
- **Credenciais inválidas**:
  - Acesse https://dashboard.emailjs.com/admin
  - Verifique os IDs corretos de serviço e template
  - Certifique-se que sua conta e serviço no EmailJS estão ativos
  - Caso esteja usando o Gmail, verifique se você concedeu permissão para aplicativos menos seguros

- **Problemas com o template**:
  - Verifique se o template esperado pelo código está ativo em sua conta
  - Certifique-se que o template tenha os parâmetros: `to_email`, `subject`, `message`, `from_email` e `from_name`

- **Limite de envios atingido**:
  - O plano gratuito do EmailJS tem limites de envios mensais (200/mês)
  - Considere fazer upgrade para um plano pago se necessário

- **Problemas com o anexo**:
  - O tamanho máximo dos anexos é limitado (geralmente 5MB)
  - Verifique se o PDF está sendo gerado corretamente

- **Emails não recebidos**:
  - Verifique a pasta de spam do destinatário
  - Confirme que o endereço de email está correto
  - Verifique o status da API do EmailJS em [status.emailjs.com](https://status.emailjs.com)

### Monitoramento e Logs

A aplicação registra informações detalhadas no console do navegador durante o processo de envio de emails. Para verificar:

1. Abra as Ferramentas de Desenvolvedor (F12 ou Ctrl+Shift+I)
2. Vá para a aba "Console"
3. Procure mensagens relacionadas ao EmailJS para diagnóstico
4. Verifique também a resposta da API na aba "Network" (Rede)

## Geração de PDF de Documentos Fiscais

O sistema usa a biblioteca jsPDF para gerar documentos fiscais em formato PDF com um layout profissional. O módulo responsável pela geração de PDFs está em `src/lib/document-pdf-utils.ts`.

### Funcionalidades de Geração de PDF

- Geração de PDFs para documentos fiscais (NF-e, NFC-e, NFS-e)
- Layout profissional com cabeçalho, tabela de itens e informações detalhadas
- Suporte para múltiplos tipos de documentos com campos específicos por tipo
- Exportação de múltiplos documentos em um único PDF

### Como Funciona

O sistema oferece várias funções para geração de PDFs:

1. **generateEnhancedDocumentPDF** - Gera um PDF completo para um único documento fiscal
2. **generateEnhancedPrintContent** - Cria conteúdo formatado para impressão
3. **generateMultipleDocumentsPDF** - Exporta múltiplos documentos em um único PDF

### Correções Implementadas

- Corrigido o formato de importação da extensão 'jspdf-autotable' para garantir compatibilidade
- Adicionada anotação para ignorar erros de tipagem em importações específicas
- Melhorada a compatibilidade com diferentes navegadores

### Como Testar

1. Acesse qualquer documento fiscal na tela de Documentos
2. Clique no botão "Visualizar" ou "Imprimir"
3. O sistema irá gerar um PDF com o documento formatado
4. Para exportar múltiplos documentos, use o botão "Exportar" na tela de listagem de Documentos
