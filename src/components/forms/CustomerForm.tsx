import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { v4 as uuidv4 } from 'uuid';
import { AlertCircle, CheckCircle2, InfoIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CustomerFormProps {
  onSubmit?: (customerData: any) => void;
  initialData?: any;
  isEdit?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ 
  onSubmit, 
  initialData = {}, 
  isEdit = false 
}) => {
  const navigate = useNavigate();
  // Import validation functions from invoice-api
  const validateCpfCnpj = (document: string): boolean => {
    // Remove non-numeric characters
    const cleanDoc = document.replace(/[^0-9]/g, '');
    
    // Check if it's a CPF (11 digits) or CNPJ (14 digits)
    if (cleanDoc.length === 11) {
      return validateCpf(cleanDoc);
    } else if (cleanDoc.length === 14) {
      return validateCnpj(cleanDoc);
    }
    
    return false;
  };

  const validateCpf = (cpf: string): boolean => {
    // Check for known invalid CPFs
    if (
      cpf === '00000000000' ||
      cpf === '11111111111' ||
      cpf === '22222222222' ||
      cpf === '33333333333' ||
      cpf === '44444444444' ||
      cpf === '55555555555' ||
      cpf === '66666666666' ||
      cpf === '77777777777' ||
      cpf === '88888888888' ||
      cpf === '99999999999'
    ) {
      return false;
    }
    
    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    let checkDigit1 = remainder === 10 || remainder === 11 ? 0 : remainder;
    
    if (checkDigit1 !== parseInt(cpf.charAt(9))) {
      return false;
    }
    
    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    let checkDigit2 = remainder === 10 || remainder === 11 ? 0 : remainder;
    
    return checkDigit2 === parseInt(cpf.charAt(10));
  };

  const validateCnpj = (cnpj: string): boolean => {
    // Check for known invalid CNPJs
    if (
      cnpj === '00000000000000' ||
      cnpj === '11111111111111' ||
      cnpj === '22222222222222' ||
      cnpj === '33333333333333' ||
      cnpj === '44444444444444' ||
      cnpj === '55555555555555' ||
      cnpj === '66666666666666' ||
      cnpj === '77777777777777' ||
      cnpj === '88888888888888' ||
      cnpj === '99999999999999'
    ) {
      return false;
    }
    
    // Validate first check digit
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) {
      return false;
    }
    
    // Validate second check digit
    size += 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    return result === parseInt(digits.charAt(1));
  };

  const formatCpfCnpj = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 11) {
      // Format as CPF: 000.000.000-00
      return digits
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
        .substring(0, 14);
    } else {
      // Format as CNPJ: 00.000.000/0000-00
      return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5')
        .substring(0, 18);
    }
  };

  const [formData, setFormData] = useState({
    id: initialData.id || uuidv4(),
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address?.street || initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || '',
    postalCode: initialData.postalCode || '',
    cpfCnpj: initialData.cpfCnpj || '',
    notes: initialData.notes || '',
    isCompany: initialData.isCompany || false,
    createdAt: initialData.createdAt || new Date().toISOString(),
    // Adicionando campos específicos de endereço
    addressDetail: {
      number: initialData.addressDetail?.number || initialData.address?.number || '',
      neighborhood: initialData.addressDetail?.neighborhood || initialData.address?.neighborhood || '',
      complement: initialData.addressDetail?.complement || initialData.address?.complement || '',
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cpfCnpjError, setCpfCnpjError] = useState<string | null>(null);
  const [cpfCnpjValid, setCpfCnpjValid] = useState<boolean>(false);
  const [showNfeInfo, setShowNfeInfo] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle address detail fields
    if (name.startsWith('addressDetail.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        addressDetail: {
          ...prev.addressDetail,
          [field]: value
        }
      }));
      return;
    }
    
    // Handle CPF/CNPJ formatting and validation
    if (name === 'cpfCnpj') {
      const formattedValue = formatCpfCnpj(value);
      setFormData({ ...formData, [name]: formattedValue });
      
      // Clear validation state when field is empty
      if (!formattedValue) {
        setCpfCnpjError(null);
        setCpfCnpjValid(false);
        return;
      }
      
      // Only validate if we have enough digits
      const digits = formattedValue.replace(/\D/g, '');
      if ((digits.length === 11) || (digits.length === 14)) {
        const isValid = validateCpfCnpj(digits);
        setCpfCnpjValid(isValid);
        setCpfCnpjError(isValid ? null : 
          digits.length === 11 ? 'CPF inválido' : 'CNPJ inválido');
      } else if (digits.length > 0) {
        setCpfCnpjValid(false);
        setCpfCnpjError('Formato inválido');
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // If the field is postalCode and has 8 digits (without mask) or 9 characters (with mask)
    if (name === 'postalCode' && (value.replace(/\D/g, '').length === 8)) {
      fetchAddressByCep(value);
    }
  };

  const fetchAddressByCep = async (cep: string) => {
    // Remove any non-digit character
    const cepDigits = cep.replace(/\D/g, '');
    
    if (cepDigits.length !== 8) return;
    
    setIsLoadingCep(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro || prev.address,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
          addressDetail: {
            ...prev.addressDetail,
            neighborhood: data.bairro || prev.addressDetail.neighborhood
          }
        }));
        toast.success('Endereço preenchido automaticamente');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('Erro ao buscar endereço pelo CEP');
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, isCompany: checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate CPF/CNPJ before submission if it's not empty
    if (formData.cpfCnpj && !cpfCnpjValid) {
      toast.error('Por favor, corrija o CPF/CNPJ antes de continuar.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Prepare the customer data by combining address details with the main form
      const customerToSave = {
        ...formData,
        // Create address object with proper fields for NF-e
        address: {
          street: formData.address, // Armazena como string
          number: formData.addressDetail.number,
          neighborhood: formData.addressDetail.neighborhood,
          complement: formData.addressDetail.complement,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode
        }
      };
      
      // Remover campos duplicados desnecessários do objeto principal
      const { address: originalAddress, ...customerData } = customerToSave;

      // Cria o objeto final do cliente
      const finalCustomerData = {
        ...customerData,
        address: originalAddress, // Usa o objeto de endereço estruturado
      };
      
      // Retrieve existing customers from localStorage
      const savedCustomers = localStorage.getItem('pauloCell_customers');
      let customers = savedCustomers ? JSON.parse(savedCustomers) : [];
      
      if (isEdit) {
        // Update existing customer
        customers = customers.map((customer: any) => 
          customer.id === formData.id ? finalCustomerData : customer
        );
      } else {
        // Add new customer
        customers.push(finalCustomerData);
      }
      
      // Save updated customers list to localStorage
      localStorage.setItem('pauloCell_customers', JSON.stringify(customers));
      
      if (onSubmit) {
        onSubmit(finalCustomerData);
      }
      
      toast.success(
        isEdit ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!'
      );
      
      // Navigate back to customers list
      navigate('/customers');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Ocorreu um erro ao salvar o cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-xl border border-border p-6 shadow-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Informações Básicas</h3>
            <p className="text-sm text-muted-foreground">
              Forneça as informações principais do cliente.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nome do cliente"
                required
              />
            </div>
            
            <div className="flex items-center gap-2 mt-8">
              <Checkbox 
                id="isCompany" 
                checked={formData.isCompany}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="isCompany" className="text-sm font-normal">
                Cliente é uma empresa (pessoa jurídica)
              </Label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
            <div className="relative">
              <Input
                id="cpfCnpj"
                name="cpfCnpj"
                value={formData.cpfCnpj}
                onChange={handleChange}
                placeholder={formData.isCompany ? "00.000.000/0000-00" : "000.000.000-00"}
                className={`${cpfCnpjError ? 'border-red-500 pr-10' : ''} ${cpfCnpjValid && formData.cpfCnpj ? 'border-green-500 pr-10' : ''}`}
              />
              {cpfCnpjError && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
              {cpfCnpjValid && formData.cpfCnpj && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
            {cpfCnpjError && (
              <p className="text-sm text-red-500 mt-1">{cpfCnpjError}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Endereço</h3>
              <p className="text-sm text-muted-foreground">
                Informações de endereço do cliente.
              </p>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setShowNfeInfo(!showNfeInfo)}
            >
              <InfoIcon size={16} />
              <span>Campos obrigatórios para NF-e</span>
            </Button>
          </div>
          
          {showNfeInfo && (
            <Alert className="mb-4">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Para emissão de NF-e, todos os campos de endereço são obrigatórios:
                Rua/Logradouro, Número, Bairro, Cidade, Estado e CEP.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">CEP</Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="00000-000"
                className={isLoadingCep ? "opacity-70" : ""}
                disabled={isLoadingCep}
              />
              {isLoadingCep && (
                <p className="text-xs text-muted-foreground mt-1">Buscando endereço...</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Cidade"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Estado"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Rua/Logradouro</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Nome da rua/avenida"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressDetail.number">Número</Label>
              <Input
                id="addressDetail.number"
                name="addressDetail.number"
                value={formData.addressDetail.number}
                onChange={handleChange}
                placeholder="123"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="addressDetail.neighborhood">Bairro</Label>
              <Input
                id="addressDetail.neighborhood"
                name="addressDetail.neighborhood"
                value={formData.addressDetail.neighborhood}
                onChange={handleChange}
                placeholder="Nome do bairro"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="addressDetail.complement">Complemento</Label>
              <Input
                id="addressDetail.complement"
                name="addressDetail.complement"
                value={formData.addressDetail.complement}
                onChange={handleChange}
                placeholder="Apto, Bloco, etc"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Observações</h3>
            <p className="text-sm text-muted-foreground">
              Informações adicionais sobre o cliente.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Observações sobre o cliente"
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/customers')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoadingCep}>
            {isSubmitting ? 'Salvando...' : isEdit ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default CustomerForm;
