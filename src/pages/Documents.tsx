import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  FileTextIcon,
  PlusIcon,
  PrinterIcon,
  DownloadIcon,
  SearchIcon,
  FilterIcon,
  FileIcon,
  FileCheckIcon,
  FilePlusIcon,
  SettingsIcon,
  AlertCircleIcon,
  MailIcon,
  PencilIcon,
  MoreVerticalIcon
} from 'lucide-react';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { exportToPDF, exportToExcel, exportToCSV } from '../lib/export-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
// Note: document-pdf-utils and email-utils are imported dynamically when needed

interface Document {
  id: string;
  type: 'nfe' | 'nfce' | 'nfse';
  number: string;
  customer: string;
  customerId?: string;
  date: string;
  value: number;
  status: 'Emitida' | 'Cancelada' | 'Pendente';
  items: Array<{
    description: string;
    quantity: number;
    unitValue: number;
  }>;
  paymentMethod: string;
  observations?: string;
  invoiceId?: string;
  invoiceUrl?: string;
}

const debugEmailJS = async () => {
  try {
    const emailjsModule = await import('@emailjs/browser');
    const emailjs = emailjsModule.default || emailjsModule;
    
    console.log('======= DIAGNÓSTICO DO EMAILJS =======');
    console.log('EmailJS carregado:', !!emailjs);
    console.log('EmailJS métodos disponíveis:', Object.keys(emailjs));
    console.log('Ambiente da aplicação:', import.meta.env.MODE || 'Não disponível');
    console.log('=====================================');
    
    return true;
  } catch (error) {
    console.error('Erro ao depurar EmailJS:', error);
    return false;
  }
};

const Documents: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isApiConfigured, setIsApiConfigured] = useState(true);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [documentToPrint, setDocumentToPrint] = useState<Document | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [documentToEmail, setDocumentToEmail] = useState<Document | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<'7days' | '1month' | '12months'>('7days');
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  const [showExport, setShowExport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Ref para o toast de carregamento do PDF
  const loadingToastRef = useRef<string | number | null>(null);

  useEffect(() => {
    loadDocuments();
    checkApiConfiguration();
  }, []);

  const checkApiConfiguration = () => {
    const apiConfig = localStorage.getItem('pauloCell_invoiceApiConfig');
    if (!apiConfig) {
      setIsApiConfigured(false);
      return;
    }
    
    const config = JSON.parse(apiConfig);
    if (!config.apiKey || config.apiKey.trim() === '') {
      setIsApiConfigured(false);
      return;
    }
    
    setIsApiConfigured(true);
  };

  const loadDocuments = () => {
    setIsLoading(true);
    // A small delay to show the loading state
    setTimeout(() => {
      try {
        // Get documents from localStorage
        const savedDocs = localStorage.getItem("pauloCell_documents") || "[]";
        const allDocs = JSON.parse(savedDocs);
        
        // Filter based on current period
        const filteredDocs = filterByPeriod(allDocs, exportPeriod);
        
        setDocuments(filteredDocs);
      } catch (error) {
        console.error("Error loading documents:", error);
        toast.error("Erro ao carregar documentos");
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleNewDocument = () => {
    navigate('/documents/new');
  };

  const handleExport = (format: string) => {
    try {
      // Obter documentos filtrados
      const filteredDocs = filterDocuments();
      
      if (filteredDocs.length === 0) {
        toast.error('Nenhum documento encontrado para exportação');
        return;
      }
      
      // Para todos os formatos, mostrar o diálogo de seleção de período
      setExportDialogOpen(true);
      
      // Salvar o formato selecionado para usar posteriormente
      setExportFormat(format);
    } catch (error) {
      console.error('Erro ao iniciar exportação:', error);
      toast.error('Erro ao iniciar exportação');
    }
  };

  const filterDocuments = () => {
    return documents.filter(doc => {
      const matchesSearch = doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.customer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || doc.type === filterType;
      const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  };

  const [selectedColumns, setSelectedColumns] = useState<string[]>(['number', 'type', 'customer', 'date', 'value', 'status', 'paymentMethod']);

  const handlePrint = (doc: Document) => {
    setDocumentToPrint(doc);
    setPrintDialogOpen(true);
  };

  const handlePrintConfirm = () => {
    if (!documentToPrint) return;

    try {
      // Fechar o diálogo imediatamente para evitar travamento
      setPrintDialogOpen(false);
      
      // Import the enhanced print content generation function
      import('../lib/document-pdf-utils').then(({ generateEnhancedPrintContent }) => {
        // Generate enhanced print content with professional layout
        const content = generateEnhancedPrintContent(documentToPrint);
        
        // Criar a janela de impressão
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(content);
          printWindow.document.close();
          
          // Adicionar evento para detectar quando a janela é fechada
          const checkWindowClosed = setInterval(() => {
            if (printWindow.closed) {
              clearInterval(checkWindowClosed);
              setDocumentToPrint(null);
            }
          }, 500);
          
          // Configurar callback para impressão
          printWindow.onafterprint = () => {
            printWindow.close();
            setDocumentToPrint(null);
            clearInterval(checkWindowClosed);
          };
          
          // Iniciar impressão após um breve delay
          setTimeout(() => {
            printWindow.print();
          }, 250);
        } else {
          toast.error('Não foi possível abrir a janela de impressão');
          setDocumentToPrint(null);
        }
      });
    } catch (error) {
      console.error('Erro ao imprimir documento:', error);
      toast.error('Erro ao preparar impressão');
      setPrintDialogOpen(false);
      setDocumentToPrint(null);
    }
  };

  const handleDownload = (doc: Document) => {
    try {
      // If we have an invoice URL from the API, open it in a new tab
      if (doc.invoiceUrl) {
        window.open(doc.invoiceUrl, '_blank');
        toast.success('Abrindo documento fiscal no site do provedor');
        return;
      }
      
      // Import the enhanced PDF generation function
      import('../lib/document-pdf-utils').then(({ generateEnhancedDocumentPDF }) => {
        // Generate enhanced PDF with professional layout
        generateEnhancedDocumentPDF(doc);
        toast.success('Documento exportado com sucesso como PDF');
      }).catch(error => {
        console.error('Error importing PDF utils:', error);
        toast.error('Erro ao gerar PDF');
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento');
    }
  };
  
  const handleSendEmail = async (doc: Document) => {
    // Executar diagnóstico antes de enviar
    await debugEmailJS();
    
    // Get customer email from localStorage using customerId
    let customerEmail = '';
    
    if (doc.customerId) {
      try {
        const savedCustomers = localStorage.getItem('pauloCell_customers');
        if (savedCustomers) {
          const customers = JSON.parse(savedCustomers);
          const customer = customers.find((c: any) => c.id === doc.customerId);
          if (customer && customer.email) {
            customerEmail = customer.email;
            // Se temos o email, enviar diretamente
            await sendEmailDirectly(doc, customerEmail);
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
          const customerDocs = allDocs.filter((d: Document) => 
            d.customer === doc.customer && d.id !== doc.id
          );
          
          // Ordena do mais recente para o mais antigo
          customerDocs.sort((a: Document, b: Document) => 
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
                    onClick: () => sendEmailDirectly(doc, customerEmail)
                  },
                  duration: 5000
                }
              );
              return;
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar email em documentos anteriores:", error);
      }
    }
    
    // Se não temos um email para usar, abrir diálogo para o usuário inserir
    setDocumentToEmail(doc);
    setEmailTo('');
    setEmailDialogOpen(true);
  };
  
  // Função para enviar email diretamente sem mostrar diálogo
  const sendEmailDirectly = async (doc: Document, email: string) => {
    if (!email || !email.trim()) {
      toast.error('Email inválido');
      return;
    }
    
    try {
      setIsSendingEmail(true);
      
      // Import the email utility
      const { sendDocumentByEmail } = await import('../lib/email-utils');
      
      // Send the email
      const success = await sendDocumentByEmail(doc as any, email);
      
      if (success) {
        // Salvar o email usado para futuros envios
        try {
          const savedDocuments = localStorage.getItem('pauloCell_documents');
          if (savedDocuments) {
            const allDocs = JSON.parse(savedDocuments);
            const updatedDocs = allDocs.map((d: Document) => {
              if (d.id === doc.id) {
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
      }
    } catch (error) {
      console.error('Error sending document by email:', error);
      toast.error('Erro ao enviar documento por email');
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  const handleSendEmailConfirm = async () => {
    if (!documentToEmail || !emailTo || !emailTo.trim()) {
      toast.error('Por favor, insira um email válido');
      return;
    }
    
    try {
      setIsSendingEmail(true);
      setEmailDialogOpen(false);
      
      // Import the email utility
      const { sendDocumentByEmail } = await import('../lib/email-utils');
      
      // Send the email
      const success = await sendDocumentByEmail(documentToEmail as any, emailTo);
      
      if (success) {
        // Salvar o email usado para futuros envios
        try {
          const savedDocuments = localStorage.getItem('pauloCell_documents');
          if (savedDocuments) {
            const allDocs = JSON.parse(savedDocuments);
            const updatedDocs = allDocs.map((d: Document) => {
              if (d.id === documentToEmail.id) {
                // Adicionar campo emailSentTo para rastrear o email usado
                return { ...d, emailSentTo: emailTo };
              }
              return d;
            });
            localStorage.setItem('pauloCell_documents', JSON.stringify(updatedDocs));
          }
        } catch (error) {
          console.error("Erro ao salvar email usado:", error);
        }
        
        setDocumentToEmail(null);
      }
    } catch (error) {
      console.error('Error sending document by email:', error);
      toast.error('Erro ao enviar documento por email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleStatusChange = (documentId: string, newStatus: 'Emitida' | 'Cancelada' | 'Pendente') => {
    try {
      // Get current documents
      const savedDocuments = localStorage.getItem('pauloCell_documents');
      if (!savedDocuments) return;
      
      const documents = JSON.parse(savedDocuments);
      
      // Update document status
      const updatedDocuments = documents.map((doc: any) => {
        if (doc.id === documentId) {
          return { ...doc, status: newStatus };
        }
        return doc;
      });
      
      // Save updated documents
      localStorage.setItem('pauloCell_documents', JSON.stringify(updatedDocuments));
      
      // Update local state
      setDocuments(updatedDocuments);
      toast.success(`Status alterado para ${newStatus}`);
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Erro ao atualizar status do documento');
    }
  };

  const handleChangeStatus = (documentId: string, newStatus: 'Emitida' | 'Cancelada' | 'Pendente') => {
    handleStatusChange(documentId, newStatus);
  };

  // Função para filtrar documentos por período
  const filterByPeriod = (docs: Document[], period: '7days' | '1month' | '12months') => {
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    // Definir a data de início baseada no período selecionado
    let startDate: Date;
    switch (period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * msPerDay);
        break;
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '12months':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 7 * msPerDay);
    }
    
    // Filtrar documentos pela data
    return docs.filter(doc => {
      const docDate = new Date(doc.date);
      return docDate >= startDate && docDate <= now;
    });
  };

  // Função para exportar documentos por período
  const exportDocumentsByPeriod = async () => {
    // Fechar o diálogo de exportação
    setExportDialogOpen(false);
    
    // Remover qualquer toast que possa estar ativo
    toast.dismiss();
    
    // Filtrar documentos pelo período
    const filteredDocs = filterByPeriod(documents, exportPeriod);
    
    if (filteredDocs.length === 0) {
      toast.error('Nenhum documento encontrado no período selecionado');
      return;
    }
    
    try {
      // Importar o módulo necessário para geração de PDF
      const { generateMultipleDocumentsPDF } = await import('../lib/document-pdf-utils');
      
      // Gerar o PDF com todos os documentos
      const success = await generateMultipleDocumentsPDF(filteredDocs);
      
      // Remover qualquer toast pendente
      toast.dismiss();
      
      if (success) {
        toast.success(`${filteredDocs.length} documentos exportados com sucesso para PDF`);
      } else {
        toast.error('Erro ao gerar PDF dos documentos');
      }
    } catch (error) {
      // Remover qualquer toast pendente
      toast.dismiss();
      console.error('Erro ao exportar documentos por período:', error);
      toast.error('Erro na exportação do PDF');
    }
  };

  // Função para exportar documentos em Excel filtrados por período
  const exportExcelByPeriod = () => {
    // Fechar o diálogo de exportação
    setExportDialogOpen(false);
    
    // Remover qualquer toast que possa estar ativo
    toast.dismiss();
    
    // Filtrar documentos pelo período selecionado
    const filteredDocs = filterByPeriod(documents, exportPeriod);
    
    if (filteredDocs.length === 0) {
      toast.error('Nenhum documento encontrado no período selecionado');
      return;
    }
    
    try {
      // Exportar para Excel sem mostrar toast de processamento
      const success = exportToExcel(filteredDocs, 'Documentos_Fiscais');
      
      // Remover qualquer toast pendente
      toast.dismiss();
      
      if (success) {
        toast.success(`${filteredDocs.length} documentos exportados com sucesso em formato Excel`);
      } else {
        toast.error('Falha ao exportar documentos para Excel');
      }
    } catch (error) {
      // Remover qualquer toast pendente
      toast.dismiss();
      console.error('Erro ao exportar para Excel:', error);
      toast.error('Falha na exportação para Excel');
    }
  };
  
  // Função para exportar documentos em CSV filtrados por período
  const exportCSVByPeriod = () => {
    // Fechar o diálogo de exportação
    setExportDialogOpen(false);
    
    // Remover qualquer toast que possa estar ativo
    toast.dismiss();
    
    // Filtrar documentos pelo período selecionado
    const filteredDocs = filterByPeriod(documents, exportPeriod);
    
    if (filteredDocs.length === 0) {
      toast.error('Nenhum documento encontrado no período selecionado');
      return;
    }
    
    try {
      // Exportar para CSV sem mostrar toast de processamento
      const success = exportToCSV(filteredDocs, 'Documentos_Fiscais');
      
      // Remover qualquer toast pendente
      toast.dismiss();
      
      if (success) {
        toast.success(`${filteredDocs.length} documentos exportados com sucesso em formato CSV`);
      } else {
        toast.error('Falha ao exportar documentos para CSV');
      }
    } catch (error) {
      // Remover qualquer toast pendente
      toast.dismiss();
      console.error('Erro ao exportar para CSV:', error);
      toast.error('Falha na exportação para CSV');
    }
  };

  // Função que executa a exportação baseada no formato selecionado
  const handleExportByPeriod = () => {
    switch (exportFormat) {
      case 'pdf':
        exportDocumentsByPeriod();
        break;
      case 'excel':
        exportExcelByPeriod();
        break;
      case 'csv':
        exportCSVByPeriod();
        break;
      default:
        toast.error('Formato de exportação inválido');
        setExportDialogOpen(false);
    }
  };

  return (
    <MainLayout>
      {/* Email Dialog */}
      <AlertDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar Documento por E-mail</AlertDialogTitle>
            <AlertDialogDescription>
              Digite o endereço de e-mail para enviar o documento {documentToEmail?.type.toUpperCase()}-{documentToEmail?.number}.
              <div className="mt-2 text-green-600 text-sm">
                O documento será enviado automaticamente para o e-mail informado com PDF anexado.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input 
              type="email" 
              placeholder="Email do cliente" 
              value={emailTo} 
              onChange={(e) => setEmailTo(e.target.value)}
              className="w-full"
              disabled={isSendingEmail}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingEmail}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSendEmailConfirm} 
              disabled={isSendingEmail || !emailTo.trim()}
            >
              {isSendingEmail ? 'Enviando...' : 'Enviar Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
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
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePrintConfirm}>Imprimir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Documentos Fiscais</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/documents/new', { state: { documentType: 'nfe' } })} variant="outline" className="gap-2">
              Emitir NF-e
            </Button>
            <Button onClick={() => navigate('/documents/new', { state: { documentType: 'nfce' } })} variant="outline" className="gap-2">
              Emitir NFC-e
            </Button>
            <Button onClick={() => navigate('/documents/new', { state: { documentType: 'nfse' } })} variant="outline" className="gap-2">
              Emitir NFS-e
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <DownloadIcon size={16} />
                  <span>Exportar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    <span>Exportar como PDF</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <FileIcon className="mr-2 h-4 w-4" />
                    <span>Exportar como Excel</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileIcon className="mr-2 h-4 w-4" />
                    <span>Exportar como CSV</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              onClick={() => navigate('/settings', { state: { openTab: 'fiscalApi' } })}
              className="gap-2"
            >
              <SettingsIcon size={16} />
              <span>Config. API</span>
            </Button>
          </div>
        </div>

        {!isApiConfigured && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Configuração necessária</AlertTitle>
            <AlertDescription>
              A API de notas fiscais não está configurada. Configure a API nas configurações para emitir documentos fiscais.
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/settings', { state: { openTab: 'fiscalApi' } })}
                >
                  Ir para configurações
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <SearchIcon className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="nfe">NF-e</SelectItem>
                  <SelectItem value="nfce">NFC-e</SelectItem>
                  <SelectItem value="nfse">NFS-e</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Emitida">Emitida</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterDocuments().map((doc) => (
                  <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell onClick={() => navigate(`/documents/${doc.id}`)}>
                      {doc.number}
                    </TableCell>
                    <TableCell onClick={() => navigate(`/documents/${doc.id}`)}>
                      {doc.type.toUpperCase()}
                    </TableCell>
                    <TableCell onClick={() => navigate(`/documents/${doc.id}`)}>
                      {doc.customer}
                    </TableCell>
                    <TableCell onClick={() => navigate(`/documents/${doc.id}`)}>
                      {new Date(doc.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell onClick={() => navigate(`/documents/${doc.id}`)}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(doc.value)}
                    </TableCell>
                    <TableCell>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select 
                          defaultValue={doc.status} 
                          onValueChange={(value: 'Emitida' | 'Cancelada' | 'Pendente') => handleStatusChange(doc.id, value)}
                        >
                          <SelectTrigger className={`w-[110px] h-7 px-2 py-0 text-xs font-medium ${doc.status === 'Emitida' ? 'bg-green-100 text-green-800' : doc.status === 'Cancelada' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            <SelectValue>{doc.status}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Emitida">Emitida</SelectItem>
                            <SelectItem value="Cancelada">Cancelada</SelectItem>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="w-24">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          title="Ver detalhes"
                        >
                          <FileTextIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={doc.status === 'Cancelada'}
                          onClick={() => navigate(`/documents/${doc.id}`, { state: { openEditMode: true } })}
                          title="Editar documento"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVerticalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => navigate(`/documents/${doc.id}`)}>
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                <span>Detalhes</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePrint(doc)}
                                disabled={isPrintLoading}
                              >
                                <PrinterIcon className="mr-2 h-4 w-4" />
                                <span>Imprimir</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleChangeStatus(doc.id, doc.status === 'Emitida' ? 'Cancelada' : 'Emitida')}
                                disabled={doc.status === 'Cancelada'}
                              >
                                <FileCheckIcon className="mr-2 h-4 w-4" />
                                <span>{doc.status === 'Emitida' ? 'Cancelar' : 'Marcar como Emitida'}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleSendEmail(doc)}
                                disabled={isSendingEmail}
                              >
                                <MailIcon className="mr-2 h-4 w-4" />
                                <span>Enviar por E-mail</span>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filterDocuments().length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileTextIcon className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground">Nenhum documento encontrado</p>
                        <Button onClick={handleNewDocument} variant="outline">
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Novo Documento
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Diálogo de exportação por período */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Documentos para {exportFormat.toUpperCase()}</DialogTitle>
            <DialogDescription>
              Selecione o período para exportação dos documentos:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="exportPeriod"
                  checked={exportPeriod === '7days'}
                  onChange={() => setExportPeriod('7days')}
                  className="form-radio h-4 w-4"
                />
                <span>Últimos 7 dias</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="exportPeriod"
                  checked={exportPeriod === '1month'}
                  onChange={() => setExportPeriod('1month')}
                  className="form-radio h-4 w-4"
                />
                <span>Último mês</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="exportPeriod"
                  checked={exportPeriod === '12months'}
                  onChange={() => setExportPeriod('12months')}
                  className="form-radio h-4 w-4"
                />
                <span>Últimos 12 meses</span>
              </label>
            </div>
            <p className="text-sm text-muted-foreground">
              {exportFormat === 'pdf' 
                ? 'Cada nota fiscal será exibida em uma página separada no arquivo PDF.' 
                : `Os documentos serão exportados em formato ${exportFormat.toUpperCase()} com todos os dados disponíveis.`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExportByPeriod}>
              Exportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Documents;
