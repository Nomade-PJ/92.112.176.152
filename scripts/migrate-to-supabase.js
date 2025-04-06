#!/usr/bin/env node

/**
 * Script de Migração para Supabase - PauloCell
 * 
 * Este script migra dados do localStorage para o Supabase
 * Executar com: node scripts/migrate-to-supabase.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Configuração inicial
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(rootDir, '.env') });

// Configurações do Supabase
const SUPABASE_URL = 'http://92.112.176.152:8000';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE3OTk1MzU2MDB9.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

// Verificar configurações
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️ Variáveis de ambiente do Supabase não encontradas!');
  console.error('Configure SUPABASE_URL e SUPABASE_ANON_KEY no arquivo .env');
  process.exit(1);
}

// Criar cliente Supabase com a chave de serviço, se disponível (para mais permissões)
const supabase = createClient(
  SUPABASE_URL, 
  SUPABASE_ANON_KEY
);

// Interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Caminho para o arquivo de dados localStorage exportados
const exportedDataPath = path.join(rootDir, 'localStorage-export.json');

// Verificar se existe um arquivo de dados exportados do localStorage
const checkExportedData = () => {
  try {
    if (fs.existsSync(exportedDataPath)) {
      return JSON.parse(fs.readFileSync(exportedDataPath, 'utf8'));
    }
  } catch (error) {
    console.error('❌ Erro ao ler arquivo de dados exportados:', error);
  }
  return null;
};

// Migrar dados do arquivo para o Supabase
const migrateFromFile = async (data) => {
  try {
    console.log('Iniciando migração de dados do arquivo para o Supabase...');
    
    // Migrar clientes
    if (data.pauloCell_customers) {
      const customers = JSON.parse(data.pauloCell_customers);
      console.log(`Migrando ${customers.length} clientes...`);
      
      for (const customer of customers) {
        const { error } = await supabase
          .from('customers')
          .upsert(customer, { onConflict: 'id' });
        
        if (error) {
          console.error(`❌ Erro ao migrar cliente ${customer.id}:`, error);
        }
      }
      
      console.log(`✅ Migrados ${customers.length} clientes`);
    }
    
    // Migrar dispositivos
    if (data.pauloCell_devices) {
      const devices = JSON.parse(data.pauloCell_devices);
      console.log(`Migrando ${devices.length} dispositivos...`);
      
      for (const device of devices) {
        const { error } = await supabase
          .from('devices')
          .upsert(device, { onConflict: 'id' });
        
        if (error) {
          console.error(`❌ Erro ao migrar dispositivo ${device.id}:`, error);
        }
      }
      
      console.log(`✅ Migrados ${devices.length} dispositivos`);
    }
    
    // Migrar serviços
    if (data.pauloCell_services) {
      const services = JSON.parse(data.pauloCell_services);
      console.log(`Migrando ${services.length} serviços...`);
      
      for (const service of services) {
        const { error } = await supabase
          .from('services')
          .upsert(service, { onConflict: 'id' });
        
        if (error) {
          console.error(`❌ Erro ao migrar serviço ${service.id}:`, error);
        }
      }
      
      console.log(`✅ Migrados ${services.length} serviços`);
    }
    
    // Migrar inventário
    if (data.pauloCell_inventory) {
      const inventory = JSON.parse(data.pauloCell_inventory);
      console.log(`Migrando ${inventory.length} itens de inventário...`);
      
      for (const item of inventory) {
        const { error } = await supabase
          .from('inventory')
          .upsert(item, { onConflict: 'id' });
        
        if (error) {
          console.error(`❌ Erro ao migrar item de inventário ${item.id}:`, error);
        }
      }
      
      console.log(`✅ Migrados ${inventory.length} itens de inventário`);
    }
    
    // Migrar documentos
    if (data.pauloCell_documents) {
      const documents = JSON.parse(data.pauloCell_documents);
      console.log(`Migrando ${documents.length} documentos...`);
      
      for (const doc of documents) {
        const { error } = await supabase
          .from('documents')
          .upsert(doc, { onConflict: 'id' });
        
        if (error) {
          console.error(`❌ Erro ao migrar documento ${doc.id}:`, error);
        }
      }
      
      console.log(`✅ Migrados ${documents.length} documentos`);
    }
    
    // Migrar configurações da empresa
    if (data.pauloCell_companyData) {
      const companyData = JSON.parse(data.pauloCell_companyData);
      console.log('Migrando configurações da empresa...');
      
      const { error } = await supabase
        .from('settings')
        .upsert({
          type: 'company_data',
          data: companyData,
          updated_at: new Date()
        }, { onConflict: 'type' });
      
      if (error) {
        console.error('❌ Erro ao migrar configurações da empresa:', error);
      } else {
        console.log('✅ Migradas configurações da empresa');
      }
    }
    
    // Migrar configurações de notificação
    if (data.pauloCell_notificationSettings) {
      const notificationSettings = JSON.parse(data.pauloCell_notificationSettings);
      console.log('Migrando configurações de notificação...');
      
      const { error } = await supabase
        .from('settings')
        .upsert({
          type: 'notification_settings',
          data: notificationSettings,
          updated_at: new Date()
        }, { onConflict: 'type' });
      
      if (error) {
        console.error('❌ Erro ao migrar configurações de notificação:', error);
      } else {
        console.log('✅ Migradas configurações de notificação');
      }
    }
    
    // Migrar configurações de API
    if (data.pauloCell_invoiceApiConfig) {
      const apiSettings = JSON.parse(data.pauloCell_invoiceApiConfig);
      console.log('Migrando configurações de API...');
      
      const { error } = await supabase
        .from('settings')
        .upsert({
          type: 'api_settings',
          data: apiSettings,
          updated_at: new Date()
        }, { onConflict: 'type' });
      
      if (error) {
        console.error('❌ Erro ao migrar configurações de API:', error);
      } else {
        console.log('✅ Migradas configurações de API');
      }
    }
    
    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
};

// Função principal
const main = async () => {
  console.log('=== Script de Migração para o Supabase ===\n');
  
  // Verificar se o Supabase está configurado e acessível
  try {
    console.log('Verificando conexão com o Supabase...');
    const { error } = await supabase.from('settings').select('count');
    
    if (error) {
      console.error('❌ Erro ao conectar ao Supabase:', error.message);
      console.error('Verifique se as credenciais estão corretas e se o projeto está online.');
      process.exit(1);
    }
    
    console.log('✅ Conexão com o Supabase estabelecida com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao conectar ao Supabase:', error.message);
    process.exit(1);
  }
  
  // Verificar se há dados exportados
  const exportedData = checkExportedData();
  
  if (exportedData) {
    console.log('✅ Arquivo de dados exportados encontrado.\n');
    
    rl.question('Deseja iniciar a migração dos dados para o Supabase? (S/N): ', async (answer) => {
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
        await migrateFromFile(exportedData);
        rl.close();
      } else {
        console.log('Migração cancelada pelo usuário.');
        rl.close();
      }
    });
  } else {
    console.log('❌ Arquivo de dados exportados não encontrado.');
    console.log('\nPara exportar os dados do localStorage:');
    console.log('1. Acesse o aplicativo no navegador (versão antiga)');
    console.log('2. Abra o console do navegador (F12)');
    console.log('3. Execute o seguinte código:');
    console.log(`
const exportData = {};
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('pauloCell_')) {
    exportData[key] = localStorage.getItem(key);
  }
});
const dataStr = JSON.stringify(exportData);
const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
const exportFileDefaultName = 'localStorage-export.json';
const linkElement = document.createElement('a');
linkElement.setAttribute('href', dataUri);
linkElement.setAttribute('download', exportFileDefaultName);
linkElement.click();
`);
    
    console.log('\nDepois, coloque o arquivo exportado na raiz do projeto e execute este script novamente.');
    
    rl.question('\nDeseja tentar migrar diretamente do LocalStorage sem exportar? (S/N): ', (answer) => {
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
        console.log('\nPara migrar diretamente, execute:');
        console.log('1. Abra o aplicativo no navegador');
        console.log('2. Abra o console do navegador (F12)');
        console.log('3. Cole e execute o seguinte código (substituindo as variáveis pelos valores corretos):');
        console.log(`
const supabaseUrl = 'https://seu-projeto.supabase.co';
const supabaseKey = 'sua-chave-anon-ou-service';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

async function migrateToSupabase() {
  // Migrar clientes
  const customers = JSON.parse(localStorage.getItem('pauloCell_customers') || '[]');
  for (const customer of customers) {
    await supabase.from('customers').upsert(customer, { onConflict: 'id' });
  }
  
  // Migrar dispositivos
  const devices = JSON.parse(localStorage.getItem('pauloCell_devices') || '[]');
  for (const device of devices) {
    await supabase.from('devices').upsert(device, { onConflict: 'id' });
  }
  
  // Continue com os outros dados...
  
  console.log('Migração concluída!');
}

migrateToSupabase();
`);
      }
      
      rl.close();
    });
  }
};

// Executar a função principal
main().catch(error => {
  console.error('Erro inesperado:', error);
  process.exit(1);
}); 