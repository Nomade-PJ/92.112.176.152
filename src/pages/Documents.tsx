import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  TrashIcon,
  SettingsIcon,
  AlertCircleIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { moveDocumentToTrash } from '@/lib/document-trash-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export-utils';

interface Document {
  id: string;
  type: 'nfe' | 'nfce' | 'nfse';
  number: string;
  customer: string;
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
}

const Documents: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isApiConfigured, setIsApiConfigured] = useState(true);

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
    const savedDocuments = localStorage.getItem('pauloCell_documents');
    if (savedDocuments) {
      setDocuments(JSON.parse(savedDocuments));
    }
  };

  const handleNewDocument = () => {
    navigate('/documents/new');
  };

  const handleExport = (format: string) => {
    try {
      const filteredDocs = filterDocuments();
      switch (format) {
        case 'pdf':
          exportToPDF(filteredDocs, 'Documentos_Fiscais');
          break;
        case 'excel':
          exportToExcel(filteredDocs, 'Documentos_Fiscais');
          break;
        case 'csv':
          exportToCSV(filteredDocs, 'Documentos_Fiscais');
          break;
        default:
          toast.error('Formato de exportação não suportado');
          return;
      }
      toast.success(`Documentos exportados em formato ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting documents:', error);
      toast.error('Erro ao exportar documentos');
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
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [documentToPrint, setDocumentToPrint] = useState<Document | null>(null);

  const handlePrint = (doc: Document) => {
    setDocumentToPrint(doc);
    setShowPrintDialog(true);
  };

  const handlePrintConfirm = () => {
    if (!documentToPrint) return;

    try {
      const printStyles = `
        <style>
          @media print {
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            table { page-break-inside: auto; width: 100%; border-collapse: collapse; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .document-header { text-align: center; margin-bottom: 30px; }
            .document-info { margin: 20px; }
            .section-title { margin: 20px 0; }
          }
        </style>
      `;

      const getDocumentInfo = () => {
        const info = [];
        if (selectedColumns.includes('number')) info.push(`<p><strong>Número:</strong> ${documentToPrint.number}</p>`);
        if (selectedColumns.includes('type')) info.push(`<p><strong>Tipo:</strong> ${documentToPrint.type.toUpperCase()}</p>`);
        if (selectedColumns.includes('customer')) info.push(`<p><strong>Cliente:</strong> ${documentToPrint.customer}</p>`);
        if (selectedColumns.includes('date')) info.push(`<p><strong>Data:</strong> ${new Date(documentToPrint.date).toLocaleDateString('pt-BR')}</p>`);
        if (selectedColumns.includes('value')) info.push(`<p><strong>Valor:</strong> ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(documentToPrint.value)}</p>`);
        if (selectedColumns.includes('status')) info.push(`<p><strong>Status:</strong> ${documentToPrint.status}</p>`);
        if (selectedColumns.includes('paymentMethod')) info.push(`<p><strong>Forma de Pagamento:</strong> ${documentToPrint.paymentMethod}</p>`);
        return info.join('');
      };

      const content = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Documento Fiscal</title>
            ${printStyles}
          </head>
          <body>
            <div class="document-header">
              <h1>Documento Fiscal</h1>
            </div>
            <div class="document-info">
              ${getDocumentInfo()}
            </div>
            ${selectedColumns.includes('items') ? `
              <h2 class="section-title">Itens</h2>
              <table>
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Quantidade</th>
                    <th>Valor Unitário</th>
                    <th>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${documentToPrint.items.map(item => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.quantity}</td>
                      <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitValue)}</td>
                      <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.unitValue)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => {
            printWindow.close();
            setShowPrintDialog(false);
            setDocumentToPrint(null);
          };
        }, 250);
      } else {
        toast.error('Não foi possível abrir a janela de impressão');
      }
    } catch (error) {
      console.error('Error printing document:', error);
      toast.error('Erro ao imprimir documento');
    }
  };

  const handleDownload = (doc: Document) => {
    try {
      exportToPDF([doc], `Documento_${doc.number}`);
      toast.success('Documento exportado com sucesso como PDF');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleDelete = (documentId: string) => {
    setDocumentToDelete(documentId);
  };

  const confirmDelete = () => {
    if (!documentToDelete) return;
    
    try {
      const success = moveDocumentToTrash(documentToDelete);
      if (success) {
        loadDocuments(); // Refresh the list
        toast.success('Documento movido para a lixeira');
      } else {
        toast.error('Erro ao mover documento para a lixeira');
      }
    } catch (error) {
      console.error('Error moving document to trash:', error);
      toast.error('Erro ao mover documento para a lixeira');
    } finally {
      setDocumentToDelete(null); // Close the dialog
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

  return (
    <MainLayout>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrint(doc)}
                        >
                          <PrinterIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(doc)}
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
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

      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O documento será movido para a lixeira. Você poderá restaurá-lo posteriormente se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Documents;
