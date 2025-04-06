import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CalendarIcon,
  DownloadIcon, 
  LineChartIcon, 
  PieChartIcon, 
  BarChart2Icon, 
  RefreshCwIcon,
  Settings2,
  RotateCcw,
  RefreshCcw,
  BarChart3,
  FileDown 
} from 'lucide-react';
import { resetVisualStatistics } from '../lib/reset-stats';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AppEvents, eventBus } from '@/lib/events';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [periodFilter, setPeriodFilter] = useState('month');
  const [services, setServices] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [dataWasReset, setDataWasReset] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    // Verificar se os dados foram recentemente resetados
    const resetFlag = localStorage.getItem('pauloCell_data_reset_flag');
    if (resetFlag === 'true') {
      setDataWasReset(true);
      // Não vamos mais remover a flag para que ela persista entre navegações
      // localStorage.removeItem('pauloCell_data_reset_flag');
    }
    
    loadData();
    
    // Adicionar listener para atualizar os dados quando o localStorage mudar
    const handleStorageChange = (event: StorageEvent) => {
      // Verificar se a mudança é em alguma chave que nos interessa
      const relevantKeys = [
        'pauloCell_services', 
        'pauloCell_devices', 
        'pauloCell_customers', 
        'pauloCell_inventory',
        'pauloCell_data_reset_flag'
      ];
      
      if (event.key && relevantKeys.includes(event.key)) {
        console.log(`Detectada mudança em ${event.key}, recarregando dados...`);
        
        // Se a flag de reset for alterada, atualizar o estado
        if (event.key === 'pauloCell_data_reset_flag') {
          setDataWasReset(event.newValue === 'true');
        }
        
        // Recarregar todos os dados
        loadData();
        
        // Mostrar notificação de atualização
        toast.info('Dados dos relatórios atualizados!', {
          duration: 2000,
          position: 'bottom-right'
        });
      }
    };
    
    // Registrar o listener de storage
    window.addEventListener('storage', handleStorageChange);
    
    // Registrar listeners para eventos do sistema
    const handleDataCreated = (data: any) => {
      console.log('[Reports] Dados criados:', data);
      loadData();
      toast.info(`Novos dados de ${translateEntityType(data.type)} adicionados`, {
        duration: 2000,
        position: 'bottom-right'
      });
    };
    
    const handleDataUpdated = (data: any) => {
      console.log('[Reports] Dados atualizados:', data);
      loadData();
      toast.info(`Dados de ${translateEntityType(data.type)} atualizados`, {
        duration: 2000,
        position: 'bottom-right'
      });
    };
    
    const handleRefreshRequested = () => {
      console.log('[Reports] Atualização solicitada');
      loadData();
      toast.info('Atualizando relatórios...', {
        duration: 2000,
        position: 'bottom-right'
      });
    };
    
    // Registrar os listeners de eventos
    eventBus.on(AppEvents.DATA_CREATED, handleDataCreated);
    eventBus.on(AppEvents.DATA_UPDATED, handleDataUpdated);
    eventBus.on(AppEvents.REPORTS_REFRESH_REQUESTED, handleRefreshRequested);
    
    // Verificar se já existem eventos específicos de entidades
    eventBus.on(AppEvents.CUSTOMER_CREATED, () => loadData());
    eventBus.on(AppEvents.DEVICE_CREATED, () => loadData());
    eventBus.on(AppEvents.SERVICE_CREATED, () => loadData());
    eventBus.on(AppEvents.INVENTORY_UPDATED, () => loadData());
    
    // Limpar todos os listeners quando o componente for desmontado
    return () => {
      // Remover listener de storage
      window.removeEventListener('storage', handleStorageChange);
      
      // Limpar o intervalo de atualização automática
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // Remover os listeners de eventos
      eventBus.off(AppEvents.DATA_CREATED, handleDataCreated);
      eventBus.off(AppEvents.DATA_UPDATED, handleDataUpdated);
      eventBus.off(AppEvents.REPORTS_REFRESH_REQUESTED, handleRefreshRequested);
    };
  }, [refreshInterval]);
  
  // Efeito para gerenciar a atualização automática
  useEffect(() => {
    if (autoRefresh) {
      // Iniciar o intervalo de atualização a cada 30 segundos
      const interval = setInterval(() => {
        console.log('Atualizando dados automaticamente...');
        loadData();
      }, 30000); // 30 segundos
      
      setRefreshInterval(interval);
      
      // Mostrar notificação de que a atualização automática está ativada
      toast.success('Atualização automática ativada!', {
        duration: 3000,
        position: 'bottom-right'
      });
    } else {
      // Limpar o intervalo se a atualização automática estiver desativada
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
        
        // Mostrar notificação de que a atualização automática está desativada
        toast.info('Atualização automática desativada', {
          duration: 3000,
          position: 'bottom-right'
        });
      }
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const loadData = () => {
    try {
      console.log('🔄 Carregando dados para relatórios...');
      
      // Load services
      const savedServices = localStorage.getItem('pauloCell_services');
      if (savedServices) {
        const parsedServices = JSON.parse(savedServices);
        setServices(parsedServices);
        console.log(`📊 Serviços carregados: ${parsedServices.length}`, 
          parsedServices.length > 0 ? parsedServices[0] : 'Nenhum serviço');
      } else {
        console.log('⚠️ Nenhum serviço encontrado no localStorage');
        setServices([]);
      }

      // Load devices
      const savedDevices = localStorage.getItem('pauloCell_devices');
      if (savedDevices) {
        const parsedDevices = JSON.parse(savedDevices);
        setDevices(parsedDevices);
        console.log(`📊 Dispositivos carregados: ${parsedDevices.length}`, 
          parsedDevices.length > 0 ? parsedDevices[0] : 'Nenhum dispositivo');
      } else {
        console.log('⚠️ Nenhum dispositivo encontrado no localStorage');
        setDevices([]);
      }

      // Load customers
      const savedCustomers = localStorage.getItem('pauloCell_customers');
      if (savedCustomers) {
        const parsedCustomers = JSON.parse(savedCustomers);
        setCustomers(parsedCustomers);
        console.log(`📊 Clientes carregados: ${parsedCustomers.length}`, 
          parsedCustomers.length > 0 ? parsedCustomers[0] : 'Nenhum cliente');
      } else {
        console.log('⚠️ Nenhum cliente encontrado no localStorage');
        setCustomers([]);
      }

      // Load inventory
      const savedInventory = localStorage.getItem('pauloCell_inventory');
      if (savedInventory) {
        const parsedInventory = JSON.parse(savedInventory);
        setInventory(parsedInventory);
        console.log(`📊 Itens de inventário carregados: ${parsedInventory.length}`, 
          parsedInventory.length > 0 ? parsedInventory[0] : 'Nenhum item');
      } else {
        console.log('⚠️ Nenhum item de inventário encontrado no localStorage');
        setInventory([]);
      }
      
      // Log para debug de outras chaves relevantes
      console.log('🔍 Todas as chaves do localStorage:', 
        Object.keys(localStorage).filter(key => key.startsWith('pauloCell_')));
        
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados para relatórios');
    }
  };

  // Generate random data for demonstration purposes ONLY if data wasn't reset
  const getRandomData = (count: number, min: number, max: number) => {
    if (dataWasReset) {
      return Array(count).fill(0); // Retorna zeros se os dados foram resetados
    }
    return Array(count).fill(0).map(() => Math.floor(min + Math.random() * (max - min)));
  };

  // Sample data for various charts - modificadas para respeitar flag de reset
  const generateSalesData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const weeks = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    const quarters = ['1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre'];
    
    if (dataWasReset) {
      // Se foi resetado, retornar dados zerados
      switch (periodFilter) {
        case 'week':
          return weeks.map((week) => ({
            name: week,
            Serviços: 0,
            Peças: 0
          }));
        case 'month':
          return months.map((month) => ({
            name: month,
            Serviços: 0,
            Peças: 0
          }));
        case 'quarter':
          return quarters.map((quarter) => ({
            name: quarter,
            Serviços: 0,
            Peças: 0
          }));
        case 'year':
          return ['2022', '2023', '2024'].map((year) => ({
            name: year,
            Serviços: 0,
            Peças: 0
          }));
        default:
          return [];
      }
    }
    
    // Se não foi resetado, comportamento normal
    switch (periodFilter) {
      case 'week':
        return weeks.map((week, index) => ({
          name: week,
          Serviços: getRandomData(1, 10, 30)[0],
          Peças: getRandomData(1, 5, 20)[0]
        }));
      case 'month':
        return months.map((month, index) => ({
          name: month,
          Serviços: getRandomData(1, 20, 50)[0],
          Peças: getRandomData(1, 10, 40)[0]
        }));
      case 'quarter':
        return quarters.map((quarter, index) => ({
          name: quarter,
          Serviços: getRandomData(1, 50, 120)[0],
          Peças: getRandomData(1, 30, 100)[0]
        }));
      case 'year':
        return ['2022', '2023', '2024'].map((year) => ({
          name: year,
          Serviços: getRandomData(1, 200, 500)[0],
          Peças: getRandomData(1, 150, 400)[0]
        }));
      default:
        return [];
    }
  };

  // Função para detectar o tipo de dispositivo com mais flexibilidade
  const getDeviceType = (device: any) => {
    if (!device) return null;
    
    // Verificar várias possíveis propriedades e valores
    const typeField = device.type || device.deviceType || device.categoria || '';
    const nameField = device.name || device.nome || device.description || device.descricao || '';
    const modelField = device.model || device.modelo || '';
    
    // Converter para minúsculas para melhor comparação
    const typeLower = String(typeField).toLowerCase();
    const nameLower = String(nameField).toLowerCase();
    const modelLower = String(modelField).toLowerCase();
    
    // Detectar tipo por várias palavras-chave
    if (typeLower.includes('cell') || typeLower.includes('celular') || 
        nameLower.includes('celular') || nameLower.includes('smartphone') ||
        typeLower === 'phone' || typeLower === 'mobile') {
      return 'cellphone';
    }
    
    if (typeLower.includes('tablet') || nameLower.includes('tablet') || 
        typeLower === 'tab' || typeLower === 'ipad') {
      return 'tablet';
    }
    
    if (typeLower.includes('note') || typeLower.includes('laptop') || 
        nameLower.includes('notebook') || nameLower.includes('laptop')) {
      return 'notebook';
    }
    
    // Se não conseguiu identificar, retorna o tipo original ou null
    return typeField || null;
  };

  // Função para detectar a marca do dispositivo com mais flexibilidade
  const getDeviceBrand = (device: any) => {
    if (!device) return null;
    
    // Verificar várias possíveis propriedades
    const brandField = device.brand || device.marca || device.manufacturer || device.fabricante || '';
    const nameField = device.name || device.nome || device.description || device.descricao || '';
    const modelField = device.model || device.modelo || '';
    
    // Converter para minúsculas para melhor comparação
    const brandLower = String(brandField).toLowerCase();
    const nameLower = String(nameField).toLowerCase();
    const modelLower = String(modelField).toLowerCase();
    
    // Lista de marcas comuns para verificar
    const brandKeywords = {
      'apple': ['apple', 'iphone', 'ipad', 'macbook'],
      'samsung': ['samsung', 'galaxy'],
      'xiaomi': ['xiaomi', 'redmi', 'poco'],
      'motorola': ['motorola', 'moto'],
      'lg': ['lg'],
      'huawei': ['huawei'],
      'nokia': ['nokia'],
      'sony': ['sony', 'xperia'],
      'asus': ['asus', 'zenfone']
    };
    
    // Verificar todas as palavras-chave
    for (const [brand, keywords] of Object.entries(brandKeywords)) {
      for (const keyword of keywords) {
        if (brandLower.includes(keyword) || nameLower.includes(keyword) || modelLower.includes(keyword)) {
          return brand;
        }
      }
    }
    
    // Se não conseguiu identificar, retorna a marca original ou null
    return brandField || null;
  };

  // Função para detectar o status do dispositivo com mais flexibilidade
  const getDeviceStatus = (device: any) => {
    if (!device) return null;
    
    // Verificar várias possíveis propriedades
    const statusField = device.status || device.condition || device.estado || '';
    const descField = device.description || device.descricao || device.notes || device.obs || '';
    
    // Converter para minúsculas para melhor comparação
    const statusLower = String(statusField).toLowerCase();
    const descLower = String(descField).toLowerCase();
    
    // Palavras-chave para cada status
    const goodKeywords = ['bom', 'good', 'ok', 'ótimo', 'excelente', 'perfeito', 'novo'];
    const issueKeywords = ['problema', 'issue', 'leve', 'pequeno', 'médio', 'medio', 'reparável', 'reparavel'];
    const criticalKeywords = ['crítico', 'critico', 'grave', 'critical', 'urgente', 'quebrado', 'danificado'];
    
    // Verificar por palavras-chave
    for (const keyword of goodKeywords) {
      if (statusLower.includes(keyword) || descLower.includes(keyword)) {
        return 'good';
      }
    }
    
    for (const keyword of issueKeywords) {
      if (statusLower.includes(keyword) || descLower.includes(keyword)) {
        return 'issue';
      }
    }
    
    for (const keyword of criticalKeywords) {
      if (statusLower.includes(keyword) || descLower.includes(keyword)) {
        return 'critical';
      }
    }
    
    // Se não conseguiu identificar, retorna o status original ou null
    return statusField || null;
  };

  // Atualizar a função generateDeviceTypeData para usar os dados reais
  const generateDeviceTypeData = () => {
    // Se os dados foram resetados, retorna valores zerados
    if (dataWasReset) {
      return [
        { name: 'Celular', value: 0 },
        { name: 'Tablet', value: 0 },
        { name: 'Notebook', value: 0 },
      ];
    }
    
    // Se não há dispositivos reais, mostrar uma mensagem e retornar valores zerados
    if (!devices.length) {
      console.log('⚠️ Sem dispositivos reais para o gráfico de tipos');
      return [
        { name: 'Celular', value: 0 },
        { name: 'Tablet', value: 0 },
        { name: 'Notebook', value: 0 },
      ];
    }
    
    console.log('🔍 Analisando tipos de dispositivos com dados reais...');
    
    // Contar os tipos de dispositivos com a função melhorada
    const cellphoneCount = devices.filter(d => getDeviceType(d) === 'cellphone').length;
    const tabletCount = devices.filter(d => getDeviceType(d) === 'tablet').length;
    const notebookCount = devices.filter(d => getDeviceType(d) === 'notebook').length;
    
    console.log(`📱 Contagem real: Celulares=${cellphoneCount}, Tablets=${tabletCount}, Notebooks=${notebookCount}`);
    
    // Criar array de dados para o gráfico
    const deviceTypes = [
      { name: 'Celular', value: cellphoneCount },
      { name: 'Tablet', value: tabletCount },
      { name: 'Notebook', value: notebookCount },
    ];
    
    return deviceTypes;
  };

  // Atualizar a função generateDeviceStatusData para usar os dados reais
  const generateDeviceStatusData = () => {
    // Se os dados foram resetados, retorna valores zerados
    if (dataWasReset) {
      return [
        { name: 'Bom Estado', value: 0 },
        { name: 'Problemas Leves', value: 0 },
        { name: 'Problemas Críticos', value: 0 },
      ];
    }
    
    // Se não há dispositivos reais, mostrar uma mensagem e retornar valores zerados
    if (!devices.length) {
      console.log('⚠️ Sem dispositivos reais para o gráfico de status');
      return [
        { name: 'Bom Estado', value: 0 },
        { name: 'Problemas Leves', value: 0 },
        { name: 'Problemas Críticos', value: 0 },
      ];
    }
    
    console.log('🔍 Analisando status de dispositivos com dados reais...');
    
    // Contar os status de dispositivos com a função melhorada
    const goodCount = devices.filter(d => getDeviceStatus(d) === 'good').length;
    const issueCount = devices.filter(d => getDeviceStatus(d) === 'issue').length;
    const criticalCount = devices.filter(d => getDeviceStatus(d) === 'critical').length;
    
    console.log(`📱 Contagem real: Bom Estado=${goodCount}, Problemas Leves=${issueCount}, Problemas Críticos=${criticalCount}`);
    
    // Criar array de dados para o gráfico
    const statusTypes = [
      { name: 'Bom Estado', value: goodCount },
      { name: 'Problemas Leves', value: issueCount },
      { name: 'Problemas Críticos', value: criticalCount },
    ];
    
    return statusTypes;
  };

  // Atualizar a função generateDeviceBrandData para usar os dados reais
  const generateDeviceBrandData = () => {
    // Se os dados foram resetados, retorna valores zerados
    if (dataWasReset) {
      return [
        { name: 'Apple', value: 0 },
        { name: 'Samsung', value: 0 },
        { name: 'Xiaomi', value: 0 },
        { name: 'Motorola', value: 0 },
        { name: 'LG', value: 0 },
        { name: 'Outros', value: 0 },
      ];
    }
    
    // Se não há dispositivos reais, mostrar uma mensagem e retornar valores zerados
    if (!devices.length) {
      console.log('⚠️ Sem dispositivos reais para o gráfico de marcas');
      return [
        { name: 'Apple', value: 0 },
        { name: 'Samsung', value: 0 },
        { name: 'Xiaomi', value: 0 },
        { name: 'Motorola', value: 0 },
        { name: 'LG', value: 0 },
        { name: 'Outros', value: 0 },
      ];
    }
    
    console.log('🔍 Analisando marcas de dispositivos com dados reais...');
    
    // Contar as marcas de dispositivos com a função melhorada
    const appleCount = devices.filter(d => getDeviceBrand(d) === 'apple').length;
    const samsungCount = devices.filter(d => getDeviceBrand(d) === 'samsung').length;
    const xiaomiCount = devices.filter(d => getDeviceBrand(d) === 'xiaomi').length;
    const motorolaCount = devices.filter(d => getDeviceBrand(d) === 'motorola').length;
    const lgCount = devices.filter(d => getDeviceBrand(d) === 'lg').length;
    const otherCount = devices.filter(d => {
      const brand = getDeviceBrand(d);
      return brand && !['apple', 'samsung', 'xiaomi', 'motorola', 'lg'].includes(brand);
    }).length;
    
    console.log(`📱 Contagem real: Apple=${appleCount}, Samsung=${samsungCount}, Xiaomi=${xiaomiCount}, Motorola=${motorolaCount}, LG=${lgCount}, Outros=${otherCount}`);
    
    // Criar array de dados para o gráfico
    return [
      { name: 'Apple', value: appleCount },
      { name: 'Samsung', value: samsungCount },
      { name: 'Xiaomi', value: xiaomiCount },
      { name: 'Motorola', value: motorolaCount },
      { name: 'LG', value: lgCount },
      { name: 'Outros', value: otherCount },
    ];
  };

  // Função para detectar o status do serviço com mais flexibilidade
  const getServiceStatus = (service: any) => {
    if (!service) return null;
    
    // Verificar várias possíveis propriedades
    const statusField = service.status || service.estado || '';
    const descField = service.description || service.descricao || service.notes || service.obs || '';
    
    // Converter para minúsculas para melhor comparação
    const statusLower = String(statusField).toLowerCase();
    const descLower = String(descField).toLowerCase();
    
    // Mapeamento de status
    const statusMap: Record<string, string[]> = {
      'pending': ['pendente', 'aguardando', 'espera', 'pending', 'wait', 'waiting'],
      'in-progress': ['em andamento', 'progresso', 'in-progress', 'in progress', 'working'],
      'completed': ['concluído', 'concluido', 'completed', 'done', 'pronto', 'finalizado'],
      'delivered': ['entregue', 'delivered', 'entrega', 'devolvido'],
      'cancelled': ['cancelado', 'cancelled', 'canceled', 'desistiu']
    };
    
    // Verificar cada status possível
    for (const [status, keywords] of Object.entries(statusMap)) {
      for (const keyword of keywords) {
        if (statusLower.includes(keyword) || descLower.includes(keyword)) {
          return status;
        }
      }
    }
    
    // Se não conseguiu identificar, retorna o status original ou null
    return statusField || null;
  };

  // Atualizar a função generateServiceStatusData para usar os dados reais
  const generateServiceStatusData = () => {
    // Se os dados foram resetados, retorna valores zerados
    if (dataWasReset) {
      return [
        { name: 'Em espera', value: 0 },
        { name: 'Em andamento', value: 0 },
        { name: 'Concluídos', value: 0 },
        { name: 'Entregues', value: 0 },
        { name: 'Cancelados', value: 0 },
      ];
    }
    
    // Se não há serviços reais, mostrar uma mensagem e retornar valores zerados
    if (!services.length) {
      console.log('⚠️ Sem serviços reais para o gráfico de status');
      return [
        { name: 'Em espera', value: 0 },
        { name: 'Em andamento', value: 0 },
        { name: 'Concluídos', value: 0 },
        { name: 'Entregues', value: 0 },
        { name: 'Cancelados', value: 0 },
      ];
    }
    
    console.log('🔍 Analisando status de serviços com dados reais...');
    
    // Contar os status de serviços com a função melhorada
    const pendingCount = services.filter(s => getServiceStatus(s) === 'pending').length;
    const inProgressCount = services.filter(s => getServiceStatus(s) === 'in-progress').length;
    const completedCount = services.filter(s => getServiceStatus(s) === 'completed').length;
    const deliveredCount = services.filter(s => getServiceStatus(s) === 'delivered').length;
    const cancelledCount = services.filter(s => getServiceStatus(s) === 'cancelled').length;
    
    console.log(`🔧 Contagem real: Em espera=${pendingCount}, Em andamento=${inProgressCount}, Concluídos=${completedCount}, Entregues=${deliveredCount}, Cancelados=${cancelledCount}`);
    
    // Criar array de dados para o gráfico
    return [
      { name: 'Em espera', value: pendingCount },
      { name: 'Em andamento', value: inProgressCount },
      { name: 'Concluídos', value: completedCount },
      { name: 'Entregues', value: deliveredCount },
      { name: 'Cancelados', value: cancelledCount },
    ];
  };

  // Função para verificar se o cliente é uma empresa
  const isCustomerCompany = (customer: any) => {
    if (!customer) return false;
    
    // Verificar várias possíveis propriedades
    if (customer.isCompany === true || customer.isCompany === 'true') return true;
    if (customer.tipo === 'empresa' || customer.type === 'company') return true;
    
    // Verificar por CNPJ
    if (customer.cnpj && customer.cnpj.trim() !== '') return true;
    
    // Verificar por razão social ou nome fantasia
    if (customer.razaoSocial || customer.razao_social || customer.nomeFantasia || customer.nome_fantasia) return true;
    
    return false;
  };

  // Atualizar a função generateCustomerTypeData para usar os dados reais
  const generateCustomerTypeData = () => {
    // Se os dados foram resetados, retorna valores zerados
    if (dataWasReset) {
      return [
        { name: 'Pessoa Física', value: 0 },
        { name: 'Empresa', value: 0 },
      ];
    }
    
    // Se não há clientes reais, mostrar uma mensagem e retornar valores zerados
    if (!customers.length) {
      console.log('⚠️ Sem clientes reais para o gráfico de tipos');
      return [
        { name: 'Pessoa Física', value: 0 },
        { name: 'Empresa', value: 0 },
      ];
    }
    
    console.log('🔍 Analisando tipos de clientes com dados reais...');
    
    // Contar os tipos de clientes com a função melhorada
    const companyCount = customers.filter(c => isCustomerCompany(c)).length;
    const personCount = customers.filter(c => !isCustomerCompany(c)).length;
    
    console.log(`👥 Contagem real: Pessoa Física=${personCount}, Empresa=${companyCount}`);
    
    // Criar array de dados para o gráfico
    return [
      { name: 'Pessoa Física', value: personCount },
      { name: 'Empresa', value: companyCount },
    ];
  };

  const inventoryCategoryData = () => {
    // Se os dados foram resetados, retorna valores zerados
    if (dataWasReset) {
      return [
        { name: 'Tela', value: 0 },
        { name: 'Bateria', value: 0 },
        { name: 'Acessório', value: 0 },
        { name: 'Placa', value: 0 },
        { name: 'Outro', value: 0 },
      ];
    }
    
    const categories = {
      'Tela': inventory.filter(i => i.category === 'Tela').length || 7,
      'Bateria': inventory.filter(i => i.category === 'Bateria').length || 12,
      'Acessório': inventory.filter(i => i.category === 'Acessório').length || 8,
      'Placa': inventory.filter(i => i.category === 'Placa').length || 4,
      'Outro': inventory.filter(i => i.category === 'Outro' || !i.category).length || 3,
    };
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#D35400'];

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'week':
        return 'Semanal';
      case 'month':
        return 'Mensal';
      case 'quarter':
        return 'Trimestral';
      case 'year':
        return 'Anual';
      default:
        return 'Período';
    }
  };

  // Função para reinicializar estatísticas - atualizada e melhorada
  const handleResetStats = (visualOnly = true) => {
    try {
      // Mostrar um toast de que o processo está em andamento
      toast.info(visualOnly ? 
        'Reinicializando estatísticas visuais...' : 
        'Reinicializando todas as estatísticas...'
      );
      
      // Para tornar o código mais robusto, vamos importar e usar as funções diretamente
      if (visualOnly) {
        // Reinicialização de estatísticas visuais
        try {
          // Lista completa de chaves para garantir limpeza total
          const keysToReset = [
            'pauloCell_chartData',
            'pauloCell_reportData',
            'pauloCell_dashboard_stats',
            'pauloCell_monthlyStats',
            'pauloCell_deviceStats', 
            'pauloCell_serviceStats',
            'pauloCell_customerStats',
            'pauloCell_salesStats',
            'pauloCell_inventoryStats',
            'pauloCell_visuals',
            'pauloCell_report_cache'
          ];
          
          // Remover todas as chaves
          keysToReset.forEach(key => {
            localStorage.removeItem(key);
          });
          
          // Definir flag de dados resetados - agora não vai ser removida
          localStorage.setItem('pauloCell_data_reset_flag', 'true');
          setDataWasReset(true);
          
          console.log('Estatísticas visuais reinicializadas com sucesso!');
          toast.success('Estatísticas visuais reinicializadas com sucesso!');
          
          // Recarregar a página após um breve delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
        } catch (err) {
          console.error('Erro ao reinicializar estatísticas visuais:', err);
          toast.error('Erro ao reinicializar estatísticas visuais');
        }
      } else {
        // Reinicialização completa de estatísticas
        try {
          // Lista completa de chaves para garantir limpeza total
          const keysToReset = [
            'pauloCell_statistics',
            'pauloCell_monthlyStats',
            'pauloCell_reportData',
            'pauloCell_chartData',
            'pauloCell_deviceStats', 
            'pauloCell_serviceStats',
            'pauloCell_customerStats',
            'pauloCell_salesStats',
            'pauloCell_inventoryStats',
            'pauloCell_dashboard_stats',
            'pauloCell_report_cache',
            'pauloCell_visuals',
            'pauloCell_total_stats',
            'pauloCell_reports'
          ];

          // Dados zerados para inicializar
          const emptyStats = {
            devices: {
              byType: { tablet: 0, celular: 0, notebook: 0, outros: 0 },
              byStatus: { bomEstado: 0, problemasLeves: 0, problemasCriticos: 0 },
              byBrand: { Apple: 0, Samsung: 0, Xiaomi: 0, Motorola: 0, LG: 0, Outros: 0 }
            },
            services: {
              byStatus: { emAndamento: 0, aguardandoPecas: 0, concluidos: 0, cancelados: 0, entregues: 0 },
              byType: { trocaTela: 0, trocaBateria: 0, reparoPlaca: 0, conectorCarga: 0, outros: 0 },
              avgTime: { trocaTela: 0, trocaBateria: 0, reparoPlaca: 0, conectorCarga: 0, diagnostico: 0 }
            },
            customers: {
              byType: { pessoaFisica: 0, empresa: 0 },
              distribution: { tela: 0, bateria: 0, acessorio: 0, placa: 0, outro: 0 },
              monthly: { jan: 0, fev: 0, mar: 0, abr: 0, mai: 0, jun: 0, jul: 0, ago: 0, set: 0, out: 0, nov: 0, dez: 0 }
            },
            sales: {
              monthly: {
                services: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                parts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                total: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
              },
              total: { value: 0, growth: 0 },
              services: { value: 0, growth: 0 },
              parts: { value: 0, growth: 0 }
            }
          };

          // Remover chaves existentes
          keysToReset.forEach(key => {
            localStorage.removeItem(key);
          });

          // Inicializar com dados zerados
          localStorage.setItem('pauloCell_statistics', JSON.stringify(emptyStats));

          // Definir flag de dados resetados - agora não vai ser removida
          localStorage.setItem('pauloCell_data_reset_flag', 'true');
          setDataWasReset(true);
          
          // Remover possíveis dados cache
          localStorage.removeItem('pauloCell_cache');
          
          console.log('Todas as estatísticas foram reinicializadas com sucesso!');
          toast.success('Todas as estatísticas reinicializadas com sucesso!');
          
          // Recarregar a página após um breve delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
        } catch (err) {
          console.error('Erro ao reinicializar todas as estatísticas:', err);
          toast.error('Erro ao reinicializar todas as estatísticas');
        }
      }
    } catch (error) {
      console.error('Erro ao reinicializar estatísticas:', error);
      toast.error('Erro ao reinicializar estatísticas');
    }
  };

  // Adicionar função para gerar dados de tempo médio por serviço
  const generateServiceTimeData = () => {
    // Se os dados foram resetados, retorna valores zerados
    if (dataWasReset) {
      return [
        { name: 'Troca de Tela', value: 0 },
        { name: 'Troca de Bateria', value: 0 },
        { name: 'Reparo de Placa', value: 0 },
        { name: 'Conector de Carga', value: 0 },
        { name: 'Diagnóstico', value: 0 },
      ];
    }
    
    return [
      { name: 'Troca de Tela', value: 2 },
      { name: 'Troca de Bateria', value: 1 },
      { name: 'Reparo de Placa', value: 4 },
      { name: 'Conector de Carga', value: 1.5 },
      { name: 'Diagnóstico', value: 1 },
    ];
  };
  
  // Adicionar função para gerar dados de faturamento por tipo de serviço
  const generateServiceRevenueData = () => {
    // Se os dados foram resetados, retorna valores zerados
    if (dataWasReset) {
      return [
        { name: 'Troca de Tela', value: 0 },
        { name: 'Troca de Bateria', value: 0 },
        { name: 'Reparo de Placa', value: 0 },
        { name: 'Conector de Carga', value: 0 },
        { name: 'Software', value: 0 },
        { name: 'Outros', value: 0 },
      ];
    }
    
    return [
      { name: 'Troca de Tela', value: 4500 },
      { name: 'Troca de Bateria', value: 2200 },
      { name: 'Reparo de Placa', value: 3800 },
      { name: 'Conector de Carga', value: 1800 },
      { name: 'Software', value: 900 },
      { name: 'Outros', value: 1200 },
    ];
  };

  // Adicionar função para gerar dados de novos clientes
  const generateNewCustomersData = () => {
    // Se os dados foram resetados, retorna valores zerados
    if (dataWasReset) {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const weeks = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
      const quarters = ['1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre'];
      
      switch (periodFilter) {
        case 'week':
          return weeks.map((week) => ({
            name: week,
            'Novos Clientes': 0
          }));
        case 'month':
          return months.map((month) => ({
            name: month,
            'Novos Clientes': 0
          }));
        case 'quarter':
          return quarters.map((quarter) => ({
            name: quarter,
            'Novos Clientes': 0
          }));
        case 'year':
          return ['2022', '2023', '2024'].map((year) => ({
            name: year,
            'Novos Clientes': 0
          }));
        default:
          return [];
      }
    }
    
    // Se não foi resetado, podemos usar os dados de vendas que já têm o formato certo
    return generateSalesData();
  };

  // Função para calcular o valor total do faturamento
  const calculateTotalRevenue = () => {
    if (dataWasReset) {
      return '0.00';
    }
    const servicesTotal = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    const inventoryTotal = inventory.reduce((sum, i) => sum + ((Number(i.price) || 0) * (Number(i.soldQuantity) || 0)), 0);
    return (servicesTotal + inventoryTotal).toFixed(2);
  };
  
  // Função para calcular o valor total dos serviços
  const calculateServicesRevenue = () => {
    if (dataWasReset) {
      return '0.00';
    }
    return services.reduce((sum, s) => sum + (Number(s.price) || 0), 0).toFixed(2);
  };
  
  // Função para calcular o valor total das peças
  const calculatePartsRevenue = () => {
    if (dataWasReset) {
      return '0.00';
    }
    return inventory.reduce((sum, i) => sum + ((Number(i.price) || 0) * (Number(i.soldQuantity) || 0)), 0).toFixed(2);
  };

  // Adicionar uma função para restaurar os dados de demonstração
  const handleRestoreDemo = () => {
    try {
      toast.info('Restaurando dados de demonstração...');
      
      // Remover a flag de reset para permitir que os dados de demonstração apareçam
      localStorage.removeItem('pauloCell_data_reset_flag');
      setDataWasReset(false);
      
      console.log('Dados de demonstração restaurados com sucesso!');
      toast.success('Dados de demonstração restaurados com sucesso!');
      
      // Recarregar a página após um breve delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erro ao restaurar dados de demonstração:', error);
      toast.error('Erro ao restaurar dados de demonstração');
    }
  };

  // Adicionar um mecanismo para atualizar manualmente os relatórios
  const handleRefreshReports = () => {
    toast.info('Atualizando relatórios...');
    loadData();
    toast.success('Relatórios atualizados com sucesso!');
  };

  // Toggle para atualização automática
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Função auxiliar para traduzir tipos de entidade para o português
  const translateEntityType = (type: string): string => {
    const translations: Record<string, string> = {
      customer: 'cliente',
      device: 'dispositivo',
      service: 'serviço',
      inventory: 'estoque',
      report: 'relatório'
    };
    
    return translations[type] || type;
  };

  return (
    <MainLayout>
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground">Métricas e estatísticas da sua assistência técnica</p>
          </div>
          
          <div className="flex gap-2">
            <div className="flex items-center">
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <CalendarIcon size={16} className="mr-2" />
                    <SelectValue placeholder="Selecione o período" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semanal</SelectItem>
                  <SelectItem value="month">Mensal</SelectItem>
                  <SelectItem value="quarter">Trimestral</SelectItem>
                  <SelectItem value="year">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant={autoRefresh ? "default" : "outline"} 
              className="flex items-center gap-1"
              onClick={toggleAutoRefresh}
              title={autoRefresh ? "Desativar atualização automática" : "Ativar atualização automática"}
            >
              <RefreshCwIcon size={16} className={autoRefresh ? "animate-spin" : ""} />
              {autoRefresh ? "Ao vivo" : ""}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Settings2 size={16} />
                  Opções
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Opções de Relatório</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleRefreshReports}>
                  <RefreshCwIcon size={16} className="mr-2" />
                  Atualizar Relatórios
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleResetStats(true)}>
                  <RotateCcw size={16} className="mr-2" />
                  Reiniciar Estatísticas Visuais
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleResetStats(false)}>
                  <RefreshCcw size={16} className="mr-2" />
                  Reiniciar Todas as Estatísticas
                </DropdownMenuItem>
                {dataWasReset && (
                  <DropdownMenuItem onClick={handleRestoreDemo}>
                    <BarChart3 size={16} className="mr-2" />
                    Restaurar Dados de Demonstração
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 sm:grid-cols-4 w-full">
            <TabsTrigger value="sales" className="flex gap-1">
              <LineChartIcon size={16} /> <span className="hidden sm:inline">Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex gap-1">
              <BarChart2Icon size={16} /> <span className="hidden sm:inline">Dispositivos</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex gap-1">
              <PieChartIcon size={16} /> <span className="hidden sm:inline">Serviços</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex gap-1">
              <PieChartIcon size={16} /> <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Faturamento {getPeriodLabel()}</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={generateSalesData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value}`, undefined]} />
                    <Legend />
                    <Bar dataKey="Serviços" fill="#8884d8" />
                    <Bar dataKey="Peças" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Faturamento Total</h3>
                <p className="text-3xl font-bold">R$ {calculateTotalRevenue()}</p>
                <p className="text-sm text-muted-foreground">{dataWasReset ? '0%' : '+12%'} em relação ao período anterior</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Serviços</h3>
                <p className="text-3xl font-bold">R$ {calculateServicesRevenue()}</p>
                <p className="text-sm text-muted-foreground">{dataWasReset ? '0%' : '+8%'} em relação ao período anterior</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Peças</h3>
                <p className="text-3xl font-bold">R$ {calculatePartsRevenue()}</p>
                <p className="text-sm text-muted-foreground">{dataWasReset ? '0%' : '+15%'} em relação ao período anterior</p>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="devices" className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Dispositivos por Tipo</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={generateDeviceTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {generateDeviceTypeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} unid.`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Dispositivos por Status</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={generateDeviceStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {generateDeviceStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} unid.`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card className="p-6 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Dispositivos por Marca</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={generateDeviceBrandData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} unidades`, 'Quantidade']} />
                    <Bar dataKey="value" fill="#8884d8" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="services" className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Serviços por Status</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={generateServiceStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {generateServiceStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} serviços`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Tempo Médio por Serviço</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={generateServiceTimeData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} dias`, 'Tempo Médio']} />
                    <Bar dataKey="value" fill="#82ca9d" name="Tempo Médio (dias)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card className="p-6 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Faturamento por Tipo de Serviço</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={generateServiceRevenueData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value}`, 'Faturamento']} />
                    <Bar dataKey="value" fill="#8884d8" name="Faturamento (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="customers" className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Clientes por Tipo</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={generateCustomerTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {generateCustomerTypeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} clientes`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Distribuição de Clientes</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {inventoryCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} itens`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card className="p-6 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Novos Clientes ({getPeriodLabel()})</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={generateNewCustomersData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Serviços" fill="#8884d8" name="Novos Clientes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </MainLayout>
  );
};

export default Reports;
