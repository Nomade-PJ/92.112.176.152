import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVerticalIcon, FileTextIcon, PrinterIcon, DownloadIcon, MailIcon } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { exportDocumentToPDF } from '@/lib/export-utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface DocumentCardProps {
  document: {
    id: string;
    type: 'nfe' | 'nfce' | 'nfse';
    number: string;
    customer: string;
    customerId?: string;
    date: string;
    value: number;
    status: 'Emitida' | 'Cancelada' | 'Pendente';
    items?: Array<{
      description: string;
      quantity: number;
      unitValue: number;
    }>;
    paymentMethod?: string;
    observations?: string;
  };
  index: number;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, index }) => {
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'number', 'type', 'customer', 'date', 'value', 'status', 'paymentMethod'
  ]);
  
  // Function to handle sending document by email
  const handleSendEmail = () => {
    // Get customer email from localStorage using customerId
    let customerEmail = '';
    
    if (document.customerId) {
      try {
        const savedCustomers = localStorage.getItem('pauloCell_customers');
        if (savedCustomers) {
          const customers = JSON.parse(savedCustomers);
          const customer = customers.find((c: any) => c.id === document.customerId);
          if (customer && customer.email) {
            customerEmail = customer.email;
            // Se temos o email, enviar diretamente
            sendEmailDirectly(customerEmail);
            return;
          } else if (customer && customer.name) {
            toast.info(`Cliente ${customer.name} encontrado, mas sem email cadastrado.`);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar email do cliente:", error);
      }
    }
    
    // Se não encontrou email do cliente, tenta buscar de emissões anteriores
    if (!customerEmail) {
      try {
        const savedDocuments = localStorage.getItem('pauloCell_documents');
        if (savedDocuments) {
          const allDocs = JSON.parse(savedDocuments);
          // Buscar documentos do mesmo cliente (por nome, já que pode não ter ID)
          const customerDocs = allDocs.filter((d: any) => 
            d.customer === document.customer && d.id !== document.id
          );
          
          // Ordena do mais recente para o mais antigo
          customerDocs.sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          // Procura um email usado anteriormente
          for (const prevDoc of customerDocs) {
            if (prevDoc.emailSentTo) {
              customerEmail = prevDoc.emailSentTo;
              // Se encontrou um email anterior, perguntar se deve usar
              toast.message(
                `Email encontrado em documento anterior: ${customerEmail}`,
                {
                  action: {
                    label: "Usar este email",
                    onClick: () => sendEmailDirectly(customerEmail)
                  },
                  duration: 5000
                }
              );
              break;
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar email em documentos anteriores:", error);
      }
    }
    
    // Se ainda não enviou o email, mostrar o diálogo
    if (!customerEmail) {
      setEmailAddress('');
      setShowEmailDialog(true);
    }
  };
  
  // Função para enviar email diretamente sem mostrar diálogo
  const sendEmailDirectly = async (email: string) => {
    if (!email || !email.trim()) {
      toast.error('Email inválido');
      return;
    }
    
    try {
      setIsEmailSending(true);
      
      // Remover qualquer toast existente
      toast.dismiss();
      
      // Import the email utility
      const { sendDocumentByEmail } = await import('@/lib/email-utils');
      
      // Send the email
      const success = await sendDocumentByEmail(document as any, email);
      
      if (success) {
        // Salvar o email usado para futuros envios
        try {
          const savedDocuments = localStorage.getItem('pauloCell_documents');
          if (savedDocuments) {
            const allDocs = JSON.parse(savedDocuments);
            const updatedDocs = allDocs.map((d: any) => {
              if (d.id === document.id) {
                // Adicionar campo emailSentTo para rastrear o email usado
                return { ...d, emailSentTo: email };
              }
              return d;
            });
            localStorage.setItem('pauloCell_documents', JSON.stringify(updatedDocs));
          }
        } catch (error) {
          console.error("Erro ao salvar email usado:", error);
        }
        
        toast.success('Documento enviado por email com sucesso');
      }
    } catch (error) {
      console.error('Error sending document by email:', error);
      toast.error('Erro ao enviar documento por email');
    } finally {
      setIsEmailSending(false);
    }
  };
  
  // Function to actually send the email
  const handleSendEmailConfirm = async () => {
    if (!emailAddress || !emailAddress.trim()) {
      toast.error('Por favor, insira um email válido');
      return;
    }
    
    try {
      setIsEmailSending(true);
      setShowEmailDialog(false);
      
      // Import the email utility
      const { sendDocumentByEmail } = await import('@/lib/email-utils');
      
      // Send the email
      const success = await sendDocumentByEmail(document as any, emailAddress);
      
      if (success) {
        // Salvar o email usado para futuros envios
        try {
          const savedDocuments = localStorage.getItem('pauloCell_documents');
          if (savedDocuments) {
            const allDocs = JSON.parse(savedDocuments);
            const updatedDocs = allDocs.map((d: any) => {
              if (d.id === document.id) {
                // Adicionar campo emailSentTo para rastrear o email usado
                return { ...d, emailSentTo: emailAddress };
              }
              return d;
            });
            localStorage.setItem('pauloCell_documents', JSON.stringify(updatedDocs));
          }
        } catch (error) {
          console.error("Erro ao salvar email usado:", error);
        }
        
        toast.success('Documento enviado por email com sucesso');
      }
    } catch (error) {
      console.error('Error sending document by email:', error);
      toast.error('Erro ao enviar documento por email');
    } finally {
      setIsEmailSending(false);
    }
  };

  const getStatusColor = () => {
    switch(document.status) {
      case 'Emitida':
        return 'bg-green-100 text-green-700';
      case 'Cancelada':
        return 'bg-red-100 text-red-700';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getDocumentTypeText = () => {
    switch(document.type) {
      case 'nfe':
        return 'NF-e';
      case 'nfce':
        return 'NFC-e';
      case 'nfse':
        return 'NFS-e';
      default:
        return 'Documento';
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handlePrint = () => {
    setShowPrintDialog(true);
  };

  const handlePrintConfirm = () => {
    if (!document) return;

    try {
      // Fechar o diálogo imediatamente para evitar travamento
      setShowPrintDialog(false);
      
      // Import on demand to avoid circular references
      const { generateDocumentPrintContent } = require('@/lib/export-utils');
      const content = generateDocumentPrintContent(document, selectedColumns);
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
        
        // Adicionar evento para detectar quando a janela é fechada
        const checkWindowClosed = setInterval(() => {
          if (printWindow.closed) {
            clearInterval(checkWindowClosed);
          }
        }, 500);
        
        // Configurar callback para impressão
        printWindow.onafterprint = () => {
          printWindow.close();
          clearInterval(checkWindowClosed);
        };
        
        // Iniciar impressão após um breve delay
        setTimeout(() => {
          printWindow.print();
          toast.success('Documento enviado para impressão');
        }, 250);
      } else {
        toast.error('Não foi possível abrir a janela de impressão');
      }
    } catch (error) {
      console.error('Error printing document:', error);
      toast.error('Erro ao imprimir documento');
    }
  };

  const handleDownload = () => {
    try {
      const success = exportDocumentToPDF(document, [
        'number', 'type', 'customer', 'date', 'value', 'status', 
        'paymentMethod', 'items', 'observations'
      ]);
      if (success) {
        toast.success('Documento exportado com sucesso');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento');
    }
  };
  
  return (
    <>
      <AlertDialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar Documento por E-mail</AlertDialogTitle>
            <AlertDialogDescription>
              Digite o endereço de e-mail para enviar o documento {document.type.toUpperCase()}-{document.number}.
              <div className="mt-2 text-green-600 text-sm">
                O documento será enviado automaticamente para o e-mail informado com PDF anexado.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input 
              type="email" 
              placeholder="Email do cliente" 
              value={emailAddress} 
              onChange={(e) => setEmailAddress(e.target.value)}
              className="w-full"
              disabled={isEmailSending}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEmailSending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSendEmailConfirm} 
              disabled={isEmailSending || !emailAddress.trim()}
            >
              {isEmailSending ? 'Enviando...' : 'Enviar Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opções de Impressão</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione as informações que deseja incluir na impressão:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes('number')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, 'number']);
                  } else {
                    setSelectedColumns(selectedColumns.filter(col => col !== 'number'));
                  }
                }}
                className="form-checkbox h-4 w-4"
              />
              <span>Número</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes('type')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, 'type']);
                  } else {
                    setSelectedColumns(selectedColumns.filter(col => col !== 'type'));
                  }
                }}
                className="form-checkbox h-4 w-4"
              />
              <span>Tipo</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes('customer')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, 'customer']);
                  } else {
                    setSelectedColumns(selectedColumns.filter(col => col !== 'customer'));
                  }
                }}
                className="form-checkbox h-4 w-4"
              />
              <span>Cliente</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes('date')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, 'date']);
                  } else {
                    setSelectedColumns(selectedColumns.filter(col => col !== 'date'));
                  }
                }}
                className="form-checkbox h-4 w-4"
              />
              <span>Data</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes('value')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, 'value']);
                  } else {
                    setSelectedColumns(selectedColumns.filter(col => col !== 'value'));
                  }
                }}
                className="form-checkbox h-4 w-4"
              />
              <span>Valor</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes('status')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, 'status']);
                  } else {
                    setSelectedColumns(selectedColumns.filter(col => col !== 'status'));
                  }
                }}
                className="form-checkbox h-4 w-4"
              />
              <span>Status</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes('paymentMethod')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, 'paymentMethod']);
                  } else {
                    setSelectedColumns(selectedColumns.filter(col => col !== 'paymentMethod'));
                  }
                }}
                className="form-checkbox h-4 w-4"
              />
              <span>Forma de Pagamento</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes('items')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, 'items']);
                  } else {
                    setSelectedColumns(selectedColumns.filter(col => col !== 'items'));
                  }
                }}
                className="form-checkbox h-4 w-4"
              />
              <span>Itens</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes('observations')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, 'observations']);
                  } else {
                    setSelectedColumns(selectedColumns.filter(col => col !== 'observations'));
                  }
                }}
                className="form-checkbox h-4 w-4"
              />
              <span>Observações</span>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePrintConfirm}>Imprimir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <motion.div 
        className="bg-card rounded-xl border border-border p-4 card-hover"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileTextIcon size={20} />
            </div>
            
            <div>
              <div className="flex items-center">
                <h3 className="font-medium">{getDocumentTypeText()} {document.number}</h3>
                <div className={`text-xs px-2 py-0.5 rounded-full ml-2 ${getStatusColor()}`}>
                  {document.status}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mt-0.5">
                Cliente: <span className="font-medium">{document.customer}</span>
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted transition-colors">
                <MoreVerticalIcon size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePrint}>
                <PrinterIcon className="mr-2 h-4 w-4" />
                <span>Imprimir</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSendEmail}>
                <MailIcon className="mr-2 h-4 w-4" />
                <span>Enviar por E-mail</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="border-t border-border mt-3 pt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Data de emissão:</span>
            <p className="font-medium">{formatDate(document.date)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Valor:</span>
            <p className="font-medium">{formatCurrency(document.value)}</p>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default DocumentCard;
