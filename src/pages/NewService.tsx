import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface SelectedPart {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const NewService: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { customerId, deviceId } = location.state || {};
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [laborCost, setLaborCost] = useState<number>(100);
  const [formData, setFormData] = useState({
    customerId: customerId || '',
    deviceId: deviceId || '',
    serviceType: '',
    customServiceType: '',
    technicianId: '',
    estimatedCompletion: '',
    status: 'waiting',
    priority: 'normal',
    notes: '',
  });
  
  // Load data from localStorage
  useEffect(() => {
    const savedCustomers = localStorage.getItem('pauloCell_customers');
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }
    
    const savedDevices = localStorage.getItem('pauloCell_devices');
    if (savedDevices) {
      setDevices(JSON.parse(savedDevices));
    }
    
    const savedInventory = localStorage.getItem('pauloCell_inventory');
    if (savedInventory) {
      setInventoryItems(JSON.parse(savedInventory));
    } else {
      // Fallback to mock data if no inventory is found
      setInventoryItems([
        { id: '1', name: 'Tela iPhone 13 Pro', price: 350, stock: 5 },
        { id: '2', name: 'Bateria Samsung Galaxy S22', price: 120, stock: 3 },
        { id: '3', name: 'Conector de Carga iPhone 12', price: 80, stock: 8 },
        { id: '4', name: 'Tela Xiaomi Redmi Note 11', price: 180, stock: 4 },
        { id: '5', name: 'Alto Falante iPhone 13', price: 60, stock: 12 },
        { id: '6', name: 'Cabo Flex Motorola Moto G32', price: 45, stock: 6 },
      ]);
    }
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    if (name === 'serviceType' && value === 'outros') {
      setFormData({ ...formData, [name]: value, customServiceType: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const addPart = (partId: string) => {
    const part = inventoryItems.find(p => p.id === partId);
    if (part) {
      const existingPart = selectedParts.find(p => p.id === partId);
      if (existingPart) {
        setSelectedParts(prev => 
          prev.map(p => p.id === partId ? { ...p, quantity: p.quantity + 1 } : p)
        );
      } else {
        setSelectedParts(prev => [...prev, { ...part, quantity: 1 }]);
      }
    }
  };
  
  const removePart = (partId: string) => {
    setSelectedParts(prev => prev.filter(p => p.id !== partId));
  };
  
  const updatePartQuantity = (partId: string, quantity: number) => {
    if (quantity <= 0) {
      removePart(partId);
      return;
    }
    
    setSelectedParts(prev => 
      prev.map(p => p.id === partId ? { ...p, quantity } : p)
    );
  };
  
  const calculateTotalParts = () => {
    return selectedParts.reduce((total, part) => total + (part.price * part.quantity), 0);
  };
  
  const calculateTotal = () => {
    return calculateTotalParts() + laborCost;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get customer and device names
    const customer = customers.find(c => c.id === formData.customerId);
    const device = devices.find(d => d.id === formData.deviceId);
    
    // Validar se o campo de serviço personalizado está preenchido quando 'Outros Serviços' for selecionado
    if (formData.serviceType === 'outros' && !formData.customServiceType.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, digite o nome do serviço.",
        variant: "destructive"
      });
      return;
    }
    
    const serviceData = {
      id: uuidv4(),
      ...formData,
      type: formData.serviceType === 'outros' ? formData.customServiceType : formData.serviceType,
      parts: selectedParts,
      laborCost,
      totalCost: calculateTotal(),
      price: calculateTotal(), // Added for ServiceCard compatibility
      createdAt: new Date().toISOString(),
      createDate: new Date().toLocaleDateString(), // Added for ServiceCard compatibility
      customer: customer?.name || 'Cliente não encontrado',
      customerId: formData.customerId, // Explicitly add customerId for proper filtering
      device: device?.name || 'Dispositivo não encontrado',
      deviceId: formData.deviceId, // Explicitly add deviceId for proper filtering
      technician: formData.technicianId || 'Não atribuído',
      estimatedCompletion: formData.estimatedCompletion || undefined,
    };
    
    // Get existing services or initialize empty array
    const savedServices = localStorage.getItem('pauloCell_services');
    const services = savedServices ? JSON.parse(savedServices) : [];
    
    // Add new service
    services.push(serviceData);
    
    // Save to localStorage
    localStorage.setItem('pauloCell_services', JSON.stringify(services));
    
    toast({
      title: "Serviço adicionado",
      description: "O serviço foi registrado com sucesso.",
    });
    
    navigate('/services');
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
            onClick={() => navigate(-1)}
            className="h-8 w-8"
          >
            <ArrowLeftIcon size={16} />
          </Button>
          <h1 className="text-2xl font-bold">Novo Serviço</h1>
        </div>
        
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente</Label>
                <Select 
                  value={formData.customerId} 
                  onValueChange={(value) => handleSelectChange('customerId', value)}
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="device">Dispositivo</Label>
                <Select 
                  value={formData.deviceId}
                  onValueChange={(value) => handleSelectChange('deviceId', value)}
                >
                  <SelectTrigger id="device">
                    <SelectValue placeholder="Selecione o dispositivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.brand} {d.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="serviceType">Tipo de Serviço</Label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value) => handleSelectChange('serviceType', value)}
                >
                  <SelectTrigger id="serviceType">
                    <SelectValue placeholder="Selecione o tipo de serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Troca de Tela">Troca de Tela</SelectItem>
                    <SelectItem value="Substituição de Bateria">Substituição de Bateria</SelectItem>
                    <SelectItem value="Reparo de Placa">Reparo de Placa</SelectItem>
                    <SelectItem value="Troca de Conector de Carga">Troca de Conector de Carga</SelectItem>
                    <SelectItem value="Atualização de Software">Atualização de Software</SelectItem>
                    <SelectItem value="Limpeza Interna">Limpeza Interna</SelectItem>
                    <SelectItem value="outros">Outros Serviços</SelectItem>
                  </SelectContent>
                </Select>
                {formData.serviceType === 'outros' && (
                  <div className="mt-2">
                    <Input
                      id="customServiceType"
                      name="customServiceType"
                      value={formData.customServiceType}
                      onChange={handleInputChange}
                      placeholder="Digite o nome do serviço"
                      required
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="technician">Técnico</Label>
                <Input
                  id="technician"
                  name="technicianId"
                  value={formData.technicianId}
                  onChange={handleInputChange}
                  placeholder="Nome do técnico responsável"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estimatedCompletion">Previsão de Conclusão</Label>
                <Input 
                  id="estimatedCompletion" 
                  name="estimatedCompletion"
                  value={formData.estimatedCompletion}
                  onChange={handleInputChange}
                  type="date" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiting">Em espera</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select 
                  value={formData.priority}
                  onValueChange={(value) => handleSelectChange('priority', value)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-base">Peças Utilizadas</Label>
                <div className="flex items-center gap-2">
                  <Select onValueChange={addPart}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Adicionar peça" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems.map(part => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.name} - R$ {part.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    size="icon" 
                    onClick={() => {
                      const selectEl = document.querySelector('select[name="parts"]') as HTMLSelectElement;
                      if (selectEl && selectEl.value) addPart(selectEl.value);
                    }}
                  >
                    <PlusIcon size={16} />
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase py-3 px-4">Peça</th>
                      <th className="text-center text-xs font-medium text-muted-foreground uppercase py-3 px-4">Quantidade</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase py-3 px-4">Preço</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase py-3 px-4">Total</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase py-3 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedParts.length > 0 ? (
                      selectedParts.map((part, idx) => (
                        <tr key={part.id} className={idx < selectedParts.length - 1 ? "border-b" : ""}>
                          <td className="py-3 px-4">{part.name}</td>
                          <td className="py-3 px-4 text-center">
                            <Input 
                              type="number" 
                              value={part.quantity}
                              min={1}
                              className="w-16 text-center mx-auto"
                              onChange={e => updatePartQuantity(part.id, parseInt(e.target.value))}
                            />
                          </td>
                          <td className="py-3 px-4 text-right">R$ {part.price.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">R$ {(part.price * part.quantity).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removePart(part.id)}
                            >
                              <TrashIcon size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 px-4 text-center text-muted-foreground">
                          Nenhuma peça adicionada
                        </td>
                      </tr>
                    )}
                    
                    <tr className="border-t">
                      <td colSpan={3} className="py-3 px-4 font-medium text-right">Total de Peças:</td>
                      <td className="py-3 px-4 text-right font-bold">R$ {calculateTotalParts().toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-3 px-4 font-medium text-right">Mão de Obra:</td>
                      <td className="py-3 px-4 text-right">
                        <Input 
                          type="number" 
                          value={laborCost}
                          className="w-24 text-right"
                          onChange={e => setLaborCost(parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td></td>
                    </tr>
                    <tr className="bg-muted/60">
                      <td colSpan={3} className="py-3 px-4 font-bold text-right">Valor Total:</td>
                      <td className="py-3 px-4 text-right font-bold text-primary">R$ {calculateTotal().toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes" 
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Informações adicionais sobre o serviço, condições do dispositivo, solicitações do cliente, etc."
                className="min-h-32"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Serviço</Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </MainLayout>
  );
};

export default NewService;
