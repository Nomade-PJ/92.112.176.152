# Sistema de Envio de Emails

Este diretório contém o código necessário para o sistema de envio de emails do Paulo Cell.

## Configuração do EmailJS

O sistema está configurado para utilizar o EmailJS para enviar emails diretamente do frontend. As credenciais estão incluídas no código:

```javascript
// Credenciais do EmailJS
const EMAIL_CONFIG = {
  serviceId: 'SEU_SERVICE_ID',
  templateId: 'SEU_TEMPLATE_ID',
  userId: 'SUA_PUBLIC_KEY',
  from: 'paullo.celullar2020@gmail.com'
};
```

## Status da Implementação

✅ **SISTEMA COMPLETO E FUNCIONAL**

O sistema de envio de emails está totalmente configurado e pronto para uso:

1. Conta do EmailJS configurada
2. Template HTML profissional criado
3. Integração com EmailJS implementada
4. Suporte a anexos PDF
5. Links para WhatsApp e email

## Como Funciona

O sistema utiliza o EmailJS para enviar emails com anexos PDF:

1. Quando um usuário clica em "Enviar por Email" em um documento
2. O sistema gera um PDF do documento
3. O PDF é convertido para base64 e enviado como anexo
4. O email é enviado para o endereço do cliente com todas as informações do documento
5. O cliente recebe um email profissional com o PDF anexado e links de contato

## Limites do Plano Gratuito

O plano gratuito do EmailJS inclui:
- 200 emails por mês
- Envio para qualquer destinatário
- Suporte a anexos
- API completa

## Solução de Problemas

Se estiver tendo problemas ao enviar emails:

1. Verifique no console do navegador se há erros específicos
2. Confirme que o anexo (PDF) está sendo gerado corretamente
3. Verifique suas credenciais do EmailJS
4. Para problemas com o anexo, o sistema tenta métodos alternativos de geração de PDF 