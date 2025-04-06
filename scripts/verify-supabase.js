#!/usr/bin/env node

/**
 * Script de Verificação do Supabase - PauloCell
 * 
 * Este script verifica a conexão com o Supabase e se as tabelas necessárias existem.
 * Executar com: node scripts/verify-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'http://92.112.176.152:8000';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE3OTk1MzU2MDB9.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

// Lista de tabelas esperadas
const expectedTables = [
  'customers',
  'devices',
  'services',
  'inventory',
  'documents',
  'settings',
  'trash_bin'
];

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Função para verificar se uma tabela existe
async function checkTable(tableName) {
  try {
    console.log(`Verificando tabela '${tableName}'...`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`⚠️ Tabela '${tableName}' existe, mas está vazia.`);
        return true;
      }
      console.error(`❌ Erro ao verificar tabela '${tableName}':`, error.message);
      return false;
    }
    
    console.log(`✅ Tabela '${tableName}' existe e está acessível.`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao verificar tabela '${tableName}':`, error.message);
    return false;
  }
}

// Função principal para executar todos os testes
async function verifySupabase() {
  console.log('=== Iniciando verificação do Supabase ===\n');
  console.log('URL do Supabase:', SUPABASE_URL);
  
  // Verificar conexão
  try {
    console.log('\nVerificando conexão com o Supabase...');
    const { error } = await supabase.from('settings').select('count');
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro de conexão:', error.message);
      console.error('Verifique se as credenciais estão corretas e se o projeto Supabase está online.');
      process.exit(1);
    }
    
    console.log('✅ Conexão com o Supabase estabelecida com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao conectar ao Supabase:', error.message);
    console.error('Verifique se o URL e a chave API estão corretos.');
    process.exit(1);
  }
  
  // Verificar existência das tabelas
  console.log('\n=== Verificando tabelas do banco de dados ===\n');
  let missingTables = 0;
  
  for (const table of expectedTables) {
    const exists = await checkTable(table);
    if (!exists) missingTables++;
  }
  
  // Resumo final
  console.log('\n=== Resumo da Verificação ===');
  if (missingTables === 0) {
    console.log('✅ Todas as tabelas foram encontradas e estão acessíveis!');
    console.log('O Supabase está configurado corretamente.');
  } else {
    console.log(`❌ ${missingTables} tabela(s) não foram encontradas ou apresentaram erros.`);
    console.log('Execute o script setup-supabase.js para configurar o esquema do banco de dados.');
  }
}

// Executar verificação
verifySupabase().catch(error => {
  console.error('Erro inesperado:', error);
  process.exit(1);
}); 