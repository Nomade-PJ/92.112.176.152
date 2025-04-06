import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  notificationsEnabled: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  toggleNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  // Lista de IDs de documentos, serviços e itens que já foram notificados
  const [processedItems, setProcessedItems] = useState<{
    documents: string[];
    services: string[];
    inventory: string[];
  }>({
    documents: [],
    services: [],
    inventory: []
  });
  
  // Definindo a função addNotification antes de ser usada
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!notificationsEnabled) return;
    
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  }, [notificationsEnabled]);
  
  // Load notifications and settings from localStorage on component mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('pauloCell_notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    
    const savedSettings = localStorage.getItem('pauloCell_notification_settings');
    if (savedSettings) {
      setNotificationsEnabled(JSON.parse(savedSettings).enabled);
    }
    
    // Carregar itens já processados
    const savedProcessedItems = localStorage.getItem('pauloCell_processed_notifications');
    if (savedProcessedItems) {
      setProcessedItems(JSON.parse(savedProcessedItems));
    }
  }, []);
  
  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pauloCell_notifications', JSON.stringify(notifications));
  }, [notifications]);
  
  // Save notification settings whenever they change
  useEffect(() => {
    localStorage.setItem('pauloCell_notification_settings', JSON.stringify({ enabled: notificationsEnabled }));
  }, [notificationsEnabled]);
  
  // Salvar itens processados
  useEffect(() => {
    localStorage.setItem('pauloCell_processed_notifications', JSON.stringify(processedItems));
  }, [processedItems]);
  
  // Auto-generate notifications for low inventory, overdue services, and pending documents
  useEffect(() => {
    if (!notificationsEnabled) return;
    
    const checkForNotifications = () => {
      // Check for low inventory items
      const savedInventory = localStorage.getItem('pauloCell_inventory');
      if (savedInventory) {
        const inventory = JSON.parse(savedInventory);
        const lowStockItems = inventory.filter((item: any) => 
          item.currentStock < item.minimumStock
        );
        
        // Only notify about low stock items that don't already have notifications
        lowStockItems.forEach((item: any) => {
          // Verifica se este item já foi processado
          const currentProcessedItems = JSON.parse(localStorage.getItem('pauloCell_processed_notifications') || '{"inventory":[], "services":[], "documents":[]}');
          if (currentProcessedItems.inventory.includes(item.id)) return;
          
          // Procura por notificações existentes
          const currentNotifications = JSON.parse(localStorage.getItem('pauloCell_notifications') || '[]');
          const existingNotification = currentNotifications.find(
            (n: any) => n.title.includes('Estoque Baixo') && n.message.includes(item.name)
          );
          
          if (!existingNotification) {
            // Adicionar notificação
            addNotification({
              title: 'Estoque Baixo',
              message: `${item.name} está com estoque abaixo do mínimo (${item.currentStock}/${item.minimumStock})`,
              type: 'warning',
              link: '/inventory',
            });
            
            // Adicionar à lista de itens processados
            const updatedProcessedItems = {...currentProcessedItems};
            updatedProcessedItems.inventory.push(item.id);
            localStorage.setItem('pauloCell_processed_notifications', JSON.stringify(updatedProcessedItems));
          }
        });
      }
      
      // Check for overdue services
      const savedServices = localStorage.getItem('pauloCell_services');
      if (savedServices) {
        const services = JSON.parse(savedServices);
        const currentDate = new Date();
        
        const overdueServices = services.filter((service: any) => {
          if (!service.expectedCompletionDate || service.status === 'completed' || service.status === 'cancelled') {
            return false;
          }
          
          const completionDate = new Date(service.expectedCompletionDate);
          return completionDate < currentDate;
        });
        
        // Only notify about overdue services that don't already have notifications
        overdueServices.forEach((service: any) => {
          // Verifica se este serviço já foi processado
          if (processedItems.services.includes(service.id)) return;
          
          const existingNotification = notifications.find(
            (n) => n.title.includes('Serviço Atrasado') && n.message.includes(service.id)
          );
          
          if (!existingNotification) {
            addNotification({
              title: 'Serviço Atrasado',
              message: `O serviço para ${service.customer || 'Cliente'} está atrasado`,
              type: 'error',
              link: `/services/${service.id}`,
            });
            
            // Adicionar à lista de serviços processados
            setProcessedItems(prev => ({
              ...prev,
              services: [...prev.services, service.id]
            }));
          }
        });
      }
      
      // Check for pending documents
      const savedDocuments = localStorage.getItem('pauloCell_documents');
      if (savedDocuments) {
        const documents = JSON.parse(savedDocuments);
        
        // Check for pending documents
        const pendingDocuments = documents.filter((doc: any) => doc.status === 'Pendente');
        pendingDocuments.forEach((document: any) => {
          // Verifica se este documento já foi processado como pendente
          const notificationKey = `pendente_${document.id}`;
          if (processedItems.documents.includes(notificationKey)) return;
          
          const existingNotification = notifications.find(
            (n) => n.title.includes('Documento Pendente') && n.message.includes(document.number)
          );
          
          if (!existingNotification) {
            addNotification({
              title: 'Documento Pendente',
              message: `O documento ${document.type.toUpperCase()} ${document.number} está pendente`,
              type: 'info',
              link: `/documents/${document.id}`,
            });
            
            // Adicionar à lista de documentos processados
            setProcessedItems(prev => ({
              ...prev,
              documents: [...prev.documents, notificationKey]
            }));
          }
        });
        
        // Check for documents with invoice information from API
        const documentsWithInvoice = documents.filter((doc: any) => doc.invoiceId && doc.status === 'Emitida');
        documentsWithInvoice.forEach((document: any) => {
          // Verifica se este documento já foi processado como emitido
          const notificationKey = `emitido_${document.id}`;
          if (processedItems.documents.includes(notificationKey)) return;
          
          const existingNotification = notifications.find(
            (n) => n.title.includes('Documento Fiscal Emitido') && n.message.includes(document.number)
          );
          
          if (!existingNotification) {
            addNotification({
              title: 'Documento Fiscal Emitido',
              message: `O documento ${document.type.toUpperCase()} ${document.number} foi emitido com sucesso`,
              type: 'success',
              link: `/documents/${document.id}`,
            });
            
            // Adicionar à lista de documentos processados
            setProcessedItems(prev => ({
              ...prev,
              documents: [...prev.documents, notificationKey]
            }));
          }
        });
        
        // Check for canceled documents
        const canceledDocuments = documents.filter((doc: any) => 
          doc.status === 'Cancelada' && doc.invoiceId && 
          // Only notify about recently canceled documents (last 24 hours)
          new Date(doc.updatedAt || doc.date).getTime() > Date.now() - 24 * 60 * 60 * 1000
        );
        
        canceledDocuments.forEach((document: any) => {
          // Verifica se este documento já foi processado como cancelado
          const notificationKey = `cancelado_${document.id}`;
          if (processedItems.documents.includes(notificationKey)) return;
          
          const existingNotification = notifications.find(
            (n) => n.title.includes('Documento Fiscal Cancelado') && n.message.includes(document.number)
          );
          
          if (!existingNotification) {
            addNotification({
              title: 'Documento Fiscal Cancelado',
              message: `O documento ${document.type.toUpperCase()} ${document.number} foi cancelado`,
              type: 'warning',
              link: `/documents/${document.id}`,
            });
            
            // Adicionar à lista de documentos processados
            setProcessedItems(prev => ({
              ...prev,
              documents: [...prev.documents, notificationKey]
            }));
          }
        });
      }
    };
    
    // Check when component mounts and then every 5 minutes
    checkForNotifications();
    const interval = setInterval(checkForNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [notificationsEnabled, addNotification]);
  
  // Limpar itens processados antigos (mais de 30 dias)
  useEffect(() => {
    // Função para limpar itens processados antigos
    const cleanupProcessedItems = () => {
      // Obter todos os documentos, serviços e itens do estoque atuais
      const currentDocuments: string[] = [];
      const currentServices: string[] = [];
      const currentInventory: string[] = [];
      
      try {
        // Obter documentos ativos
        const savedDocuments = localStorage.getItem('pauloCell_documents');
        if (savedDocuments) {
          const documents = JSON.parse(savedDocuments);
          documents.forEach((doc: any) => {
            currentDocuments.push(`pendente_${doc.id}`);
            currentDocuments.push(`emitido_${doc.id}`);
            currentDocuments.push(`cancelado_${doc.id}`);
          });
        }
        
        // Obter serviços ativos
        const savedServices = localStorage.getItem('pauloCell_services');
        if (savedServices) {
          const services = JSON.parse(savedServices);
          services.forEach((service: any) => {
            currentServices.push(service.id);
          });
        }
        
        // Obter itens do estoque
        const savedInventory = localStorage.getItem('pauloCell_inventory');
        if (savedInventory) {
          const inventory = JSON.parse(savedInventory);
          inventory.forEach((item: any) => {
            currentInventory.push(item.id);
          });
        }
        
        // Limpar itens que não existem mais
        setProcessedItems(prev => ({
          documents: prev.documents.filter(id => currentDocuments.includes(id)),
          services: prev.services.filter(id => currentServices.includes(id)),
          inventory: prev.inventory.filter(id => currentInventory.includes(id))
        }));
      } catch (error) {
        console.error('Erro ao limpar itens processados:', error);
      }
    };
    
    // Limpar itens processados antigos a cada 24 horas
    cleanupProcessedItems();
    const cleanup = setInterval(cleanupProcessedItems, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(cleanup);
  }, []);
  
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // Função para limitar a quantidade de notificações sendo exibidas
  useEffect(() => {
    // Mantém apenas as 50 notificações mais recentes para não sobrecarregar
    if (notifications.length > 50) {
      const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(sortedNotifications.slice(0, 50));
    }
  }, [notifications]);
  
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);
  
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  const toggleNotifications = useCallback(() => {
    setNotificationsEnabled(prev => !prev);
  }, []);
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        notificationsEnabled,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        toggleNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
