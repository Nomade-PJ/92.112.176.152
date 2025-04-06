import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  PrinterIcon, 
  FileTextIcon, 
  CalendarIcon, 
  UserIcon, 
  DollarSignIcon,
  MailIcon,
  PencilIcon
} from 'lucide-react';
import EditDocumentForm from '../components/forms/EditDocumentForm';
// Note: document-pdf-utils is imported dynamically when needed

type DocumentStatus = 'Emitida' | 'Cancelada' | 'Pendente';

interface DocumentItem {
  description: string;
  quantity: number;
  unitValue: number;
  ncm?: string;
  cfop?: string;
}

interface Document {
  id: string;
  type: 'nfe' | 'nfce' | 'nfse';
  number: string;
  customer: string;
  customerId?: string;
  date: string;
  value: number;
  status: DocumentStatus;
  items: DocumentItem[];
  paymentMethod: string;
  observations?: string;
  // API response fields
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceKey?: string;
  invoiceUrl?: string;
  naturezaOperacao?: string;
  cpfCnpjConsumidor?: string;
  servicosPrestados?: string;
  aliquotaIss?: number;
}

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadDocument = () => {
      try {
        const savedDocuments = localStorage.getItem('pauloCell_documents');
        if (!savedDocuments) {
          toast.error('Nenhum documento encontrado');
          navigate('/documents');
          return;
        }

        const documents = JSON.parse(savedDocuments);
        const doc = documents.find((d: Document) => d.id === id);

        if (!doc) {
          toast.error('Documento não encontrado');
          navigate('/documents');
          return;
        }

        setDocument(doc);
        
        // Verificar se devemos abrir no modo de edição
        const state = location.state as { openEditMode?: boolean } | null;
        if (state && state.openEditMode && doc.status !== 'Cancelada') {
          setIsEditing(true);
        }
      } catch (error) {
        console.error('Error loading document:', error);
        toast.error('Erro ao carregar documento');
        navigate('/documents');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [id, navigate, location]);

  const handleStatusChange = async (newStatus: DocumentStatus) => {
    if (!document) return;

    try {
      // If changing to 'Cancelada' and we have an invoiceId, call the API to cancel the invoice
      if (newStatus === 'Cancelada' && document.invoiceId) {
        setLoading(true);
        toast.info('Processando cancelamento do documento fiscal...');
        
        // Import the invoice API utility
        const { cancelInvoice } = await import('../lib/invoice-api');
        
        // Call the API to cancel the invoice
        const cancelResponse = await cancelInvoice(
          document.invoiceId,
          'Cancelamento solicitado pelo usuário'
        );
        
        if (!cancelResponse.success) {
          throw new Error(cancelResponse.error || 'Erro ao cancelar documento fiscal');
        }
        
        toast.success('Documento fiscal cancelado com sucesso no provedor');
        if (cancelResponse.message) {
          toast.info(cancelResponse.message);
        }
      }
      
      // Update the document status in localStorage
      const savedDocuments = localStorage.getItem('pauloCell_documents');
      if (!savedDocuments) return;
      
      const documents = JSON.parse(savedDocuments);
      
      const updatedDocuments = documents.map((doc: Document) => {
        if (doc.id === document.id) {
          return { ...doc, status: newStatus };
        }
        return doc;
      });
      
      localStorage.setItem('pauloCell_documents', JSON.stringify(updatedDocuments));
      
      setDocument({ ...document, status: newStatus });
      toast.success(`Status alterado para ${newStatus}`);
    } catch (error) {
      console.error('Error updating document status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar status do documento';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!document) return;
    
    try {
      // Import the PDF utility
      import('../lib/document-pdf-utils').then(({ generateEnhancedPrintContent }) => {
        // Generate enhanced print content with professional layout
        const content = generateEnhancedPrintContent(document);
        
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
            toast.success('Impressão concluída');
          };
          
          // Iniciar impressão após um breve delay
          setTimeout(() => {
            printWindow.print();
            toast.success('Documento enviado para impressão');
          }, 250);
        } else {
          toast.error('Não foi possível abrir a janela de impressão');
        }
      }).catch(error => {
        console.error('Error importing print utils:', error);
        toast.error('Erro ao gerar conteúdo para impressão');
      });
    } catch (error) {
      console.error('Error printing document:', error);
      toast.error('Erro ao imprimir documento');
    }
  };

  const handleSendEmail = () => {
    if (!document) return;
    
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
          const customerDocs = allDocs.filter((d: Document) => 
            d.customer === document.customer && d.id !== document.id
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
                    onClick: () => sendEmailDirectly(customerEmail)
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
    setEmailTo('');
    setEmailDialogOpen(true);
  };
  
  // Função para enviar email diretamente sem mostrar diálogo
  const sendEmailDirectly = async (email: string) => {
    if (!document || !email || !email.trim()) {
      toast.error('Email inválido ou documento não disponível');
      return;
    }
    
    try {
      setSendingEmail(true);
      
      // Import the email utility
      const { sendDocumentByEmail } = await import('../lib/email-utils');
      
      // Send the email
      const success = await sendDocumentByEmail(document as any, email);
      
      if (success) {
        // Salvar o email usado para futuros envios
        try {
          const savedDocuments = localStorage.getItem('pauloCell_documents');
          if (savedDocuments) {
            const allDocs = JSON.parse(savedDocuments);
            const updatedDocs = allDocs.map((d: Document) => {
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
      }
    } catch (error) {
      console.error('Error sending document by email:', error);
      toast.error('Erro ao enviar documento por email');
    } finally {
      setSendingEmail(false);
    }
  };
  
  const handleSendEmailConfirm = async () => {
    if (!document || !emailTo || !emailTo.trim()) {
      toast.error('Por favor, insira um email válido');
      return;
    }
    
    try {
      setSendingEmail(true);
      setEmailDialogOpen(false);
      
      // Import the email utility
      const { sendDocumentByEmail } = await import('../lib/email-utils');
      
      // Send the email
      const success = await sendDocumentByEmail(document as any, emailTo);
      
      if (success) {
        // Salvar o email usado para futuros envios
        try {
          const savedDocuments = localStorage.getItem('pauloCell_documents');
          if (savedDocuments) {
            const allDocs = JSON.parse(savedDocuments);
            const updatedDocs = allDocs.map((d: Document) => {
              if (d.id === document.id) {
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
      }
    } catch (error) {
      console.error('Error sending document by email:', error);
      toast.error('Erro ao enviar documento por email');
    } finally {
      setSendingEmail(false);
    }
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getFormattedValue = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch(status) {
      case 'Emitida':
        return 'bg-green-100 text-green-800';
      case 'Cancelada':
        return 'bg-red-100 text-red-800';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditSubmit = (updatedDocument: any) => {
    setDocument(updatedDocument);
    setIsEditing(false);
    toast.success('Documento atualizado com sucesso!');
  };

  return (
    <MainLayout>
      {/* Email Dialog */}
      <AlertDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar Documento por E-mail</AlertDialogTitle>
            <AlertDialogDescription>
              Digite o endereço de e-mail para enviar o documento {document?.type.toUpperCase()}-{document?.number}.
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
              disabled={sendingEmail}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendingEmail}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSendEmailConfirm} 
              disabled={sendingEmail || !emailTo.trim()}
            >
              {sendingEmail ? 'Enviando...' : 'Enviar Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {loading ? (
        <div className="container mx-auto p-6 flex justify-center items-center h-[80vh]">
          <p>Carregando...</p>
        </div>
      ) : !document ? (
        <div className="container mx-auto p-6">
          <p>Documento não encontrado</p>
          <Button onClick={() => navigate('/documents')} variant="outline" className="mt-4">
            Voltar para Documentos
          </Button>
        </div>
      ) : isEditing ? (
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Editar Documento</h1>
          </div>
          
          <EditDocumentForm 
            document={document} 
            onSubmit={handleEditSubmit} 
            onCancel={handleEditCancel} 
          />
        </div>
      ) : (
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/documents')}>
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Detalhes do Documento</h1>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Informações do Documento</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleEditClick}
                      disabled={document.status === 'Cancelada'}
                      title="Editar documento"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                      <PrinterIcon className="w-4 h-4 mr-2" />
                      Imprimir
                    </Button>
                    <Button variant="outline" onClick={handleSendEmail}>
                      <MailIcon className="w-4 h-4 mr-2" />
                      Enviar por E-mail
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      <FileTextIcon className="w-4 h-4" />
                      Número
                    </h3>
                    <p className="text-muted-foreground">{document.number}</p>
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Data
                    </h3>
                    <p className="text-muted-foreground">
                      {getFormattedDate(document.date)}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Cliente
                    </h3>
                    <p className="text-muted-foreground">{document.customer}</p>
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      <DollarSignIcon className="w-4 h-4" />
                      Valor Total
                    </h3>
                    <p className="text-muted-foreground">
                      {getFormattedValue(document.value)}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      Status
                    </h3>
                    <div className="mt-1">
                      <Select 
                        defaultValue={document.status} 
                        onValueChange={(value) => handleStatusChange(value as DocumentStatus)}
                      >
                        <SelectTrigger className={`w-[110px] h-7 px-2 py-0 text-xs font-medium ${getStatusColor(document.status)}`}
                        >
                          {document.status}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Emitida">Emitida</SelectItem>
                          <SelectItem value="Cancelada">Cancelada</SelectItem>
                          <SelectItem value="Pendente">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Informações específicas por tipo de documento */}
                {document.type === 'nfe' && document.naturezaOperacao && (
                  <div className="mt-4">
                    <h3 className="font-medium">Natureza da Operação</h3>
                    <p className="text-muted-foreground">{document.naturezaOperacao}</p>
                  </div>
                )}
                
                {document.type === 'nfce' && document.cpfCnpjConsumidor && (
                  <div className="mt-4">
                    <h3 className="font-medium">CPF/CNPJ do Consumidor</h3>
                    <p className="text-muted-foreground">{document.cpfCnpjConsumidor}</p>
                  </div>
                )}
                
                {document.type === 'nfse' && (
                  <>
                    {document.servicosPrestados && (
                      <div className="mt-4">
                        <h3 className="font-medium">Serviços Prestados</h3>
                        <p className="text-muted-foreground">{document.servicosPrestados}</p>
                      </div>
                    )}
                    {document.aliquotaIss !== undefined && (
                      <div className="mt-4">
                        <h3 className="font-medium">Alíquota ISS (%)</h3>
                        <p className="text-muted-foreground">{document.aliquotaIss}%</p>
                      </div>
                    )}
                  </>
                )}

                {/* Mostrar itens */}
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Itens</h3>
                  <div className="bg-muted rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="w-20 text-right">Qtd</TableHead>
                          <TableHead className="w-28 text-right">Valor Unit.</TableHead>
                          <TableHead className="w-28 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {document.items && document.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {getFormattedValue(item.unitValue)}
                            </TableCell>
                            <TableCell className="text-right">
                              {getFormattedValue(item.quantity * item.unitValue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Observações */}
                {document.observations && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Observações</h3>
                    <p className="text-muted-foreground p-3 bg-muted rounded-md">
                      {document.observations}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default DocumentDetail;
