import { toast } from 'sonner';

/**
 * Opções para envio de email
 */
export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  attachmentPath?: string;
  attachmentName?: string;
}

/**
 * Interface para um item de documento
 */
interface DocumentItem {
  id: string;
  documentId: string;
  description: string;
  quantity: number;
  unit: string;
  unitValue: number;
  totalValue: number;
  taxRate?: number;
}

/**
 * Interface para um documento com seus itens
 */
interface DocumentWithItems {
  id: string;
  type: string;
  number: string;
  date: string;
  value: number;
  customerId?: string;
  customer?: string;
  customerDocument?: string;
  description?: string;
  operationNature?: string;
  taxRate?: number;
  keyAccess?: string;
  items?: DocumentItem[];
  status?: string;
  paymentMethod?: string;
}

// Obter credenciais de variáveis de ambiente se disponíveis
const getEnvValue = (key: string, defaultValue: string): string => {
  if (typeof window !== 'undefined') {
    // Cliente: tenta obter do localStorage
    const fromLocal = localStorage.getItem(`pauloCell_${key}`);
    if (fromLocal) return fromLocal;
  }

  // Tenta obter das variáveis de ambiente
  const envKey = `VITE_${key.toUpperCase()}`;
  const envValue = (import.meta.env && import.meta.env[envKey]) || '';
  
  // Retorna o valor do ambiente ou o padrão
  return envValue || defaultValue;
};

// Credenciais do EmailJS
const EMAIL_CONFIG = {
  serviceId: getEnvValue('emailjs_service_id', 'service_jlv3vyk'),
  templateId: getEnvValue('emailjs_template_id', '_ejs-test-mail-service_'),
  userId: getEnvValue('emailjs_user_id', 'cZZtl9I3FsHrpWogG'),
  from: getEnvValue('emailjs_from_email', 'paullo.celullar2020@gmail.com')
};

// Verificar manualmente as credenciais no console
console.log('Credenciais do EmailJS:');
console.log('- Service ID:', EMAIL_CONFIG.serviceId);
console.log('- Template ID:', EMAIL_CONFIG.templateId);
console.log('- Public Key:', EMAIL_CONFIG.userId);
console.log('- From Email:', EMAIL_CONFIG.from);

// Adicionar função para validar as credenciais
const validateEmailJSConfig = (): boolean => {
  if (!EMAIL_CONFIG.serviceId || EMAIL_CONFIG.serviceId === 'service_xxk2yjn') {
    console.warn('Usando ID de serviço padrão do EmailJS. Verifique se está correto.');
  }
  
  if (!EMAIL_CONFIG.templateId || EMAIL_CONFIG.templateId === 'template_xxf3sqr') {
    console.warn('Usando ID de template padrão do EmailJS. Verifique se está correto.');
  }
  
  if (!EMAIL_CONFIG.userId || EMAIL_CONFIG.userId === 'cZZtl9I3FsHrpWogG') {
    console.warn('Usando Public Key padrão do EmailJS. Verifique se está correto.');
  }
  
  return !!(EMAIL_CONFIG.serviceId && EMAIL_CONFIG.templateId && EMAIL_CONFIG.userId);
};

// Validar configurações ao carregar o módulo
validateEmailJSConfig();

/**
 * Gera um PDF simples para um documento
 * Função alternativa em caso de falha do método avançado
 */
const generateSimplePDF = async (document: DocumentWithItems): Promise<string> => {
  try {
    // Importar jsPDF diretamente
    const jsPDF = (await import('jspdf')).default;
    
    // Criar uma instância do PDF com configurações otimizadas para tamanho
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true // Ativar compressão
    });
    
    // Adicionar título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Documento ${document.type.toUpperCase()}-${document.number}`, 10, 10);
    
    // Adicionar informações básicas
    doc.setFontSize(11); // Fonte menor para reduzir tamanho
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${document.customer}`, 10, 20);
    doc.text(`Data: ${new Date(document.date).toLocaleDateString('pt-BR')}`, 10, 25);
    doc.text(`Valor: ${new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(document.value)}`, 10, 30);
    
    // Adicionar lista de itens se disponível (limitado aos primeiros 5 itens)
    if (document.items && document.items.length > 0) {
      doc.text("Itens:", 10, 40);
      
      let y = 45;
      // Limitar a quantidade de itens para manter o PDF pequeno
      const maxItems = Math.min(document.items.length, 5);
      
      for (let i = 0; i < maxItems; i++) {
        const item = document.items[i];
        const itemText = `${i + 1}. ${item.description.substring(0, 30)} - ${item.quantity} x ${item.unitValue.toFixed(2)} = ${(item.quantity * item.unitValue).toFixed(2)}`;
        doc.text(itemText, 10, y);
        y += 5; // Espaçamento menor entre linhas
      }
      
      // Se houver mais itens do que o limite, adicionar uma observação
      if (document.items.length > maxItems) {
        doc.text(`...e mais ${document.items.length - maxItems} itens`, 10, y + 5);
      }
    }
    
    // Adicionar rodapé
    doc.setFontSize(8);
    doc.text("Paulo Cell - Documento Fiscal", 10, 280);
    
    // Retornar o PDF como Data URL com qualidade otimizada
    return doc.output('dataurlstring');
  } catch (error) {
    console.error("Erro na geração simples de PDF:", error);
    throw new Error("Falha na geração simples do PDF");
  }
};

// Adicionar função para compressão de Data URLs (PDF)
const compressPDFDataUrl = (dataUrl: string): string => {
  try {
    // Verificar se é um Data URL válido
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      console.warn('Data URL inválido para compressão');
      return dataUrl;
    }
    
    // Estimar o tamanho atual do PDF
    const estimatedKB = Math.round(dataUrl.length * 0.75 / 1024);
    
    // Se for menor que 1MB, não é necessário comprimir
    if (estimatedKB < 1024) {
      console.log(`PDF já é pequeno (${estimatedKB}KB), mantendo original`);
      return dataUrl;
    }
    
    console.log(`Tentando comprimir PDF de aproximadamente ${estimatedKB}KB`);
    
    // Para PDFs maiores, precisamos converter para outro formato
    // Já que não temos como comprimir diretamente o PDF,
    // podemos apenas retornar o original e confiar nas configurações
    // de compressão usadas durante a geração
    
    return dataUrl;
  } catch (error) {
    console.error('Erro ao comprimir PDF:', error);
    return dataUrl; // Retorna o original em caso de erro
  }
};

/**
 * Envia um email com anexo opcional
 */
export const sendEmail = async (
  to: string,
  subject: string,
  body: string,
  attachmentPath?: string,
  attachmentName?: string
): Promise<boolean> => {
  const toastId = 'sending-email';
  
  return new Promise(async (resolve) => {
    try {
      // Verificar conectividade com internet antes de tentar enviar
      if (!navigator.onLine) {
        toast.error('Sem conexão com a internet. Verifique sua rede e tente novamente.', {
          id: toastId
        });
        return resolve(false);
      }

      // Mostrar toast informando sobre o envio
      toast.loading(`Enviando documento para ${to}...`, {
        id: toastId,
        duration: 3000
      });
      
      try {
        // Importar EmailJS dinamicamente com suporte para múltiplas versões
        let emailjs;
        try {
          // Tentar importar versão 4.x+ (nova sintaxe)
          const emailjsModule = await import('@emailjs/browser');
          emailjs = emailjsModule.default || emailjsModule;
          console.log('EmailJS carregado (versão 4+)');
          
          // Inicializar o EmailJS explicitamente
          if (emailjs.init && typeof emailjs.init === 'function') {
            console.log('Inicializando EmailJS com Public Key:', EMAIL_CONFIG.userId);
            emailjs.init(EMAIL_CONFIG.userId);
          }
        } catch (importError) {
          console.error('Erro ao importar EmailJS:', importError);
          throw new Error('Falha ao carregar biblioteca de email');
        }
        
        console.log('Verificando configurações do EmailJS...');
        // Verificar se as configurações estão definidas corretamente
        if (!EMAIL_CONFIG.serviceId || !EMAIL_CONFIG.templateId || !EMAIL_CONFIG.userId) {
          throw new Error('Configurações do EmailJS incompletas');
        }

        console.log('Enviando email via EmailJS para:', to);
        console.log('Usando service_id:', EMAIL_CONFIG.serviceId);
        console.log('Usando template_id:', EMAIL_CONFIG.templateId);
        
        // Preparar dados para o template - Verificar os parâmetros exatos no template
        // Testando todas as variações possíveis do nome do parâmetro para email
        const templateParams: any = {
          email: to,
          to_email: to,
          toEmail: to,
          recipient: to,
          recipients: to,
          recipientEmail: to,
          to: to,
          subject: subject,
          message: body,
          from_name: 'Paulo Cell Services',
          reply_to: EMAIL_CONFIG.from
        };
        
        // Verificar o anexo e adicioná-lo apenas se estiver no formato correto
        if (attachmentPath && typeof attachmentPath === 'string' && attachmentPath.startsWith('data:')) {
          console.log('Anexando PDF:', attachmentName || 'documento.pdf');
          
          // Tentar comprimir o PDF se for muito grande
          const compressedDataUrl = compressPDFDataUrl(attachmentPath);
          
          // O tamanho máximo recomendado para anexos no EmailJS é de cerca de 5MB
          // Verificar aproximadamente o tamanho do Data URL
          const estimatedSizeKB = Math.round(compressedDataUrl.length * 0.75 / 1024);
          console.log(`Tamanho estimado do anexo: ${estimatedSizeKB}KB`);
          
          if (estimatedSizeKB > 4500) {
            console.warn('Anexo muito grande (>4.5MB), isto pode causar falhas no envio');
          }
          
          // Adicionar o anexo aos parâmetros com todos os nomes possíveis
          templateParams.attachment = compressedDataUrl;
          templateParams.pdf = compressedDataUrl;
          templateParams.file = compressedDataUrl;
          templateParams.documento = compressedDataUrl;
          templateParams.attachment_name = attachmentName || `documento_${new Date().getTime()}.pdf`;
        }
        
        console.log('Enviando com os parâmetros:', {
          ...templateParams,
          attachment: templateParams.attachment ? '[DATA URL PRESENTE]' : 'nenhum'
        });
        
        // Adicionar tratamento de tempo limite
        const timeoutPromise = new Promise<any>((_, reject) => {
          setTimeout(() => reject(new Error('Tempo limite excedido')), 30000); // 30 segundos
        });
        
        // Tentar enviar usando o formato mais compatível com EmailJS
        try {
          console.log('Tentando enviar email via EmailJS...');
          const response = await Promise.race([
            emailjs.send(
              EMAIL_CONFIG.serviceId,
              EMAIL_CONFIG.templateId,
              templateParams,
              EMAIL_CONFIG.userId
            ),
            timeoutPromise
          ]);
          
          console.log('Resposta do EmailJS:', response);
          
          if (response && response.status === 200) {
            console.log('Email enviado com sucesso:', response);
            toast.success(`Documento enviado com sucesso para ${to}`, {
              id: toastId
            });
            resolve(true);
          } else {
            throw new Error(`Falha no envio: código ${response ? response.status : 'desconhecido'}`);
          }
        } catch (sendError) {
          console.error('Erro específico ao enviar via EmailJS:', sendError);
          
          // Se falhar com o método acima, tentar com parâmetros de configuração diferentes
          console.log('Tentando método alternativo de envio...');
          try {
            const altResponse = await Promise.race([
              emailjs.send(
                EMAIL_CONFIG.serviceId,
                EMAIL_CONFIG.templateId,
                templateParams,
                {
                  publicKey: EMAIL_CONFIG.userId,
                }
              ),
              timeoutPromise
            ]);
            
            if (altResponse && altResponse.status === 200) {
              console.log('Email enviado com sucesso usando método alternativo:', altResponse);
              toast.success(`Documento enviado com sucesso para ${to}`, {
                id: toastId
              });
              resolve(true);
              return;
            }
          } catch (altError) {
            console.error('Erro também no método alternativo:', altError);
          }
          
          throw sendError;
        }
      } catch (error) {
        console.error('Erro no envio do email:', error);
        
        // Tratamento de erro mais detalhado
        let errorMessage = 'Falha na comunicação';
        
        if (error.message) {
          // Erros comuns do EmailJS e sugestões
          if (error.message.includes('timeout') || error.message.includes('Tempo limite')) {
            errorMessage = 'O servidor não respondeu. Verifique sua conexão e tente novamente.';
          } else if (error.message.includes('Network Error')) {
            errorMessage = 'Erro de rede. Verifique sua conexão com a internet.';
          } else if (error.message.includes('Invalid ID') || error.message.includes('incorrect') || error.message.includes('invalid')) {
            errorMessage = 'Credenciais do EmailJS inválidas. Contate o administrador.';
          } else if (error.message.includes('quota') || error.message.includes('limit')) {
            errorMessage = 'Limite de envios atingido. Tente novamente mais tarde.';
          } else if (error.message.includes('Configurações')) {
            errorMessage = error.message;
          } else {
            errorMessage = `Falha na comunicação: ${error.message}`;
          }
        }
        
        toast.error(`Não foi possível enviar o email. ${errorMessage}`, {
          id: toastId
        });
        
        resolve(false);
      }
    } catch (error) {
      console.error('Erro geral ao enviar email:', error);
      toast.error('Erro ao enviar documento. Por favor, tente novamente.', {
        id: toastId
      });
      resolve(false);
    }
  });
};

// Adicionar uma função específica para lidar com o envio direto via API REST
const sendEmailViaDirectAPI = async (
  to: string,
  subject: string,
  message: string,
  attachmentPath?: string
): Promise<boolean> => {
  try {
    console.log('Tentando enviar via API REST direta');
    
    // Criar objeto de parâmetros simples para o template
    // Foco apenas nos parâmetros essenciais
    const templateParams = {
      recipients: to,
      subject: subject,
      message: message,
      from_name: 'Paulo Cell Services'
    };
    
    // Criar payload para a API
    const payload = {
      service_id: EMAIL_CONFIG.serviceId,
      template_id: EMAIL_CONFIG.templateId,
      user_id: EMAIL_CONFIG.userId,
      template_params: templateParams
    };
    
    console.log('Enviando requisição para API do EmailJS:', payload);
    
    // Chamar a API diretamente
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      // Verificar a resposta
      if (response.ok) {
        console.log('API do EmailJS respondeu com sucesso:', response.status);
        return true;
      }
      
      // Se chegou aqui, houve erro
      const responseText = await response.text();
      console.error('Erro na API do EmailJS:', response.status, responseText);
      
      // Tentar método alternativo, sem anexo e com menos parâmetros
      return await simplestEmailSend(to, subject, message);
    } catch (fetchError) {
      console.error('Erro de fetch na API do EmailJS:', fetchError);
      // Tentar método alternativo
      return await simplestEmailSend(to, subject, message);
    }
  } catch (error) {
    console.error('Erro ao chamar API do EmailJS:', error);
    return false;
  }
};

// Método ultra simplificado - última esperança para enviar
const simplestEmailSend = async (to: string, subject: string, message: string): Promise<boolean> => {
  try {
    console.log('Tentando método ultra simplificado');
    
    // Criar formulário de dados
    const formData = new FormData();
    formData.append('service_id', EMAIL_CONFIG.serviceId);
    formData.append('template_id', EMAIL_CONFIG.templateId);
    formData.append('user_id', EMAIL_CONFIG.userId);
    
    // Parâmetros mínimos possíveis
    const params = {
      recipients: to,
      subject,
      message: `<p>${message.replace(/\n/g, '<br>')}</p>`
    };
    
    formData.append('template_params', JSON.stringify(params));
    
    // Chamar API com FormData
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send-form', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      console.log('Método ultra simplificado teve sucesso!');
      return true;
    }
    
    console.error('Método ultra simplificado falhou:', response.status);
    return false;
  } catch (error) {
    console.error('Erro no método ultra simplificado:', error);
    return false;
  }
};

// Método alternativo usando FormData para contornar problemas de CORS
export const sendEmailWithFormData = async (
  to: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    console.log('Tentando enviar e-mail com método FormData');
    
    // Credenciais exatas
    const exactCredentials = {
      serviceId: 'service_jlv3vyk',
      templateId: '_ejs-test-mail-service_',
      userId: 'cZZtl9I3FsHrpWogG',
    };
    
    // Criar uma instância de FormData
    const formData = new FormData();
    formData.append('service_id', exactCredentials.serviceId);
    formData.append('template_id', exactCredentials.templateId);
    formData.append('user_id', exactCredentials.userId);
    
    // Parâmetros do template em formato JSON
    const templateParams = {
      from_name: 'Paulo Cell',
      to_name: 'Cliente',
      subject: subject,
      message: message,
      to_email: to,
      recipients: to,
      reply_to: 'paullo.celullar2020@gmail.com'
    };
    
    // Adicionar ao FormData como string JSON
    formData.append('template_params', JSON.stringify(templateParams));
    
    // Mostrar toast de progresso
    const toastId = toast.loading('Enviando e-mail...');
    
    // Enviar requisição para a API do EmailJS usando FormData
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send-form', {
      method: 'POST',
      body: formData
    });
    
    // Verificar resultado
    if (response.ok) {
      console.log('E-mail enviado com sucesso usando FormData');
      toast.success('E-mail enviado com sucesso!', { id: toastId });
    return true;
    } else {
      const responseText = await response.text();
      console.error('Falha ao enviar e-mail com FormData:', response.status, responseText);
      toast.error('Falha ao enviar e-mail. Tente novamente mais tarde.', { id: toastId });
      return false;
    }
  } catch (error) {
    console.error('Erro ao enviar e-mail com FormData:', error);
    toast.error('Erro ao enviar e-mail. Verifique sua conexão.');
    return false;
  }
};

/**
 * Envia um documento por email
 */
export const sendDocumentByEmail = async (
  document: DocumentWithItems,
  emailTo: string
): Promise<boolean> => {
  try {
    console.log('Iniciando processo de envio do documento por e-mail:', {
      documento: document.id,
      tipo: document.type,
      email: emailTo
    });

    // Verificar se o e-mail de destino é válido
    if (!emailTo || !emailTo.includes('@')) {
      toast.error('E-mail de destino inválido');
      console.error('Email inválido:', emailTo);
      return false;
    }
    
    // Formatar as informações do documento para o e-mail
    const date = new Date(document.date).toLocaleDateString('pt-BR');
    const value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(document.value);
    
    const subject = `Documento Fiscal ${document.number} - Paulo Cell`;
    const message = `
      <h2>Documento Fiscal ${document.number}</h2>
      <p><strong>Data:</strong> ${date}</p>
      <p><strong>Valor:</strong> ${value}</p>
      <p><strong>Tipo:</strong> ${document.type.toUpperCase()}</p>
      ${document.keyAccess ? `<p><strong>Chave de Acesso:</strong> ${document.keyAccess}</p>` : ''}
      
      <p>Documento emitido por Paulo Cell.</p>
    `;

    // Tentar todos os métodos de envio em sequência até que um funcione
    
    // 1. Primeiro método: usando FormData (mais confiável para CORS)
    console.log('Tentando enviar com método FormData...');
    const formDataSuccess = await sendEmailWithFormData(emailTo, subject, message);
    
    if (formDataSuccess) {
      console.log('Envio bem-sucedido usando FormData');
      
      // Salvar o email do cliente no localStorage
      if (document.customerId) {
        const customerEmailsKey = `pauloCell_customerEmails`;
        const storedEmails = localStorage.getItem(customerEmailsKey);
        const customerEmails = storedEmails ? JSON.parse(storedEmails) : {};
        customerEmails[document.customerId] = emailTo;
        localStorage.setItem(customerEmailsKey, JSON.stringify(customerEmails));
      }
      
      return true;
    }
    
    console.log('Método FormData falhou, tentando método com credenciais exatas...');
    
    // 2. Segundo método: usando credenciais exatas
    const exactSuccess = await sendEmailWithExactCredentials(emailTo, subject, message);
    
    if (exactSuccess) {
      console.log('Envio bem-sucedido usando credenciais exatas');
      
      // Salvar o email do cliente no localStorage
      if (document.customerId) {
        const customerEmailsKey = `pauloCell_customerEmails`;
        const storedEmails = localStorage.getItem(customerEmailsKey);
        const customerEmails = storedEmails ? JSON.parse(storedEmails) : {};
        customerEmails[document.customerId] = emailTo;
        localStorage.setItem(customerEmailsKey, JSON.stringify(customerEmails));
      }
      
      return true;
    }
    
    console.log('Método com credenciais exatas falhou, tentando API direta...');
    
    // 3. Terceiro método: API direta
    const apiSuccess = await sendEmailViaDirectAPI(emailTo, subject, message);
    
    if (apiSuccess) {
      console.log('Envio bem-sucedido usando API direta');
      toast.success('E-mail enviado com sucesso! (método alternativo)');
      
      // Salvar o email do cliente no localStorage
      if (document.customerId) {
        const customerEmailsKey = `pauloCell_customerEmails`;
        const storedEmails = localStorage.getItem(customerEmailsKey);
        const customerEmails = storedEmails ? JSON.parse(storedEmails) : {};
        customerEmails[document.customerId] = emailTo;
        localStorage.setItem(customerEmailsKey, JSON.stringify(customerEmails));
      }
      
      return true;
    }
    
    // Se chegou aqui, todos os métodos falharam
    console.error('Todos os métodos de envio falharam');
    toast.error('Não foi possível enviar o e-mail. Verifique sua conexão e tente novamente mais tarde.');
    return false;
  } catch (error) {
    console.error('Erro geral ao enviar e-mail:', error);
    toast.error('Erro ao enviar e-mail. Verifique sua conexão com a internet.');
    return false;
  }
};

// Função específica para enviar email utilizando as credenciais exatas da conta
export const sendEmailWithExactCredentials = async (
  to: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    // Verificar conexão com a internet
    if (!navigator.onLine) {
      toast.error('Sem conexão com a internet. Verifique sua rede.');
      return false;
    }

    console.log('Enviando email com credenciais exatas');
    
    // Credenciais exatas conforme mostrado na imagem
    const exactCredentials = {
      serviceId: 'service_jlv3vyk',
      templateId: '_ejs-test-mail-service_',
      userId: 'cZZtl9I3FsHrpWogG',
      from: 'paullo.celullar2020@gmail.com'
    };
    
    // Parâmetros exatos para o template
    // Usando todos os nomes possíveis que o template pode esperar
    const templateParams = {
      // Parâmetros padrão
      to_email: to,
      recipients: to,
      subject: subject,
      message: message,
      
      // Parâmetros adicionais que podem ser necessários
      from_name: 'Paulo Cell',
      to_name: 'Cliente',
      reply_to: exactCredentials.from,
      
      // Formato alternativo de parâmetros
      user_to: to,
      content: message,
      mail_subject: subject,
      mail_to: to,
      email_to: to
    };
    
    // Mostrar detalhes para depuração
    console.log('Credenciais exatas:', exactCredentials);
    console.log('Parâmetros do template:', templateParams);
    
    // Construir URL da API do EmailJS
    const url = 'https://api.emailjs.com/api/v1.0/email/send';
    
    // Construir payload
    const payload = {
      service_id: exactCredentials.serviceId,
      template_id: exactCredentials.templateId,
      user_id: exactCredentials.userId,
      template_params: templateParams
    };
    
    // Verificar tamanho do payload
    const payloadSize = JSON.stringify(payload).length;
    console.log(`Tamanho do payload: ${Math.round(payloadSize / 1024)}KB`);
    
    // Mostrar toast de progresso
    toast.loading('Enviando e-mail...');
    
    // Enviar requisição para a API do EmailJS
    console.log('Enviando requisição para:', url);
    
    // Adicionar timeout para não ficar esperando indefinidamente
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    
    // Verificar resultado
    if (response.status === 200) {
      console.log('Email enviado com sucesso usando credenciais exatas');
      toast.success('E-mail enviado com sucesso!');
      return true;
    } else {
      const responseData = await response.text();
      console.error('Falha ao enviar email:', response.status, responseData);
      
      // Mensagem mais específica baseada no código de erro
      let errorMsg = 'Falha ao enviar e-mail. Tente novamente mais tarde.';
      
      if (response.status === 400) {
        errorMsg = 'Erro nos parâmetros do e-mail. Verifique e tente novamente.';
      } else if (response.status === 401 || response.status === 403) {
        errorMsg = 'Erro de autenticação com o serviço de e-mail.';
      } else if (response.status === 429) {
        errorMsg = 'Limite de envios excedido. Tente novamente mais tarde.';
      } else if (response.status >= 500) {
        errorMsg = 'Erro no servidor de e-mail. Tente novamente mais tarde.';
      }
      
      toast.error(errorMsg);
      return false;
    }
  } catch (error) {
    console.error('Erro ao enviar email com credenciais exatas:', error);
    
    // Mensagem mais específica baseada no tipo de erro
    let errorMsg = 'Falha ao enviar e-mail. Tente novamente mais tarde.';
    
    if (error.name === 'AbortError') {
      errorMsg = 'Tempo limite excedido. Verifique sua conexão.';
    } else if (error.message && error.message.includes('NetworkError')) {
      errorMsg = 'Erro de rede. Verifique sua conexão com a internet.';
    }
    
    toast.error(errorMsg);
    return false;
  }
};