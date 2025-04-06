import React from 'react';

/**
 * Sistema de eventos personalizado para comunicação entre componentes
 * Permite que diferentes partes do aplicativo se comuniquem sem acoplamento direto
 */

// Tipo para os ouvintes de eventos
type EventListener = (data?: any) => void;

// Tipo para armazenar os ouvintes por tipo de evento
type EventMap = {
  [eventName: string]: EventListener[];
};

// Eventos disponíveis no sistema
export enum AppEvents {
  // Eventos de dados
  DATA_CREATED = 'data:created',
  DATA_UPDATED = 'data:updated',
  DATA_DELETED = 'data:deleted',
  
  // Eventos de entidades específicas
  CUSTOMER_CREATED = 'customer:created', 
  CUSTOMER_UPDATED = 'customer:updated',
  DEVICE_CREATED = 'device:created',
  DEVICE_UPDATED = 'device:updated',
  SERVICE_CREATED = 'service:created',
  SERVICE_UPDATED = 'service:updated',
  INVENTORY_UPDATED = 'inventory:updated',
  
  // Eventos de relatórios
  REPORTS_REFRESH_REQUESTED = 'reports:refresh',
  STATS_RESET = 'stats:reset',
  
  // Eventos da interface
  UI_THEME_CHANGED = 'ui:theme-changed',
  UI_LANGUAGE_CHANGED = 'ui:language-changed',
}

class EventBus {
  private events: EventMap = {};

  /**
   * Registra um ouvinte para um evento específico
   * @param eventName Nome do evento
   * @param callback Função a ser chamada quando o evento ocorrer
   * @returns Função para remover o listener
   */
  on(eventName: string, callback: EventListener): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    
    this.events[eventName].push(callback);
    
    // Retorna uma função para remover o ouvinte
    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Remove um ouvinte de um evento específico
   * @param eventName Nome do evento
   * @param callback Função a ser removida
   */
  off(eventName: string, callback: EventListener): void {
    if (!this.events[eventName]) return;
    
    this.events[eventName] = this.events[eventName].filter(
      listener => listener !== callback
    );
  }

  /**
   * Dispara um evento com dados opcionais
   * @param eventName Nome do evento
   * @param data Dados a serem passados para os ouvintes
   */
  emit(eventName: string, data?: any): void {
    console.log(`[EventBus] Emitindo evento: ${eventName}`, data);
    
    if (!this.events[eventName]) return;
    
    this.events[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Erro ao processar evento ${eventName}:`, error);
      }
    });
  }

  /**
   * Registra um ouvinte para ser chamado apenas uma vez
   * @param eventName Nome do evento
   * @param callback Função a ser chamada quando o evento ocorrer
   */
  once(eventName: string, callback: EventListener): void {
    const onceCallback: EventListener = (data?: any) => {
      this.off(eventName, onceCallback);
      callback(data);
    };
    
    this.on(eventName, onceCallback);
  }

  /**
   * Remove todos os ouvintes de um evento específico
   * @param eventName Nome do evento opcional (se não informado, limpa todos os eventos)
   */
  clear(eventName?: string): void {
    if (eventName) {
      this.events[eventName] = [];
    } else {
      this.events = {};
    }
  }
}

// Exporta uma instância única do EventBus para ser usada em toda a aplicação
export const eventBus = new EventBus();

// Exporta tipos úteis
export type { EventListener };

// Função auxiliar para emitir eventos de atualizações de dados
export const emitDataChange = (
  entityType: 'customer' | 'device' | 'service' | 'inventory' | 'report',
  actionType: 'created' | 'updated' | 'deleted',
  data?: any
) => {
  // Emite o evento específico da entidade se existir
  const specificEvent = `${entityType}:${actionType}` as AppEvents;
  eventBus.emit(specificEvent, data);
  
  // Emite um evento genérico de dados
  const genericEvent = `data:${actionType}` as AppEvents;
  eventBus.emit(genericEvent, { type: entityType, data });
};

// Hook útil para componentes funcionais React
export const useAppEvent = (eventName: AppEvents, callback: EventListener) => {
  React.useEffect(() => {
    const unsubscribe = eventBus.on(eventName, callback);
    return unsubscribe;
  }, [eventName, callback]);
}; 