// Utility functions for handling trash bin functionality

// Keys for storing deleted items in localStorage
const DELETED_CUSTOMERS_KEY = 'pauloCell_deleted_customers';
const DELETED_DEVICES_KEY = 'pauloCell_deleted_devices';
const DELETED_SERVICES_KEY = 'pauloCell_deleted_services';
const DELETED_DOCUMENTS_KEY = 'pauloCell_deleted_documents';

// Function to move a customer to trash along with all related data
export const moveCustomerToTrash = (customerId: string) => {
  try {
    // Get current customers
    const savedCustomers = localStorage.getItem('pauloCell_customers');
    if (!savedCustomers) return false;
    
    const customers = JSON.parse(savedCustomers);
    const customerToDelete = customers.find((c: any) => c.id === customerId);
    
    if (!customerToDelete) return false;
    
    // Find related devices
    const savedDevices = localStorage.getItem('pauloCell_devices');
    let customerDevices: any[] = [];
    let remainingDevices: any[] = [];
    
    if (savedDevices) {
      const devices = JSON.parse(savedDevices);
      customerDevices = devices.filter((d: any) => d.owner === customerId);
      remainingDevices = devices.filter((d: any) => d.owner !== customerId);
    }
    
    // Find related services
    const savedServices = localStorage.getItem('pauloCell_services');
    let customerServices: any[] = [];
    let remainingServices: any[] = [];
    
    if (savedServices) {
      const services = JSON.parse(savedServices);
      customerServices = services.filter((s: any) => s.customerId === customerId);
      remainingServices = services.filter((s: any) => s.customerId !== customerId);
    }
    
    // Find related documents
    const savedDocuments = localStorage.getItem('pauloCell_documents');
    let customerDocuments: any[] = [];
    let remainingDocuments: any[] = [];
    
    if (savedDocuments) {
      const documents = JSON.parse(savedDocuments);
      customerDocuments = documents.filter((d: any) => d.customerId === customerId);
      remainingDocuments = documents.filter((d: any) => d.customerId !== customerId);
    }
    
    // Remove from active customers
    const updatedCustomers = customers.filter((c: any) => c.id !== customerId);
    localStorage.setItem('pauloCell_customers', JSON.stringify(updatedCustomers));
    
    // Update devices, services, and documents
    if (savedDevices) {
      localStorage.setItem('pauloCell_devices', JSON.stringify(remainingDevices));
    }
    
    if (savedServices) {
      localStorage.setItem('pauloCell_services', JSON.stringify(remainingServices));
    }
    
    if (savedDocuments) {
      localStorage.setItem('pauloCell_documents', JSON.stringify(remainingDocuments));
    }
    
    // Add to deleted customers
    const savedDeletedCustomers = localStorage.getItem(DELETED_CUSTOMERS_KEY);
    const deletedCustomers = savedDeletedCustomers ? JSON.parse(savedDeletedCustomers) : [];
    
    const now = new Date().toISOString();
    
    deletedCustomers.push({
      ...customerToDelete,
      deletedAt: now
    });
    
    localStorage.setItem(DELETED_CUSTOMERS_KEY, JSON.stringify(deletedCustomers));
    
    // Add to deleted devices
    if (customerDevices.length > 0) {
      const savedDeletedDevices = localStorage.getItem(DELETED_DEVICES_KEY);
      const deletedDevices = savedDeletedDevices ? JSON.parse(savedDeletedDevices) : [];
      
      customerDevices.forEach(device => {
        deletedDevices.push({
          ...device,
          deletedAt: now,
          deletedWithCustomer: customerId
        });
      });
      
      localStorage.setItem(DELETED_DEVICES_KEY, JSON.stringify(deletedDevices));
    }
    
    // Add to deleted services
    if (customerServices.length > 0) {
      const savedDeletedServices = localStorage.getItem(DELETED_SERVICES_KEY);
      const deletedServices = savedDeletedServices ? JSON.parse(savedDeletedServices) : [];
      
      customerServices.forEach(service => {
        deletedServices.push({
          ...service,
          deletedAt: now,
          deletedWithCustomer: customerId
        });
      });
      
      localStorage.setItem(DELETED_SERVICES_KEY, JSON.stringify(deletedServices));
    }
    
    // Add to deleted documents
    if (customerDocuments.length > 0) {
      const savedDeletedDocuments = localStorage.getItem(DELETED_DOCUMENTS_KEY);
      const deletedDocuments = savedDeletedDocuments ? JSON.parse(savedDeletedDocuments) : [];
      
      customerDocuments.forEach(document => {
        deletedDocuments.push({
          ...document,
          deletedAt: now,
          deletedWithCustomer: customerId
        });
      });
      
      localStorage.setItem(DELETED_DOCUMENTS_KEY, JSON.stringify(deletedDocuments));
    }
    
    return true;
  } catch (error) {
    console.error('Error moving customer to trash:', error);
    return false;
  }
};

// Function to restore a customer from trash along with all related data
export const restoreCustomerFromTrash = (customerId: string) => {
  try {
    // Get deleted customers
    const savedDeletedCustomers = localStorage.getItem(DELETED_CUSTOMERS_KEY);
    if (!savedDeletedCustomers) return false;
    
    const deletedCustomers = JSON.parse(savedDeletedCustomers);
    const customerToRestore = deletedCustomers.find((c: any) => c.id === customerId);
    
    if (!customerToRestore) return false;
    
    // Remove deletedAt property
    const { deletedAt, ...customerData } = customerToRestore;
    
    // Add back to active customers
    const savedCustomers = localStorage.getItem('pauloCell_customers');
    const customers = savedCustomers ? JSON.parse(savedCustomers) : [];
    customers.push(customerData);
    localStorage.setItem('pauloCell_customers', JSON.stringify(customers));
    
    // Restore related devices
    const savedDeletedDevices = localStorage.getItem(DELETED_DEVICES_KEY);
    if (savedDeletedDevices) {
      const deletedDevices = JSON.parse(savedDeletedDevices);
      const devicesToRestore = deletedDevices.filter((d: any) => d.deletedWithCustomer === customerId);
      const remainingDeletedDevices = deletedDevices.filter((d: any) => d.deletedWithCustomer !== customerId);
      
      if (devicesToRestore.length > 0) {
        // Add back to active devices
        const savedDevices = localStorage.getItem('pauloCell_devices');
        const devices = savedDevices ? JSON.parse(savedDevices) : [];
        
        devicesToRestore.forEach(device => {
          const { deletedAt, deletedWithCustomer, ...deviceData } = device;
          devices.push(deviceData);
        });
        
        localStorage.setItem('pauloCell_devices', JSON.stringify(devices));
        localStorage.setItem(DELETED_DEVICES_KEY, JSON.stringify(remainingDeletedDevices));
      }
    }
    
    // Restore related services
    const savedDeletedServices = localStorage.getItem(DELETED_SERVICES_KEY);
    if (savedDeletedServices) {
      const deletedServices = JSON.parse(savedDeletedServices);
      const servicesToRestore = deletedServices.filter((s: any) => s.deletedWithCustomer === customerId);
      const remainingDeletedServices = deletedServices.filter((s: any) => s.deletedWithCustomer !== customerId);
      
      if (servicesToRestore.length > 0) {
        // Add back to active services
        const savedServices = localStorage.getItem('pauloCell_services');
        const services = savedServices ? JSON.parse(savedServices) : [];
        
        servicesToRestore.forEach(service => {
          const { deletedAt, deletedWithCustomer, ...serviceData } = service;
          services.push(serviceData);
        });
        
        localStorage.setItem('pauloCell_services', JSON.stringify(services));
        localStorage.setItem(DELETED_SERVICES_KEY, JSON.stringify(remainingDeletedServices));
      }
    }
    
    // Restore related documents
    const savedDeletedDocuments = localStorage.getItem(DELETED_DOCUMENTS_KEY);
    if (savedDeletedDocuments) {
      const deletedDocuments = JSON.parse(savedDeletedDocuments);
      const documentsToRestore = deletedDocuments.filter((d: any) => d.deletedWithCustomer === customerId);
      const remainingDeletedDocuments = deletedDocuments.filter((d: any) => d.deletedWithCustomer !== customerId);
      
      if (documentsToRestore.length > 0) {
        // Add back to active documents
        const savedDocuments = localStorage.getItem('pauloCell_documents');
        const documents = savedDocuments ? JSON.parse(savedDocuments) : [];
        
        documentsToRestore.forEach(document => {
          const { deletedAt, deletedWithCustomer, ...documentData } = document;
          documents.push(documentData);
        });
        
        localStorage.setItem('pauloCell_documents', JSON.stringify(documents));
        localStorage.setItem(DELETED_DOCUMENTS_KEY, JSON.stringify(remainingDeletedDocuments));
      }
    }
    
    // Remove from deleted customers
    const updatedDeletedCustomers = deletedCustomers.filter((c: any) => c.id !== customerId);
    localStorage.setItem(DELETED_CUSTOMERS_KEY, JSON.stringify(updatedDeletedCustomers));
    
    return true;
  } catch (error) {
    console.error('Error restoring customer from trash:', error);
    return false;
  }
};

// Function to permanently delete a customer and all related data
export const permanentlyDeleteCustomer = (customerId: string) => {
  try {
    // Get deleted customers
    const savedDeletedCustomers = localStorage.getItem(DELETED_CUSTOMERS_KEY);
    if (!savedDeletedCustomers) return false;
    
    const deletedCustomers = JSON.parse(savedDeletedCustomers);
    
    // Remove customer from deleted customers
    const updatedDeletedCustomers = deletedCustomers.filter((c: any) => c.id !== customerId);
    localStorage.setItem(DELETED_CUSTOMERS_KEY, JSON.stringify(updatedDeletedCustomers));
    
    // Remove related devices
    const savedDeletedDevices = localStorage.getItem(DELETED_DEVICES_KEY);
    if (savedDeletedDevices) {
      const deletedDevices = JSON.parse(savedDeletedDevices);
      const updatedDeletedDevices = deletedDevices.filter((d: any) => d.deletedWithCustomer !== customerId);
      localStorage.setItem(DELETED_DEVICES_KEY, JSON.stringify(updatedDeletedDevices));
    }
    
    // Remove related services
    const savedDeletedServices = localStorage.getItem(DELETED_SERVICES_KEY);
    if (savedDeletedServices) {
      const deletedServices = JSON.parse(savedDeletedServices);
      const updatedDeletedServices = deletedServices.filter((s: any) => s.deletedWithCustomer !== customerId);
      localStorage.setItem(DELETED_SERVICES_KEY, JSON.stringify(updatedDeletedServices));
    }
    
    // Remove related documents
    const savedDeletedDocuments = localStorage.getItem(DELETED_DOCUMENTS_KEY);
    if (savedDeletedDocuments) {
      const deletedDocuments = JSON.parse(savedDeletedDocuments);
      const updatedDeletedDocuments = deletedDocuments.filter((d: any) => d.deletedWithCustomer !== customerId);
      localStorage.setItem(DELETED_DOCUMENTS_KEY, JSON.stringify(updatedDeletedDocuments));
    }
    
    return true;
  } catch (error) {
    console.error('Error permanently deleting customer:', error);
    return false;
  }
};

// Function to get all deleted customers
export const getDeletedCustomers = () => {
  try {
    const savedDeletedCustomers = localStorage.getItem(DELETED_CUSTOMERS_KEY);
    return savedDeletedCustomers ? JSON.parse(savedDeletedCustomers) : [];
  } catch (error) {
    console.error('Error getting deleted customers:', error);
    return [];
  }
};

// Function to check and delete items that have been in trash for more than 60 days
export const cleanupExpiredTrashItems = () => {
  try {
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000)); // 60 days in milliseconds
    let totalDeletedCount = 0;
    
    // Check deleted customers
    const savedDeletedCustomers = localStorage.getItem(DELETED_CUSTOMERS_KEY);
    if (savedDeletedCustomers) {
      const deletedCustomers = JSON.parse(savedDeletedCustomers);
      const customersToDelete: string[] = [];
      
      // Find customers that have been in trash for more than 60 days
      deletedCustomers.forEach((customer: any) => {
        if (customer.deletedAt) {
          const deletedDate = new Date(customer.deletedAt);
          if (deletedDate < sixtyDaysAgo) {
            customersToDelete.push(customer.id);
          }
        }
      });
      
      // Delete expired customers
      customersToDelete.forEach(customerId => {
        permanentlyDeleteCustomer(customerId);
      });
      
      totalDeletedCount += customersToDelete.length;
    }
    
    // Check deleted devices
    const savedDeletedDevices = localStorage.getItem(DELETED_DEVICES_KEY);
    if (savedDeletedDevices) {
      const deletedDevices = JSON.parse(savedDeletedDevices);
      const devicesToDelete: string[] = [];
      
      // Find devices that have been in trash for more than 60 days
      deletedDevices.forEach((device: any) => {
        if (device.deletedAt) {
          const deletedDate = new Date(device.deletedAt);
          if (deletedDate < sixtyDaysAgo) {
            devicesToDelete.push(device.id);
          }
        }
      });
      
      // Delete expired devices
      const { permanentlyDeleteDevice } = require('./device-trash-utils');
      devicesToDelete.forEach(deviceId => {
        permanentlyDeleteDevice(deviceId);
      });
      
      totalDeletedCount += devicesToDelete.length;
    }
    
    // Check deleted services
    const savedDeletedServices = localStorage.getItem(DELETED_SERVICES_KEY);
    if (savedDeletedServices) {
      const deletedServices = JSON.parse(savedDeletedServices);
      const servicesToDelete: string[] = [];
      
      // Find services that have been in trash for more than 60 days
      deletedServices.forEach((service: any) => {
        if (service.deletedAt) {
          const deletedDate = new Date(service.deletedAt);
          if (deletedDate < sixtyDaysAgo) {
            servicesToDelete.push(service.id);
          }
        }
      });
      
      // Delete expired services
      const { permanentlyDeleteService } = require('./service-trash-utils');
      servicesToDelete.forEach(serviceId => {
        permanentlyDeleteService(serviceId);
      });
      
      totalDeletedCount += servicesToDelete.length;
    }
    
    // Check deleted documents
    const savedDeletedDocuments = localStorage.getItem(DELETED_DOCUMENTS_KEY);
    if (savedDeletedDocuments) {
      const deletedDocuments = JSON.parse(savedDeletedDocuments);
      const documentsToDelete: string[] = [];
      
      // Find documents that have been in trash for more than 60 days
      deletedDocuments.forEach((document: any) => {
        if (document.deletedAt) {
          const deletedDate = new Date(document.deletedAt);
          if (deletedDate < sixtyDaysAgo) {
            documentsToDelete.push(document.id);
          }
        }
      });
      
      // Delete expired documents
      const { permanentlyDeleteDocument } = require('./document-trash-utils');
      documentsToDelete.forEach(documentId => {
        permanentlyDeleteDocument(documentId);
      });
      
      totalDeletedCount += documentsToDelete.length;
    }
    
    return totalDeletedCount; // Return total number of deleted items
  } catch (error) {
    console.error('Error cleaning up expired trash items:', error);
    return -1; // Error occurred
  }
};

// Function to initialize trash cleanup on application start
export const initTrashCleanup = () => {
  // Run cleanup immediately
  const deletedCount = cleanupExpiredTrashItems();
  if (deletedCount > 0) {
    console.log(`Automatically deleted ${deletedCount} expired items from trash`);
  }
  
  // Schedule daily cleanup
  // This will run once per day when the application is open
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  setInterval(cleanupExpiredTrashItems, CLEANUP_INTERVAL);
};