// Utility functions for handling device trash bin functionality

// Key for storing deleted devices in localStorage
const DELETED_DEVICES_KEY = 'pauloCell_deleted_devices';

// Function to move a device to trash
export const moveDeviceToTrash = (deviceId: string) => {
  try {
    // Get current devices
    const savedDevices = localStorage.getItem('pauloCell_devices');
    if (!savedDevices) return false;
    
    const devices = JSON.parse(savedDevices);
    const deviceToDelete = devices.find((d: any) => d.id === deviceId);
    
    if (!deviceToDelete) return false;
    
    // Remove from active devices
    const updatedDevices = devices.filter((d: any) => d.id !== deviceId);
    localStorage.setItem('pauloCell_devices', JSON.stringify(updatedDevices));
    
    // Add to deleted devices
    const savedDeletedDevices = localStorage.getItem(DELETED_DEVICES_KEY);
    const deletedDevices = savedDeletedDevices ? JSON.parse(savedDeletedDevices) : [];
    
    deletedDevices.push({
      ...deviceToDelete,
      deletedAt: new Date().toISOString()
    });
    
    localStorage.setItem(DELETED_DEVICES_KEY, JSON.stringify(deletedDevices));
    return true;
  } catch (error) {
    console.error('Error moving device to trash:', error);
    return false;
  }
};

// Function to restore a device from trash
export const restoreDeviceFromTrash = (deviceId: string) => {
  try {
    // Get deleted devices
    const savedDeletedDevices = localStorage.getItem(DELETED_DEVICES_KEY);
    if (!savedDeletedDevices) return false;
    
    const deletedDevices = JSON.parse(savedDeletedDevices);
    const deviceToRestore = deletedDevices.find((d: any) => d.id === deviceId);
    
    if (!deviceToRestore) return false;
    
    // Remove deletedAt property and any other trash-specific properties
    const { deletedAt, deletedWithCustomer, ...deviceData } = deviceToRestore;
    
    // Add back to active devices
    const savedDevices = localStorage.getItem('pauloCell_devices');
    const devices = savedDevices ? JSON.parse(savedDevices) : [];
    devices.push(deviceData);
    localStorage.setItem('pauloCell_devices', JSON.stringify(devices));
    
    // Remove from deleted devices
    const updatedDeletedDevices = deletedDevices.filter((d: any) => d.id !== deviceId);
    localStorage.setItem(DELETED_DEVICES_KEY, JSON.stringify(updatedDeletedDevices));
    
    return true;
  } catch (error) {
    console.error('Error restoring device from trash:', error);
    return false;
  }
};

// Function to permanently delete a device
export const permanentlyDeleteDevice = (deviceId: string) => {
  try {
    const savedDeletedDevices = localStorage.getItem(DELETED_DEVICES_KEY);
    if (!savedDeletedDevices) return false;
    
    const deletedDevices = JSON.parse(savedDeletedDevices);
    const updatedDeletedDevices = deletedDevices.filter((d: any) => d.id !== deviceId);
    
    localStorage.setItem(DELETED_DEVICES_KEY, JSON.stringify(updatedDeletedDevices));
    return true;
  } catch (error) {
    console.error('Error permanently deleting device:', error);
    return false;
  }
};

// Function to get all deleted devices
export const getDeletedDevices = () => {
  try {
    const savedDeletedDevices = localStorage.getItem(DELETED_DEVICES_KEY);
    return savedDeletedDevices ? JSON.parse(savedDeletedDevices) : [];
  } catch (error) {
    console.error('Error getting deleted devices:', error);
    return [];
  }
};