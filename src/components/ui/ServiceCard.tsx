import React from 'react';
import { motion } from 'framer-motion';
import { MoreVerticalIcon, WrenchIcon } from 'lucide-react';

interface ServiceCardProps {
  service: {
    id: string;
    type: string;
    status: 'waiting' | 'in_progress' | 'completed' | 'delivered';
    customer: string;
    device: string;
    createDate: string;
    estimatedCompletion?: string;
    price: number | undefined;
    technician?: string;
    priority?: 'low' | 'normal' | 'high';
  };
  index: number;
  onClick?: (serviceId: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, index, onClick }) => {
  const getStatusColor = () => {
    switch(service.status) {
      case 'waiting':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-amber-100 text-amber-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'delivered':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getStatusText = () => {
    switch(service.status) {
      case 'waiting':
        return 'Em espera';
      case 'in_progress':
        return 'Em andamento';
      case 'completed':
        return 'Concluído';
      case 'delivered':
        return 'Entregue';
      default:
        return 'Desconhecido';
    }
  };
  
  return (
    <motion.div 
      className="bg-card rounded-xl border border-border p-4 card-hover cursor-pointer transition-all hover:shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onClick && onClick(service.id)}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <WrenchIcon size={20} />
          </div>
          
          <div>
            <div className="flex items-center">
              <h3 className="font-medium">{service.type}</h3>
              <div className={`text-xs px-2 py-0.5 rounded-full ml-2 ${getStatusColor()}`}>
                {getStatusText()}
              </div>
              {service.priority === 'high' && (
                <div className="text-xs px-2 py-0.5 rounded-full ml-2 bg-red-100 text-red-700">
                  Alta Prioridade
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-0.5">
              Cliente: <span className="font-medium">{service.customer}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Dispositivo: <span className="font-medium">{service.device}</span>
            </p>
          </div>
        </div>
        
        <button 
          className="p-1 rounded-full hover:bg-muted transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVerticalIcon size={18} />
        </button>
      </div>
      
      <div className="border-t border-border mt-3 pt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Data de criação:</span>
          <p className="font-medium">{service.createDate}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Previsão de entrega:</span>
          <p className="font-medium">{service.estimatedCompletion || 'Não definido'}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Valor:</span>
          <p className="font-medium">R$ {service.price !== undefined ? service.price.toFixed(2) : '0.00'}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Técnico:</span>
          <p className="font-medium">{service.technician || 'Não atribuído'}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
