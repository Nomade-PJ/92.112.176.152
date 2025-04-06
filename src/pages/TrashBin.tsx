import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  SearchIcon, 
  RefreshCcwIcon,
  TrashIcon,
  RotateCcwIcon,
  AlertCircleIcon,
  ArrowLeftIcon
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from "sonner";
import { 
  getDeletedCustomers, 
  restoreCustomerFromTrash, 
  permanentlyDeleteCustomer 
} from "@/lib/trash-utils";
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

const TrashBin: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletedCustomers, setDeletedCustomers] = useState<any[]>([]);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Load deleted customers from localStorage on component mount
  useEffect(() => {
    loadDeletedCustomers();
  }, []);

  const loadDeletedCustomers = () => {
    try {
      const customers = getDeletedCustomers();
      setDeletedCustomers(customers);
    } catch (error) {
      console.error('Error loading deleted customers:', error);
      toast.error('Erro ao carregar clientes excluídos');
      setDeletedCustomers([]);
    }
  };
  
  const handleRestore = (customerId: string) => {
    try {
      const success = restoreCustomerFromTrash(customerId);
      if (success) {
        loadDeletedCustomers(); // Refresh the list
        toast.success('Cliente restaurado com sucesso');
      } else {
        toast.error('Erro ao restaurar cliente');
      }
    } catch (error) {
      console.error('Error restoring customer:', error);
      toast.error('Erro ao restaurar cliente');
    }
  };
  
  const handlePermanentDelete = () => {
    if (!customerToDelete) return;
    
    try {
      const success = permanentlyDeleteCustomer(customerToDelete);
      if (success) {
        loadDeletedCustomers(); // Refresh the list
        toast.success('Cliente excluído permanentemente');
      } else {
        toast.error('Erro ao excluir cliente permanentemente');
      }
    } catch (error) {
      console.error('Error permanently deleting customer:', error);
      toast.error('Erro ao excluir cliente permanentemente');
    } finally {
      setCustomerToDelete(null); // Close the dialog
    }
  };

  const handleRefresh = () => {
    loadDeletedCustomers();
    toast.success('Lista de clientes excluídos atualizada!');
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return 'N/A';
    }
  };
  
  // Calculate and format expiration date (60 days after deletion)
  const formatExpirationDate = (deletedAtString?: string) => {
    if (!deletedAtString) return 'N/A';
    try {
      const deletedAt = new Date(deletedAtString);
      const expirationDate = new Date(deletedAt.getTime() + (60 * 24 * 60 * 60 * 1000)); // 60 days in milliseconds
      return expirationDate.toLocaleDateString('pt-BR');
    } catch (e) {
      return 'N/A';
    }
  };
  
  // Filter customers based on search term
  const filteredCustomers = deletedCustomers.filter(customer => 
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );
  
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
          <div>
            <h1 className="text-2xl font-bold">Lixeira</h1>
            <p className="text-muted-foreground">Clientes excluídos temporariamente</p>
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
          
          <Button variant="outline" className="gap-2" onClick={handleRefresh}>
            <RefreshCcwIcon size={16} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer, idx) => (
              <motion.div 
                key={customer.id}
                className="bg-card rounded-xl border border-border p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                      {customer.avatar ? (
                        <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        customer.name?.slice(0, 2).toUpperCase() || 'CL'
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium">{customer.name || 'Cliente'}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        {customer.phone && (
                          <div className="text-sm text-muted-foreground">
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="text-sm text-muted-foreground">
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 mt-3 text-xs">
                  <div className="px-2.5 py-1 rounded-full bg-muted">
                    Excluído em: <span className="font-medium">{formatDate(customer.deletedAt)}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                    Exclusão automática em: <span className="font-medium">{formatExpirationDate(customer.deletedAt)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1 flex-1"
                    onClick={() => handleRestore(customer.id)}
                  >
                    <RotateCcwIcon size={14} />
                    <span>Restaurar</span>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="gap-1 flex-1"
                    onClick={() => setCustomerToDelete(customer.id)}
                  >
                    <TrashIcon size={14} />
                    <span>Excluir</span>
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center h-60 bg-muted/50 rounded-lg">
              <TrashIcon size={24} className="text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-4">Nenhum cliente na lixeira</p>
              <Button onClick={() => navigate('/customers')}>Voltar para Clientes</Button>
            </div>
          )}
        </div>
      </motion.div>
      
      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente será excluído permanentemente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default TrashBin;