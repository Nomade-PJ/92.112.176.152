import React, { useEffect } from 'react';
import { eventBus, AppEvents, emitDataChange } from './events';

/**
 * Componente utilitário que monitora o localStorage e emite eventos quando dados são alterados
 * Isso permite que outras partes da aplicação, como relatórios, sejam notificadas automaticamente.
 */
const DataUpdateEmitter: React.FC = () => {
  useEffect(() => {
    // Função para verificar mudanças no localStorage
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || !event.newValue) return;
      
      // Verificar quais dados foram alterados
      if (event.key === 'pauloCell_customers') {
        emitDataChange('customer', 'updated');
      } else if (event.key === 'pauloCell_devices') {
        emitDataChange('device', 'updated');
      } else if (event.key === 'pauloCell_services') {
        emitDataChange('service', 'updated');
      } else if (event.key === 'pauloCell_inventory') {
        emitDataChange('inventory', 'updated');
      }
    };
    
    // Adicionar o listener
    window.addEventListener('storage', handleStorageChange);
    
    // Limpar o listener ao desmontar
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Este componente não renderiza nada, apenas escuta eventos
  return null;
};

// Função para adicionar emissão de eventos a novos dados
export const emitDataCreated = (
  entityType: 'customer' | 'device' | 'service' | 'inventory' | 'report',
  data: any
) => {
  // Emitir evento de criação
  emitDataChange(entityType, 'created', data);
  
  // Solicitar atualização de relatórios
  eventBus.emit(AppEvents.REPORTS_REFRESH_REQUESTED);
  
  console.log(`[DataUpdateEmitter] Emitido evento de criação para ${entityType}`, data);
};

// Solicitar atualização manual de relatórios
export const requestReportsRefresh = () => {
  eventBus.emit(AppEvents.REPORTS_REFRESH_REQUESTED);
  console.log('[DataUpdateEmitter] Solicitada atualização de relatórios');
};

export default DataUpdateEmitter; 