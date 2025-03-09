
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeftIcon, 
  PenIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  AlertCircleIcon, 
  XCircleIcon 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load device data from localStorage
    const loadDeviceData = () => {
      try {
        const savedDevices = localStorage.getItem('pauloCell_devices');
        if (savedDevices) {
          const devices = JSON.parse(savedDevices);
          const foundDevice = devices.find((d: any) => d.id === id);
          
          if (foundDevice) {
            setDevice(foundDevice);
            
            // Load customer data
            const savedCustomers = localStorage.getItem('pauloCell_customers');
            if (savedCustomers && foundDevice.owner) {
              const customers = JSON.parse(savedCustomers);
              const foundCustomer = customers.find((c: any) => c.id === foundDevice.owner);
              
              if (foundCustomer) {
                setCustomer(foundCustomer);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading device data:', error);
        toast.error('Erro ao carregar dados do dispositivo');
      } finally {
        setLoading(false);
      }
    };
    
    loadDeviceData();
  }, [id]);
  
  const handleDelete = () => {
    try {
      const savedDevices = localStorage.getItem('pauloCell_devices');
      if (savedDevices) {
        let devices = JSON.parse(savedDevices);
        devices = devices.filter((d: any) => d.id !== id);
        localStorage.setItem('pauloCell_devices', JSON.stringify(devices));
      }
      
      toast.success(`Dispositivo removido com sucesso`);
      navigate('/devices');
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Erro ao excluir dispositivo');
    }
  };
  
  const handleNewService = () => {
    navigate('/services/new', { state: { deviceId: device.id, customerId: device.owner } });
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
  
  if (!device) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <h2 className="text-2xl font-bold mb-4">Dispositivo não encontrado</h2>
          <Button onClick={() => navigate('/devices')}>Voltar para Dispositivos</Button>
        </div>
      </MainLayout>
    );
  }
  
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
            onClick={() => navigate('/devices')}
            className="h-8 w-8"
          >
            <ArrowLeftIcon size={16} />
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Dispositivo</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  {device.brand === 'other' ? 'Outra Marca' : device.brand} {device.model}
                </h2>
                <p className="text-muted-foreground">{device.serialNumber}</p>
              </div>
              <div className="flex gap-2">
                {customer && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/customers/${device.owner}`)}
                  >
                    Ver proprietário
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigate(`/devices/edit/${device.id}`)}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Proprietário</h3>
                <p className="font-medium">{customer ? customer.name : device.ownerName || 'Não especificado'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                <div className="flex items-center">
                  {device.status === 'good' ? (
                    <>
                      <CheckCircleIcon size={16} className="text-green-600 mr-1" />
                      <span>Bom estado</span>
                    </>
                  ) : device.status === 'issue' ? (
                    <>
                      <AlertCircleIcon size={16} className="text-amber-500 mr-1" />
                      <span>Problemas leves</span>
                    </>
                  ) : device.status === 'critical' ? (
                    <>
                      <XCircleIcon size={16} className="text-red-600 mr-1" />
                      <span>Problemas críticos</span>
                    </>
                  ) : (
                    <span>Não especificado</span>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tipo</h3>
                <p className="font-medium">
                  {device.type === 'cellphone' ? 'Celular' : 
                   device.type === 'tablet' ? 'Tablet' : 
                   device.type === 'notebook' ? 'Notebook' : 'Não especificado'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Último Serviço</h3>
                <p className="font-medium">{device.lastService || 'Nenhum serviço registrado'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Data de Compra</h3>
                <p className="font-medium">{device.purchaseDate || 'Não especificada'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Cor</h3>
                <p className="font-medium">{device.color || 'Não especificada'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Capacidade</h3>
                <p className="font-medium">{device.capacity || 'Não especificada'}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Observações</h3>
              <p>{device.notes || 'Nenhuma observação'}</p>
            </div>
            
            <Button onClick={handleNewService}>Novo Serviço</Button>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Histórico de Serviços</h2>
            
            {device.serviceHistory && device.serviceHistory.length > 0 ? (
              <div className="space-y-4">
                {device.serviceHistory.map((service: any, idx: number) => (
                  <motion.div 
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between">
                      <h3 className="font-medium">{service.type}</h3>
                      <span className="text-sm font-medium text-primary">R$ {service.cost}</span>
                    </div>
                    <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                      <span>{service.date}</span>
                      <span>{service.technician}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum serviço registrado.</p>
            )}
          </Card>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default DeviceDetail;
