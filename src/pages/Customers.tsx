import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  SearchIcon, 
  PlusIcon, 
  FilterIcon,
  ChevronDownIcon,
  DownloadIcon,
  XIcon,
  RefreshCcwIcon,
  UserIcon,
  TrashIcon
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import CustomerCard from '@/components/ui/CustomerCard';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/export-utils";

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const navigate = useNavigate();
  
  // Load customers from localStorage on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    try {
      const savedCustomers = localStorage.getItem('pauloCell_customers');
      if (savedCustomers) {
        const parsedCustomers = JSON.parse(savedCustomers);
        setCustomers(parsedCustomers);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Erro ao carregar clientes');
      setCustomers([]);
    }
  };
  
  const handleFilterToggle = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };
  
  const clearFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
  };
  
  const applyFilters = (customerList: any[]) => {
    // First apply search term
    let filtered = customerList.filter(customer => 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
    );
    
    // Then apply active filters
    if (activeFilters.includes('companies')) {
      filtered = filtered.filter(customer => customer.isCompany);
    }
    
    if (activeFilters.includes('individuals')) {
      filtered = filtered.filter(customer => !customer.isCompany);
    }
    
    return filtered;
  };
  
  const filteredCustomers = applyFilters(customers);
  
  const handleCustomerClick = (id: string) => {
    navigate(`/customers/${id}`);
  };
  
  const handleRefresh = () => {
    loadCustomers();
    toast.success('Lista de clientes atualizada!');
  };
  
  const handleCustomerDeleted = () => {
    // Reload the customers list when a customer is deleted
    loadCustomers();
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
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">Gerencie os clientes da sua loja</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/trash-bin')}>
              <TrashIcon size={16} />
              <span className="hidden sm:inline">Lixeira</span>
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleRefresh}>
              <RefreshCcwIcon size={16} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button className="gap-2" onClick={() => navigate('/customers/new')}>
              <PlusIcon size={16} />
              <span>Novo Cliente</span>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-[280px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FilterIcon size={16} />
                  <span>Filtrar</span>
                  <ChevronDownIcon size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => handleFilterToggle('companies')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Empresas</span>
                    {activeFilters.includes('companies') && <Badge className="ml-auto">Ativo</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterToggle('individuals')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Pessoas Físicas</span>
                    {activeFilters.includes('individuals') && <Badge className="ml-auto">Ativo</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearFilters}>
                    <XIcon className="mr-2 h-4 w-4" />
                    <span>Limpar Filtros</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(filter => (
              <Badge key={filter} variant="outline" className="flex items-center gap-1 px-3 py-1">
                {filter === 'companies' ? 'Empresas' : 'Pessoas Físicas'}
                <XIcon size={14} className="cursor-pointer" onClick={() => handleFilterToggle(filter)} />
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7">
              Limpar filtros
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer, idx) => (
              <div key={customer.id} onClick={() => handleCustomerClick(customer.id)} className="cursor-pointer">
                <CustomerCard customer={customer} index={idx} onDelete={handleCustomerDeleted} />
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center h-60 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground mb-4">Nenhum cliente cadastrado</p>
              <Button onClick={() => navigate('/customers/new')}>Cadastrar Novo Cliente</Button>
            </div>
          )}
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default Customers;
