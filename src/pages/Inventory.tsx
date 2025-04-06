import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  SearchIcon, 
  PlusIcon, 
  FilterIcon,
  ChevronDownIcon,
  DownloadIcon,
  AlertCircleIcon,
  ShieldAlertIcon,
  CheckIcon,
  XIcon,
  TagIcon,
  BoxIcon,
  RefreshCwIcon,
  PenIcon,
  TrashIcon
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/export-utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<string>('all');
  const navigate = useNavigate();
  
  // Modal states
  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    sku: '',
    category: '',
    compatibility: '',
    price: '',
    currentStock: '',
    minimumStock: '',
    lastPurchase: new Date().toLocaleDateString('pt-BR')
  });
  
  // Load inventory items from localStorage on component mount
  useEffect(() => {
    loadInventoryItems();
  }, []);

  const loadInventoryItems = () => {
    const savedInventory = localStorage.getItem('pauloCell_inventory');
    if (savedInventory) {
      setInventoryItems(JSON.parse(savedInventory));
    }
  };

  // Save inventory items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pauloCell_inventory', JSON.stringify(inventoryItems));
  }, [inventoryItems]);
  
  const handleFilterToggle = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };
  
  const clearFilters = () => {
    setActiveFilters([]);
    setStockFilter('all');
    setSearchTerm('');
  };
  
  const applyFilters = (itemList: any[]) => {
    // First apply search term
    let filtered = itemList.filter(item => 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.compatibility?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Then apply stock filter
    if (stockFilter === 'critical') {
      filtered = filtered.filter(item => {
        const currentStock = Number(item.currentStock) || 0;
        return currentStock === 0;
      });
    } else if (stockFilter === 'low') {
      filtered = filtered.filter(item => {
        const currentStock = Number(item.currentStock) || 0;
        const minimumStock = Number(item.minimumStock) || 0;
        return currentStock > 0 && currentStock < minimumStock;
      });
    } else if (stockFilter === 'ok') {
      filtered = filtered.filter(item => {
        const currentStock = Number(item.currentStock) || 0;
        const minimumStock = Number(item.minimumStock) || 0;
        return currentStock >= minimumStock && minimumStock > 0;
      });
    }
    
    // Then apply any additional filters
    if (activeFilters.includes('screens')) {
      filtered = filtered.filter(item => item.category === 'Tela');
    }
    
    if (activeFilters.includes('batteries')) {
      filtered = filtered.filter(item => item.category === 'Bateria');
    }
    
    if (activeFilters.includes('accessories')) {
      filtered = filtered.filter(item => item.category === 'Acessório');
    }
    
    return filtered;
  };
  
  const filteredItems = applyFilters(inventoryItems);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleNewItem = () => {
    // Reset form data
    setFormData({
      id: uuidv4(),
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: '',
      compatibility: '',
      price: '',
      currentStock: '',
      minimumStock: '5',
      lastPurchase: new Date().toLocaleDateString('pt-BR')
    });
    
    // Open the dialog
    setIsNewItemDialogOpen(true);
  };
  
  const handleSaveNewItem = () => {
    // Validate required fields
    if (!formData.name || !formData.category || !formData.currentStock) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    // Validar valores numéricos
    const currentStock = Number(formData.currentStock);
    const minimumStock = Number(formData.minimumStock);
    const price = Number(formData.price);
    
    if (isNaN(currentStock) || isNaN(minimumStock) || isNaN(price)) {
      toast.error("Os valores de estoque e preço devem ser números válidos.");
      return;
    }
    
    if (currentStock < 0 || minimumStock < 0 || price < 0) {
      toast.error("Os valores de estoque e preço não podem ser negativos.");
      return;
    }
    
    try {
      // Add the new item to inventory
      const newItem = {
        ...formData,
        price: price,
        currentStock: currentStock,
        minimumStock: minimumStock
      };
      
      setInventoryItems(prev => [newItem, ...prev]);
      
      // Close the dialog and show success message
      setIsNewItemDialogOpen(false);
      toast.success('Item adicionado ao estoque com sucesso!');
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast.error('Erro ao adicionar item ao estoque.');
    }
  };
  
  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setFormData({
      id: item.id,
      name: item.name || '',
      sku: item.sku || '',
      category: item.category || '',
      compatibility: item.compatibility || '',
      price: item.price?.toString() || '',
      currentStock: item.currentStock?.toString() || '',
      minimumStock: item.minimumStock?.toString() || '',
      lastPurchase: item.lastPurchase || new Date().toLocaleDateString('pt-BR')
    });
    setIsEditDialogOpen(true);
  };
  
  const handleSaveEditItem = () => {
    // Validate required fields
    if (!formData.name || !formData.category || !formData.currentStock) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    // Validar valores numéricos
    const currentStock = Number(formData.currentStock);
    const minimumStock = Number(formData.minimumStock);
    const price = Number(formData.price);
    
    if (isNaN(currentStock) || isNaN(minimumStock) || isNaN(price)) {
      toast.error("Os valores de estoque e preço devem ser números válidos.");
      return;
    }
    
    if (currentStock < 0 || minimumStock < 0 || price < 0) {
      toast.error("Os valores de estoque e preço não podem ser negativos.");
      return;
    }
    
    try {
      // Update the item in the inventory
      const updatedItems = inventoryItems.map(item => 
        item.id === formData.id ? {
          ...formData,
          price: price,
          currentStock: currentStock,
          minimumStock: minimumStock
        } : item
      );
      
      setInventoryItems(updatedItems);
      
      // Close the dialog and show success message
      setIsEditDialogOpen(false);
      toast.success('Item atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast.error('Erro ao atualizar item do estoque.');
    }
  };
  
  const handleDeletePrompt = (item: any) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (!selectedItem) return;
    
    try {
      // Remove the item from inventory
      const updatedItems = inventoryItems.filter(item => item.id !== selectedItem.id);
      setInventoryItems(updatedItems);
      
      // Close the dialog and show success message
      setIsDeleteDialogOpen(false);
      toast.success('Item removido do estoque com sucesso!');
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast.error('Erro ao remover item do estoque.');
    }
  };
  
  const exportInventory = (format: string) => {
    try {
      // Get the filtered inventory items to export
      const dataToExport = filteredItems;
      
      // Use the appropriate export function based on format
      switch (format.toLowerCase()) {
        case 'pdf':
          exportToPDF(dataToExport, 'Estoque');
          break;
        case 'excel':
          exportToExcel(dataToExport, 'Estoque');
          break;
        case 'csv':
          exportToCSV(dataToExport, 'Estoque');
          break;
        default:
          toast.error('Formato de exportação não suportado');
          return;
      }
      
      toast.success(`Estoque exportado em formato ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting inventory:', error);
      toast.error('Erro ao exportar estoque');
    }
  };
  
  const handleStockFilterChange = (status: string) => {
    setStockFilter(status);
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
            <h1 className="text-2xl font-bold">Estoque</h1>
            <p className="text-muted-foreground">Gerencie o estoque da sua assistência</p>
          </div>
          <Button className="gap-2" onClick={handleNewItem}>
            <PlusIcon size={16} />
            <span>Novo Item</span>
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar no estoque..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/50 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                  <DropdownMenuItem onClick={() => handleFilterToggle('screens')}>
                    <BoxIcon className="mr-2 h-4 w-4" />
                    <span>Telas</span>
                    {activeFilters.includes('screens') && <Badge className="ml-auto">Ativo</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterToggle('batteries')}>
                    <BoxIcon className="mr-2 h-4 w-4" />
                    <span>Baterias</span>
                    {activeFilters.includes('batteries') && <Badge className="ml-auto">Ativo</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterToggle('accessories')}>
                    <BoxIcon className="mr-2 h-4 w-4" />
                    <span>Acessórios</span>
                    {activeFilters.includes('accessories') && <Badge className="ml-auto">Ativo</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>
                    <XIcon className="mr-2 h-4 w-4" />
                    <span>Limpar Filtros</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4">
          <Button 
            variant={stockFilter === 'all' ? 'default' : 'outline'} 
            className="gap-2 whitespace-nowrap"
            onClick={() => handleStockFilterChange('all')}
          >
            <span>Todos os itens</span>
            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {inventoryItems.length}
            </span>
          </Button>
          <Button 
            variant={stockFilter === 'critical' ? 'default' : 'outline'} 
            className="gap-2 whitespace-nowrap"
            onClick={() => handleStockFilterChange('critical')}
          >
            <ShieldAlertIcon size={16} className="text-red-600" />
            <span>Estoque crítico</span>
            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {inventoryItems.filter(i => (Number(i.currentStock) || 0) === 0).length}
            </span>
          </Button>
          <Button 
            variant={stockFilter === 'low' ? 'default' : 'outline'} 
            className="gap-2 whitespace-nowrap"
            onClick={() => handleStockFilterChange('low')}
          >
            <AlertCircleIcon size={16} className="text-amber-500" />
            <span>Estoque baixo</span>
            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {inventoryItems.filter(i => {
                const currentStock = Number(i.currentStock) || 0;
                const minimumStock = Number(i.minimumStock) || 0;
                return currentStock > 0 && currentStock < minimumStock;
              }).length}
            </span>
          </Button>
          <Button 
            variant={stockFilter === 'ok' ? 'default' : 'outline'} 
            className="gap-2 whitespace-nowrap"
            onClick={() => handleStockFilterChange('ok')}
          >
            <CheckIcon size={16} className="text-green-600" />
            <span>Estoque adequado</span>
            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {inventoryItems.filter(i => {
                const currentStock = Number(i.currentStock) || 0;
                const minimumStock = Number(i.minimumStock) || 0;
                return currentStock >= minimumStock && minimumStock > 0;
              }).length}
            </span>
          </Button>
        </div>
        
        {(activeFilters.length > 0 || stockFilter !== 'all') && (
          <div className="flex flex-wrap gap-2">
            {stockFilter !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                Status: {
                  stockFilter === 'critical' ? 'Estoque crítico' : 
                  stockFilter === 'low' ? 'Estoque baixo' : 
                  'Estoque adequado'
                }
                <XIcon size={14} className="cursor-pointer" onClick={() => setStockFilter('all')} />
              </Badge>
            )}
            {activeFilters.map(filter => (
              <Badge key={filter} variant="outline" className="flex items-center gap-1 px-3 py-1">
                {filter === 'screens' ? 'Telas' : 
                 filter === 'batteries' ? 'Baterias' : 'Acessórios'}
                <XIcon size={14} className="cursor-pointer" onClick={() => handleFilterToggle(filter)} />
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7">
              Limpar filtros
            </Button>
          </div>
        )}
        
        {filteredItems.length > 0 ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Compatibilidade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Preço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estoque</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Última Compra</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {filteredItems.map((item, idx) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {item.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.compatibility}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        R$ {item.price?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {(() => {
                            const currentStock = Number(item.currentStock) || 0;
                            const minimumStock = Number(item.minimumStock) || 0;
                            
                            if (currentStock === 0) {
                              return (
                                <div className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                  Crítico
                                </div>
                              );
                            } else if (currentStock < minimumStock) {
                              return (
                                <div className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                  Baixo
                                </div>
                              );
                            } else {
                              return (
                                <div className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                  OK
                                </div>
                              );
                            }
                          })()}
                          <span className="ml-2">{item.currentStock || 0}</span>
                          <span className="text-muted-foreground text-xs ml-1">/ {item.minimumStock || 0} min</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {item.lastPurchase}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditItem(item)}
                          >
                            <PenIcon size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeletePrompt(item)}
                          >
                            <TrashIcon size={16} />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center h-60 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground mb-4">Nenhum item no estoque</p>
            <Button onClick={handleNewItem}>Cadastrar Novo Item</Button>
          </div>
        )}
      </motion.div>
      
      {/* New Item Dialog */}
      <Dialog open={isNewItemDialogOpen} onOpenChange={setIsNewItemDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Item de Estoque</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo item para adicionar ao estoque
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Tela iPhone 11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="Ex: TL-IPH11-001"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tela">Tela</SelectItem>
                    <SelectItem value="Bateria">Bateria</SelectItem>
                    <SelectItem value="Acessório">Acessório</SelectItem>
                    <SelectItem value="Placa">Placa</SelectItem>
                    <SelectItem value="Cabo">Cabo</SelectItem>
                    <SelectItem value="Carcaça">Carcaça</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="compatibility">Compatibilidade</Label>
                <Input
                  id="compatibility"
                  name="compatibility"
                  value={formData.compatibility}
                  onChange={handleInputChange}
                  placeholder="Ex: iPhone 11, 12"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentStock">Estoque Atual *</Label>
                <Input
                  id="currentStock"
                  name="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minimumStock">Estoque Mínimo</Label>
                <Input
                  id="minimumStock"
                  name="minimumStock"
                  type="number"
                  value={formData.minimumStock}
                  onChange={handleInputChange}
                  placeholder="5"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewItemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNewItem}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Item de Estoque</DialogTitle>
            <DialogDescription>
              Atualize as informações do item selecionado
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Tela iPhone 11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="Ex: TL-IPH11-001"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tela">Tela</SelectItem>
                    <SelectItem value="Bateria">Bateria</SelectItem>
                    <SelectItem value="Acessório">Acessório</SelectItem>
                    <SelectItem value="Placa">Placa</SelectItem>
                    <SelectItem value="Cabo">Cabo</SelectItem>
                    <SelectItem value="Carcaça">Carcaça</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="compatibility">Compatibilidade</Label>
                <Input
                  id="compatibility"
                  name="compatibility"
                  value={formData.compatibility}
                  onChange={handleInputChange}
                  placeholder="Ex: iPhone 11, 12"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentStock">Estoque Atual *</Label>
                <Input
                  id="currentStock"
                  name="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minimumStock">Estoque Mínimo</Label>
                <Input
                  id="minimumStock"
                  name="minimumStock"
                  type="number"
                  value={formData.minimumStock}
                  onChange={handleInputChange}
                  placeholder="5"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditItem}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o item "{selectedItem?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Inventory;
