import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useLocation } from 'react-router-dom';
import { 
  UserIcon, 
  StoreIcon, 
  BellIcon, 
  SaveIcon,
  DatabaseIcon,
  TrashIcon,
  RefreshCwIcon,
  FileTextIcon,
  KeyIcon
} from 'lucide-react';
import { toast } from 'sonner';
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
import { initInvoiceApi, InvoiceApiConfig } from '@/lib/invoice-api';
import { resetAllStatistics, resetVisualStatistics } from '../lib/reset-stats';

const Settings: React.FC = () => {
  const location = useLocation();
  const stateTab = location.state?.openTab || null;
  const [activeTab, setActiveTab] = useState(stateTab || 'company');
  const [isResettingDatabase, setIsResettingDatabase] = useState(false);
  const [isPasswordConfirmOpen, setIsPasswordConfirmOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Company information state
  const [companyData, setCompanyData] = useState({
    name: 'Paulo Cell',
    phone: '(11) 98765-4321',
    email: 'Paullo.celullar2020@gmail',
    address: 'Rua Dr. Paulo Ramos, S/n, Bairro: Centro',
    city: 'Coelho Neto',
    state: 'MA',
    postalCode: '65620-000',
    logo: '',
    cpfCnpj: '42.054.453/0001-40',
    notes: 'Assistência técnica especializada em celulares android e Iphone',
  });
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    newService: true,
    serviceCompleted: true,
    lowInventory: true,
    customerBirthday: false,
    emailNotifications: true,
    smsNotifications: false,
  });
  
  // API settings state
  const [apiSettings, setApiSettings] = useState<InvoiceApiConfig>({
    apiKey: '',
    environment: 'sandbox',
    companyId: ''
  });
  
  // Load saved settings on component mount
  useEffect(() => {
    const savedCompanyData = localStorage.getItem('pauloCell_companyData');
    const savedNotificationSettings = localStorage.getItem('pauloCell_notificationSettings');
    const savedApiSettings = localStorage.getItem('pauloCell_invoiceApiConfig');

    if (savedCompanyData) {
      setCompanyData(JSON.parse(savedCompanyData));
    }

    if (savedNotificationSettings) {
      setNotificationSettings(JSON.parse(savedNotificationSettings));
    }
    
    if (savedApiSettings) {
      setApiSettings(JSON.parse(savedApiSettings));
    }
    
    // Definir a aba ativa com base no parâmetro de estado da navegação
    if (stateTab) {
      setActiveTab(stateTab);
    }
  }, [stateTab]);

  const handleCompanyDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleApiSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApiSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleApiEnvironmentChange = (environment: 'sandbox' | 'production') => {
    setApiSettings(prev => ({ ...prev, environment }));
  };
  
  const handleSwitchChange = (setting: string, checked: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: checked }));
  };
  
  const handleSaveCompanyData = () => {
    localStorage.setItem('pauloCell_companyData', JSON.stringify(companyData));
    toast.success('Informações da empresa salvas com sucesso!');
  };
  
  const handleSaveNotificationSettings = () => {
    localStorage.setItem('pauloCell_notificationSettings', JSON.stringify(notificationSettings));
    toast.success('Configurações de notificações salvas com sucesso!');
  };
  
  const handleSaveApiSettings = () => {
    // Validar API Key
    if (!apiSettings.apiKey || apiSettings.apiKey.trim() === '') {
      toast.error('A chave da API é obrigatória.');
      return;
    }
    
    // Inicializar a API com as configurações
    initInvoiceApi(apiSettings);
    
    // Salvar configurações no localStorage
    localStorage.setItem('pauloCell_invoiceApiConfig', JSON.stringify(apiSettings));
    
    toast.success('Configurações da API salvas com sucesso!');
  };
  
  const handlePasswordConfirm = () => {
    if (passwordInput === 'MilenaeNicolas') {
      // Senha correta, proceder com o reset
      handleResetDatabase();
      setIsPasswordConfirmOpen(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      // Senha incorreta
      setPasswordError('A senha digitada não corresponde à dica. Por favor, copie exatamente como mostrado.');
    }
  };
  
  const handleContinueToPasswordConfirm = () => {
    // Fechar o diálogo de confirmação inicial
    setIsResettingDatabase(false);
    // Abrir o diálogo de confirmação de senha
    setIsPasswordConfirmOpen(true);
  };
  
  const handleResetDatabase = () => {
    try {
      // Clear all app data from localStorage
      localStorage.removeItem('pauloCell_customers');
      localStorage.removeItem('pauloCell_devices');
      localStorage.removeItem('pauloCell_services');
      localStorage.removeItem('pauloCell_inventory');
      localStorage.removeItem('pauloCell_documents');
      
      // Keep the settings
      toast.success('Todos os dados foram apagados com sucesso!');
    } catch (error) {
      console.error('Error resetting database:', error);
      toast.error('Ocorreu um erro ao resetar os dados.');
    }
  };
  
  const handleResetStatistics = () => {
    try {
      const success = resetAllStatistics();
      if (success) {
        toast.success('Estatísticas reinicializadas com sucesso!');
        // Recarregar a página após um breve delay para atualizar os dados
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Erro ao reinicializar estatísticas');
      }
    } catch (error) {
      console.error('Erro ao reinicializar estatísticas:', error);
      toast.error('Erro ao reinicializar estatísticas');
    }
  };

  const handleResetVisualStats = () => {
    try {
      const success = resetVisualStatistics();
      if (success) {
        toast.success('Estatísticas visuais reinicializadas!');
        // Recarregar a página após um breve delay para atualizar os dados
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Erro ao reinicializar estatísticas visuais');
      }
    } catch (error) {
      console.error('Erro ao reinicializar estatísticas visuais:', error);
      toast.error('Erro ao reinicializar estatísticas visuais');
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
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
        </div>
        
        <Tabs defaultValue="company" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 sm:w-[600px]">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <StoreIcon size={16} />
              <span>Empresa</span>
            </TabsTrigger>
            <TabsTrigger value="fiscalApi" className="flex items-center gap-2">
              <FileTextIcon size={16} />
              <span>API Fiscal</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <DatabaseIcon size={16} />
              <span>Sistema</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="company" className="mt-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Informações da Empresa</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input
                    id="name"
                    name="name"
                    value={companyData.name}
                    onChange={handleCompanyDataChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={companyData.phone}
                    onChange={handleCompanyDataChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj">CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    name="cpfCnpj"
                    value={companyData.cpfCnpj}
                    onChange={handleCompanyDataChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={companyData.email}
                    onChange={handleCompanyDataChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    name="address"
                    value={companyData.address}
                    onChange={handleCompanyDataChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    value={companyData.city}
                    onChange={handleCompanyDataChange}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      name="state"
                      value={companyData.state}
                      onChange={handleCompanyDataChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">CEP</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={companyData.postalCode}
                      onChange={handleCompanyDataChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-6">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={companyData.notes}
                  onChange={handleCompanyDataChange}
                  rows={4}
                />
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveCompanyData} className="gap-2">
                  <SaveIcon size={16} />
                  <span>Salvar Informações</span>
                </Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="fiscalApi" className="mt-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Configuração da API de Notas Fiscais</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="flex items-center gap-2">
                    <KeyIcon size={16} />
                    <span>Chave da API</span>
                  </Label>
                  <Input
                    id="apiKey"
                    name="apiKey"
                    value={apiSettings.apiKey}
                    onChange={handleApiSettingsChange}
                    placeholder="Digite a chave da API de notas fiscais"
                  />
                  <p className="text-sm text-muted-foreground">
                    Esta chave é necessária para emissão de documentos fiscais. Você pode obter sua chave no portal do provedor de serviços de NF-e.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyId">ID da Empresa</Label>
                  <Input
                    id="companyId"
                    name="companyId"
                    value={apiSettings.companyId}
                    onChange={handleApiSettingsChange}
                    placeholder="Digite o ID da sua empresa (se necessário)"
                  />
                  <p className="text-sm text-muted-foreground">
                    Algumas APIs requerem um identificador da empresa. Se o seu provedor não utiliza este campo, deixe em branco.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Ambiente</Label>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="environment-sandbox"
                        checked={apiSettings.environment === 'sandbox'}
                        onChange={() => handleApiEnvironmentChange('sandbox')}
                        className="form-radio h-4 w-4"
                      />
                      <Label htmlFor="environment-sandbox" className="cursor-pointer">Sandbox (Testes)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="environment-production"
                        checked={apiSettings.environment === 'production'}
                        onChange={() => handleApiEnvironmentChange('production')}
                        className="form-radio h-4 w-4"
                      />
                      <Label htmlFor="environment-production" className="cursor-pointer">Produção</Label>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use o ambiente de Sandbox para testes sem emitir documentos fiscais reais.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setApiSettings({
                      apiKey: 'teste_sandbox_123',
                      environment: 'sandbox',
                      companyId: 'teste_company_id'
                    });
                    toast.info('Configurações de teste carregadas. Lembre-se que estas são apenas para teste e não emitem documentos reais.');
                  }}
                  className="gap-2"
                >
                  <RefreshCwIcon size={16} />
                  <span>Carregar Configuração de Teste</span>
                </Button>
                
                <Button onClick={handleSaveApiSettings} className="gap-2">
                  <SaveIcon size={16} />
                  <span>Salvar Configurações</span>
                </Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="system" className="mt-6 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Dados do Sistema</h2>
              
              <div className="space-y-6">
                <div className="flex flex-col space-y-4">
                  <h3 className="text-md font-medium">Backup e Restauração</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <Card className="p-4 border-dashed">
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <h4 className="font-medium">Resetar Banco de Dados</h4>
                          <p className="text-sm text-muted-foreground mt-2 text-red-600">
                            CUIDADO: Esta ação apagará todos os dados do sistema (clientes, dispositivos, serviços e estoque). Esta ação não pode ser desfeita.
                          </p>
                        </div>
                        <Button 
                          variant="destructive" 
                          className="mt-4 gap-2" 
                          onClick={() => setIsResettingDatabase(true)}
                        >
                          <TrashIcon size={16} />
                          <span>Resetar Dados</span>
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
      
      {/* Reset Database Dialog */}
      <AlertDialog open={isResettingDatabase} onOpenChange={setIsResettingDatabase}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá apagar <strong>todos</strong> os seus dados, incluindo clientes, dispositivos, serviços e estoque.
              <br /><br />
              Esta ação <strong>não pode ser desfeita</strong>. Recomendamos fazer um backup antes de prosseguir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleContinueToPasswordConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, resetar todos os dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Password Confirmation Dialog */}
      <AlertDialog open={isPasswordConfirmOpen} onOpenChange={setIsPasswordConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação de Segurança</AlertDialogTitle>
            <AlertDialogDescription>
              Para confirmar a exclusão de todos os dados, copie a dica de senha abaixo e cole-a no campo de confirmação.
              <div className="mt-4 p-3 bg-muted rounded-md font-medium text-center">
                MilenaeNicolas
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password-confirm">Cole a dica de senha aqui:</Label>
              <Input
                id="password-confirm"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Digite a senha exatamente como mostrada"
              />
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPasswordInput('');
              setPasswordError('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePasswordConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={!passwordInput}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Settings;
