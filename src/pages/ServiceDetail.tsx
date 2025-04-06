import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeftIcon, PenIcon, TrashIcon, ClockIcon, ActivityIcon, CheckCircleIcon, PackageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Mock data
const services = [
  {
    id: '1',
    type: 'Troca de Tela',
    status: 'in_progress',
    customer: 'João Silva',
    customerId: '1',
    device: 'iPhone 13 Pro',
    deviceId: '1',
    createDate: '22/10/2023',
    estimatedCompletion: '24/10/2023',
    completionDate: null,
    price: 450,
    cost: 350,
    technician: 'Carlos Oliveira',
    parts: [
      { id: '1', name: 'Tela iPhone 13 Pro', quantity: 1, price: 350 }
    ],
    notes: 'Cliente relatou que o aparelho caiu e a tela trincou. Tela original Apple.',
    updates: [
      { date: '22/10/2023', time: '14:30', message: 'Serviço iniciado', user: 'Carlos Oliveira' },
      { date: '23/10/2023', time: '10:15', message: 'Tela removida, aguardando peça', user: 'Carlos Oliveira' }
    ]
  },
  {
    id: '2',
    type: 'Substituição de Bateria',
    status: 'waiting',
    customer: 'Maria Santos',
    customerId: '2',
    device: 'Samsung Galaxy S22',
    deviceId: '2',
    createDate: '21/10/2023',
    estimatedCompletion: '23/10/2023',
    completionDate: null,
    price: 180,
    cost: 120,
    technician: undefined,
    parts: [
      { id: '2', name: 'Bateria Samsung Galaxy S22', quantity: 1, price: 120 }
    ],
    notes: 'Cliente reclamou que a bateria não dura mais que 2 horas de uso.',
    updates: [
      { date: '21/10/2023', time: '16:45', message: 'Serviço registrado', user: 'Ana Ferreira' }
    ]
  },
  {
    id: '3',
    type: 'Reparo de Placa',
    status: 'completed',
    customer: 'Pedro Almeida',
    customerId: '3',
    device: 'iPhone 12',
    deviceId: '3',
    createDate: '20/10/2023',
    estimatedCompletion: '22/10/2023',
    completionDate: '22/10/2023',
    price: 320,
    cost: 180,
    technician: 'Ana Ferreira',
    parts: [
      { id: '3', name: 'Chip de Áudio', quantity: 1, price: 80 },
      { id: '4', name: 'Componentes diversos', quantity: 1, price: 100 }
    ],
    notes: 'Aparelho não emite som. Problema no chip de áudio.',
    updates: [
      { date: '20/10/2023', time: '09:30', message: 'Serviço iniciado', user: 'Ana Ferreira' },
      { date: '21/10/2023', time: '14:20', message: 'Componente identificado com problema', user: 'Ana Ferreira' },
      { date: '22/10/2023', time: '11:45', message: 'Reparo concluído e testado', user: 'Ana Ferreira' }
    ]
  }
];

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updateText, setUpdateText] = useState('');
  
  // Load service data from localStorage
  useEffect(() => {
    const loadServiceData = () => {
      try {
        setLoading(true);
        
        const savedServices = localStorage.getItem('pauloCell_services');
        if (savedServices) {
          const services = JSON.parse(savedServices);
          let foundService = services.find((s: any) => s.id === id);
          
          if (foundService) {
            // Verifica se o serviço deve ser marcado como concluído
            if (
              foundService.estimatedCompletion && 
              foundService.status !== 'completed' && 
              foundService.status !== 'delivered'
            ) {
              const currentDate = new Date();
              const [day, month, year] = foundService.estimatedCompletion.split('/').map(Number);
              const estimatedDate = new Date(year, month - 1, day); // Mês em JS é 0-indexed
              
              // Se a data atual for posterior à data estimada, atualizar para concluído
              if (currentDate > estimatedDate) {
                foundService = { ...foundService, status: 'completed' };
                
                // Atualiza a lista completa de serviços no localStorage
                const updatedServices = services.map((s: any) => 
                  s.id === id ? foundService : s
                );
                localStorage.setItem('pauloCell_services', JSON.stringify(updatedServices));
                
                toast({
                  title: "Status atualizado automaticamente",
                  description: "O serviço foi marcado como concluído pois a data estimada foi ultrapassada.",
                });
              }
            }
            
            setService(foundService);
          } else {
            toast({
              title: "Serviço não encontrado",
              description: "O serviço que você está procurando não existe ou foi removido.",
            });
          }
        } else {
          toast({
            title: "Nenhum serviço cadastrado",
            description: "Não há serviços cadastrados no sistema.",
          });
        }
      } catch (error) {
        console.error('Error loading service data:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao carregar os dados do serviço.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadServiceData();
  }, [id, toast]);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (!service) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <h2 className="text-2xl font-bold mb-4">Serviço não encontrado</h2>
          <Button onClick={() => navigate('/services')}>Voltar para Serviços</Button>
        </div>
      </MainLayout>
    );
  }
  
  const handleDelete = () => {
    try {
      const savedServices = localStorage.getItem('pauloCell_services');
      if (savedServices) {
        const services = JSON.parse(savedServices);
        const updatedServices = services.filter((s: any) => s.id !== id);
        localStorage.setItem('pauloCell_services', JSON.stringify(updatedServices));
        
        toast({
          title: "Serviço excluído",
          description: `${service.type} para ${service.customer} foi removido com sucesso.`,
        });
        navigate('/services');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o serviço.",
      });
    }
  };
  
  const handleStatusChange = (newStatus: string) => {
    try {
      const savedServices = localStorage.getItem('pauloCell_services');
      if (savedServices) {
        const services = JSON.parse(savedServices);
        const updatedServices = services.map((s: any) => {
          if (s.id === id) {
            return { ...s, status: newStatus };
          }
          return s;
        });
        
        localStorage.setItem('pauloCell_services', JSON.stringify(updatedServices));
        setService({ ...service, status: newStatus });
        
        toast({
          title: "Status atualizado",
          description: `O status do serviço foi alterado para ${
            newStatus === 'waiting' ? 'Em espera' : 
            newStatus === 'in_progress' ? 'Em andamento' : 
            newStatus === 'completed' ? 'Concluído' : 'Entregue'
          }.`,
        });
      }
    } catch (error) {
      console.error('Error updating service status:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o status do serviço.",
      });
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge className="bg-blue-500">Em espera</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-500">Em andamento</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'delivered':
        return <Badge className="bg-purple-500">Entregue</Badge>;
      default:
        return null;
    }
  };
  
  const calculateTotalParts = () => {
    return service.parts ? service.parts.reduce((total: number, part: any) => total + (part.price || 0), 0) : 0;
  };
  
  const handleAddUpdate = () => {
    if (!updateText.trim()) return;
    
    try {
      // Formatar data e hora atual
      const now = new Date();
      const date = now.toLocaleDateString('pt-BR');
      const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Criar objeto de atualização
      const newUpdate = {
        date,
        time,
        message: updateText.trim(),
        user: 'Usuário do Sistema' // Idealmente, usar o nome do usuário logado
      };
      
      // Obter serviços do localStorage
      const savedServices = localStorage.getItem('pauloCell_services');
      if (savedServices) {
        const services = JSON.parse(savedServices);
        
        // Encontrar e atualizar o serviço
        const updatedServices = services.map((s: any) => {
          if (s.id === id) {
            // Adicionar a nova atualização ao array de atualizações
            const updates = s.updates && Array.isArray(s.updates) ? [...s.updates, newUpdate] : [newUpdate];
            return { ...s, updates };
          }
          return s;
        });
        
        // Salvar no localStorage
        localStorage.setItem('pauloCell_services', JSON.stringify(updatedServices));
        
        // Atualizar o estado do serviço
        const updatedService = { 
          ...service, 
          updates: service.updates && Array.isArray(service.updates) ? [...service.updates, newUpdate] : [newUpdate] 
        };
        setService(updatedService);
        
        // Limpar o campo de texto
        setUpdateText('');
        
        toast({
          title: "Atualização adicionada",
          description: "A atualização foi registrada com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error adding update:', error);
      toast({
        title: "Erro ao adicionar atualização",
        description: "Ocorreu um erro ao adicionar a atualização.",
      });
    }
  };
  
  return (
    <MainLayout>
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/services')}
            className="h-8 w-8"
          >
            <ArrowLeftIcon size={16} />
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Serviço</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{service.type}</h2>
                  {getStatusBadge(service.status)}
                </div>
                <p className="text-muted-foreground">{service.device} - {service.customer}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigate(`/services/edit/${service.id}`)}
                >
                  <PenIcon size={16} />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleDelete}
                >
                  <TrashIcon size={16} />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Cliente</h3>
                <p className="font-medium cursor-pointer hover:text-primary transition-colors" 
                  onClick={() => navigate(`/customers/${service.customerId}`)}>
                  {service.customer}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Dispositivo</h3>
                <p className="font-medium cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/devices/${service.deviceId}`)}>
                  {service.device}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Técnico</h3>
                <p className="font-medium">{service.technician || "Não atribuído"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Data de Criação</h3>
                <p className="font-medium">{service.createDate}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Previsão de Conclusão</h3>
                <p className="font-medium">{service.estimatedCompletion}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Data de Conclusão</h3>
                <p className="font-medium">{service.completionDate || "Não concluído"}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Observações</h3>
              <p>{service.notes}</p>
            </div>
            
            {service.parts && service.parts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Peças Utilizadas</h3>
                <div className="bg-muted/30 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase py-3 px-4">Peça</th>
                        <th className="text-center text-xs font-medium text-muted-foreground uppercase py-3 px-4">Quantidade</th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase py-3 px-4">Preço</th>
                      </tr>
                    </thead>
                    <tbody>
                      {service.parts.map((part: any, idx: number) => (
                        <tr key={part.id || idx} className={idx < service.parts.length - 1 ? "border-b" : ""}>
                          <td className="py-3 px-4">{part.name}</td>
                          <td className="py-3 px-4 text-center">{part.quantity}</td>
                          <td className="py-3 px-4 text-right">R$ {part.price?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-t-2">
                        <td colSpan={2} className="py-3 px-4 font-medium text-right">Total de Peças:</td>
                        <td className="py-3 px-4 text-right font-bold">R$ {calculateTotalParts().toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="py-3 px-4 font-medium text-right">Mão de Obra:</td>
                        <td className="py-3 px-4 text-right font-bold">R$ {((service.price || 0) - calculateTotalParts()).toFixed(2)}</td>
                      </tr>
                      <tr className="bg-muted/60">
                        <td colSpan={2} className="py-3 px-4 font-bold text-right">Valor Total:</td>
                        <td className="py-3 px-4 text-right font-bold text-primary">R$ {(service.price || 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={service.status === 'waiting' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => handleStatusChange('waiting')}
              >
                <ClockIcon size={16} className="text-blue-600" />
                <span>Em espera</span>
              </Button>
              <Button
                variant={service.status === 'in_progress' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => handleStatusChange('in_progress')}
              >
                <ActivityIcon size={16} className="text-amber-500" />
                <span>Em andamento</span>
              </Button>
              <Button
                variant={service.status === 'completed' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => handleStatusChange('completed')}
              >
                <CheckCircleIcon size={16} className="text-green-600" />
                <span>Concluído</span>
              </Button>
              <Button
                variant={service.status === 'delivered' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => handleStatusChange('delivered')}
              >
                <PackageIcon size={16} className="text-purple-600" />
                <span>Entregue</span>
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Atualizações</h2>
            
            {service.updates && service.updates.length > 0 ? (
              <div className="space-y-4">
                {service.updates.map((update: any, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{update.date} às {update.time}</span>
                      <span className="text-sm font-medium">{update.user}</span>
                    </div>
                    <p className="mt-1">{update.message}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma atualização registrada.</p>
            )}
            
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Adicionar Atualização</h3>
              <textarea 
                className="w-full h-24 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Digite uma atualização sobre o andamento do serviço..."
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
              />
              <Button 
                className="w-full" 
                onClick={handleAddUpdate}
                disabled={!updateText.trim()}
              >
                Adicionar Atualização
              </Button>
            </div>
          </Card>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default ServiceDetail;
