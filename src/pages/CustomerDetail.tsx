
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PhoneIcon, 
  MailIcon, 
  MapPinIcon, 
  EditIcon,
  WrenchIcon,
  CalendarIcon,
  ClockIcon,
  ArrowLeftIcon,
  SmartphoneIcon
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import ServiceCard from '@/components/ui/ServiceCard';
import { toast } from 'sonner';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customerDevices, setCustomerDevices] = useState<any[]>([]);
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  
  useEffect(() => {
    // Load customer data from localStorage
    const loadCustomerData = () => {
      try {
        setLoading(true);
        
        // Load customer
        const savedCustomers = localStorage.getItem('pauloCell_customers');
        if (savedCustomers) {
          const customers = JSON.parse(savedCustomers);
          const foundCustomer = customers.find((c: any) => c.id === id);
          
          if (foundCustomer) {
            setCustomer(foundCustomer);
            
            // Load customer devices
            const savedDevices = localStorage.getItem('pauloCell_devices');
            if (savedDevices) {
              const devices = JSON.parse(savedDevices);
              const customerDevices = devices.filter((device: any) => device.owner === id);
              setCustomerDevices(customerDevices);
            }
            
            // Load customer services
            const savedServices = localStorage.getItem('pauloCell_services');
            if (savedServices) {
              const services = JSON.parse(savedServices);
              const customerServices = services.filter((service: any) => service.customer === id);
              setServiceHistory(customerServices);
            } else {
              setServiceHistory([]);
            }
          } else {
            toast.error('Cliente não encontrado');
            navigate('/customers');
          }
        }
      } catch (error) {
        console.error('Error loading customer data:', error);
        toast.error('Erro ao carregar dados do cliente');
      } finally {
        setLoading(false);
      }
    };
    
    loadCustomerData();
  }, [id, navigate]);
  
  // Handle new service click
  const handleNewService = () => {
    navigate('/services/new', { state: { customerId: customer?.id } });
  };
  
  // Handle add device click
  const handleAddDevice = () => {
    navigate('/devices/new', { state: { customerId: customer?.id } });
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (!customer) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <h2 className="text-2xl font-bold mb-4">Cliente não encontrado</h2>
          <Button onClick={() => navigate('/customers')}>Voltar para Clientes</Button>
        </div>
      </MainLayout>
    );
  }
  
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
            onClick={() => navigate('/customers')}
            className="h-8 w-8"
          >
            <ArrowLeftIcon size={16} />
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Cliente</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <motion.div 
              className="bg-card rounded-xl border border-border p-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-medium text-lg">
                      {customer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{customer.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        Cliente desde {formatDate(customer.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => navigate(`/customers/edit/${customer.id}`)}
                >
                  <EditIcon size={16} />
                  <span>Editar</span>
                </Button>
              </div>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-start gap-3">
                  <PhoneIcon size={18} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Telefone</p>
                    <p className="text-sm">{customer.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MailIcon size={18} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">E-mail</p>
                    <p className="text-sm">{customer.email || 'Não informado'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPinIcon size={18} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Endereço</p>
                    <p className="text-sm">{customer.address || 'Não informado'}</p>
                    {(customer.city || customer.state || customer.postalCode) && (
                      <p className="text-sm">
                        {[
                          customer.city, 
                          customer.state, 
                          customer.postalCode
                        ].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-1">CPF/CNPJ</p>
                  <p className="text-sm">{customer.cpfCnpj || 'Não informado'}</p>
                </div>
                
                {customer.notes && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium mb-1">Observações</p>
                    <p className="text-sm">{customer.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button className="gap-2 w-full" onClick={handleNewService}>
                  <WrenchIcon size={16} />
                  <span>Novo Serviço</span>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-card rounded-xl border border-border p-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Dispositivos</h3>
                <Button variant="outline" size="sm" className="gap-1" onClick={handleAddDevice}>
                  <SmartphoneIcon size={16} />
                  <span>Adicionar</span>
                </Button>
              </div>
              
              <div className="space-y-4">
                {customerDevices.length > 0 ? (
                  customerDevices.map((device, index) => (
                    <div 
                      key={device.id}
                      className="flex justify-between items-center p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/devices/${device.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <SmartphoneIcon size={18} />
                        </div>
                        <div>
                          <p className="font-medium">{device.brand} {device.model}</p>
                          <p className="text-xs text-muted-foreground">
                            {device.serialNumber}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Último serviço: {device.lastService || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">Nenhum dispositivo cadastrado</p>
                    <Button variant="outline" size="sm" onClick={handleAddDevice}>
                      Adicionar Dispositivo
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              className="bg-card rounded-xl border border-border p-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Histórico de Serviços</h3>
                  <p className="text-sm text-muted-foreground">
                    Total de {serviceHistory.length} serviços realizados
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={handleNewService}>
                    <CalendarIcon size={16} />
                    <span>Agendar</span>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                {serviceHistory.length > 0 ? (
                  serviceHistory.map((service, idx) => (
                    <ServiceCard 
                      key={service.id} 
                      service={service} 
                      index={idx} 
                    />
                  ))
                ) : (
                  <div className="text-center py-8 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground mb-3">Nenhum serviço registrado</p>
                    <Button onClick={handleNewService}>Agendar Novo Serviço</Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default CustomerDetail;
