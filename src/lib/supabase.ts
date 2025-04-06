// Configuração do Supabase para o PauloCell
import { createClient } from '@supabase/supabase-js';

// URL e chaves do Supabase - valores configuráveis
// No ambiente de produção, estas serão substituídas por variáveis de ambiente
const supabaseUrl = 'http://92.112.176.152:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE3OTk1MzU2MDB9.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTc5OTUzNTYwMH0.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

console.log('Inicializando cliente Supabase com URL:', supabaseUrl);

// Cria o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funções helpers para migração do localStorage

// Clientes
export async function getCustomers() {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) {
    console.error('Erro ao buscar clientes:', error);
    return null;
  }
  return data;
}

export async function saveCustomer(customer: any) {
  const { data, error } = await supabase
    .from('customers')
    .upsert(customer, { onConflict: 'id' })
    .select();
  
  if (error) {
    console.error('Erro ao salvar cliente:', error);
    return null;
  }
  return data;
}

// Dispositivos
export async function getDevices() {
  const { data, error } = await supabase.from('devices').select('*');
  if (error) {
    console.error('Erro ao buscar dispositivos:', error);
    return null;
  }
  return data;
}

export async function saveDevice(device: any) {
  const { data, error } = await supabase
    .from('devices')
    .upsert(device, { onConflict: 'id' })
    .select();
  
  if (error) {
    console.error('Erro ao salvar dispositivo:', error);
    return null;
  }
  return data;
}

// Serviços
export async function getServices() {
  const { data, error } = await supabase.from('services').select('*');
  if (error) {
    console.error('Erro ao buscar serviços:', error);
    return null;
  }
  return data;
}

export async function saveService(service: any) {
  const { data, error } = await supabase
    .from('services')
    .upsert(service, { onConflict: 'id' })
    .select();
  
  if (error) {
    console.error('Erro ao salvar serviço:', error);
    return null;
  }
  return data;
}

// Inventário
export async function getInventory() {
  const { data, error } = await supabase.from('inventory').select('*');
  if (error) {
    console.error('Erro ao buscar itens do inventário:', error);
    return null;
  }
  return data;
}

export async function saveInventoryItem(item: any) {
  const { data, error } = await supabase
    .from('inventory')
    .upsert(item, { onConflict: 'id' })
    .select();
  
  if (error) {
    console.error('Erro ao salvar item do inventário:', error);
    return null;
  }
  return data;
}

// Documentos
export async function getDocuments() {
  const { data, error } = await supabase.from('documents').select('*');
  if (error) {
    console.error('Erro ao buscar documentos:', error);
    return null;
  }
  return data;
}

export async function saveDocument(document: any) {
  const { data, error } = await supabase
    .from('documents')
    .upsert(document, { onConflict: 'id' })
    .select();
  
  if (error) {
    console.error('Erro ao salvar documento:', error);
    return null;
  }
  return data;
}

// Configurações da empresa
export async function getCompanyData() {
  const { data, error } = await supabase.from('settings').select('*').eq('type', 'company_data').single();
  if (error && error.code !== 'PGRST116') { // PGRST116 é o código para "nenhum resultado encontrado"
    console.error('Erro ao buscar dados da empresa:', error);
    return null;
  }
  return data?.data || null;
}

export async function saveCompanyData(companyData: any) {
  const { data, error } = await supabase
    .from('settings')
    .upsert(
      { 
        type: 'company_data', 
        data: companyData,
        updated_at: new Date()
      }, 
      { onConflict: 'type' }
    )
    .select();
  
  if (error) {
    console.error('Erro ao salvar dados da empresa:', error);
    return null;
  }
  return data;
}

// Migrando lixeira
export async function getTrashItems(type: string) {
  const { data, error } = await supabase.from('trash_bin').select('*').eq('type', type);
  if (error) {
    console.error(`Erro ao buscar itens da lixeira do tipo ${type}:`, error);
    return null;
  }
  return data;
}

export async function saveTrashItem(item: any) {
  const { data, error } = await supabase
    .from('trash_bin')
    .insert({
      type: item.type,
      data: item.data,
      deleted_at: new Date()
    })
    .select();
  
  if (error) {
    console.error('Erro ao salvar item na lixeira:', error);
    return null;
  }
  return data;
}

// Autenticação (migrando do Firebase para Supabase)
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) {
    console.error('Erro ao fazer login com Google:', error);
    return { error };
  }
  return { data };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erro ao fazer logout:', error);
    return { error };
  }
  return { success: true };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
  return data?.user || null;
}

// Funções de migração de dados localStorage -> Supabase
export async function migrateLocalStorageToSupabase() {
  try {
    console.log('Iniciando migração de dados do localStorage para o Supabase...');
    
    // Migrar clientes
    const localCustomers = localStorage.getItem('pauloCell_customers');
    if (localCustomers) {
      const customers = JSON.parse(localCustomers);
      for (const customer of customers) {
        await saveCustomer(customer);
      }
      console.log(`✅ Migrados ${customers.length} clientes`);
    }
    
    // Migrar dispositivos
    const localDevices = localStorage.getItem('pauloCell_devices');
    if (localDevices) {
      const devices = JSON.parse(localDevices);
      for (const device of devices) {
        await saveDevice(device);
      }
      console.log(`✅ Migrados ${devices.length} dispositivos`);
    }
    
    // Migrar serviços
    const localServices = localStorage.getItem('pauloCell_services');
    if (localServices) {
      const services = JSON.parse(localServices);
      for (const service of services) {
        await saveService(service);
      }
      console.log(`✅ Migrados ${services.length} serviços`);
    }
    
    // Migrar inventário
    const localInventory = localStorage.getItem('pauloCell_inventory');
    if (localInventory) {
      const inventory = JSON.parse(localInventory);
      for (const item of inventory) {
        await saveInventoryItem(item);
      }
      console.log(`✅ Migrados ${inventory.length} itens de inventário`);
    }
    
    // Migrar documentos
    const localDocuments = localStorage.getItem('pauloCell_documents');
    if (localDocuments) {
      const documents = JSON.parse(localDocuments);
      for (const doc of documents) {
        await saveDocument(doc);
      }
      console.log(`✅ Migrados ${documents.length} documentos`);
    }
    
    // Migrar dados da empresa
    const localCompanyData = localStorage.getItem('pauloCell_companyData');
    if (localCompanyData) {
      const companyData = JSON.parse(localCompanyData);
      await saveCompanyData(companyData);
      console.log('✅ Migrados dados da empresa');
    }
    
    console.log('✅ Migração completa!');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    return { error };
  }
}

// Verificar se o Supabase está funcionando
export async function testSupabaseConnection() {
  try {
    console.log('Testando conexão com Supabase...');
    const { data, error } = await supabase.from('customers').select('count').single();
    
    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Conexão com Supabase bem-sucedida!', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exceção ao testar Supabase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
} 