// Utility functions for handling service trash bin functionality

// Key for storing deleted services in localStorage
const DELETED_SERVICES_KEY = 'pauloCell_deleted_services';

// Function to move a service to trash
export const moveServiceToTrash = (serviceId: string) => {
  try {
    // Get current services
    const savedServices = localStorage.getItem('pauloCell_services');
    if (!savedServices) return false;
    
    const services = JSON.parse(savedServices);
    const serviceToDelete = services.find((s: any) => s.id === serviceId);
    
    if (!serviceToDelete) return false;
    
    // Remove from active services
    const updatedServices = services.filter((s: any) => s.id !== serviceId);
    localStorage.setItem('pauloCell_services', JSON.stringify(updatedServices));
    
    // Add to deleted services
    const savedDeletedServices = localStorage.getItem(DELETED_SERVICES_KEY);
    const deletedServices = savedDeletedServices ? JSON.parse(savedDeletedServices) : [];
    
    deletedServices.push({
      ...serviceToDelete,
      deletedAt: new Date().toISOString()
    });
    
    localStorage.setItem(DELETED_SERVICES_KEY, JSON.stringify(deletedServices));
    return true;
  } catch (error) {
    console.error('Error moving service to trash:', error);
    return false;
  }
};

// Function to restore a service from trash
export const restoreServiceFromTrash = (serviceId: string) => {
  try {
    // Get deleted services
    const savedDeletedServices = localStorage.getItem(DELETED_SERVICES_KEY);
    if (!savedDeletedServices) return false;
    
    const deletedServices = JSON.parse(savedDeletedServices);
    const serviceToRestore = deletedServices.find((s: any) => s.id === serviceId);
    
    if (!serviceToRestore) return false;
    
    // Remove deletedAt property and any other trash-specific properties
    const { deletedAt, deletedWithCustomer, ...serviceData } = serviceToRestore;
    
    // Add back to active services
    const savedServices = localStorage.getItem('pauloCell_services');
    const services = savedServices ? JSON.parse(savedServices) : [];
    services.push(serviceData);
    localStorage.setItem('pauloCell_services', JSON.stringify(services));
    
    // Remove from deleted services
    const updatedDeletedServices = deletedServices.filter((s: any) => s.id !== serviceId);
    localStorage.setItem(DELETED_SERVICES_KEY, JSON.stringify(updatedDeletedServices));
    
    return true;
  } catch (error) {
    console.error('Error restoring service from trash:', error);
    return false;
  }
};

// Function to permanently delete a service
export const permanentlyDeleteService = (serviceId: string) => {
  try {
    const savedDeletedServices = localStorage.getItem(DELETED_SERVICES_KEY);
    if (!savedDeletedServices) return false;
    
    const deletedServices = JSON.parse(savedDeletedServices);
    const updatedDeletedServices = deletedServices.filter((s: any) => s.id !== serviceId);
    
    localStorage.setItem(DELETED_SERVICES_KEY, JSON.stringify(updatedDeletedServices));
    return true;
  } catch (error) {
    console.error('Error permanently deleting service:', error);
    return false;
  }
};

// Function to get all deleted services
export const getDeletedServices = () => {
  try {
    const savedDeletedServices = localStorage.getItem(DELETED_SERVICES_KEY);
    return savedDeletedServices ? JSON.parse(savedDeletedServices) : [];
  } catch (error) {
    console.error('Error getting deleted services:', error);
    return [];
  }
};