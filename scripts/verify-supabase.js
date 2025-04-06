#!/usr/bin/env node

// Script para verificar a configuração do Supabase
// Uso: node scripts/verify-supabase.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Obter diretório atual em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
const rootDir = path.join(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

// Verificar variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = process.env.USE_SUPABASE;

if (!useSupabase || useSupabase !== 'true') {
  console.error('⚠️ AVISO: Supabase não está ativado no arquivo .env.');
  console.error('Defina USE_SUPABASE=true antes de executar este script.');
  process.exit(1);
}

if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceKey)) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY) no arquivo .env');
  process.exit(1);
}

// Criar cliente Supabase com a chave de serviço, se disponível (para mais permissões)
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey
);

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
  console.log('URL do Supabase:', supabaseUrl);
  
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
  
  // Lista de tabelas para verificar
  const tables = [
    'customers',
    'devices',
    'services',
    'inventory',
    'documents',
    'settings',
    'trash_bin'
  ];
  
  // Verificar existência das tabelas
  console.log('\n=== Verificando tabelas do banco de dados ===\n');
  let missingTables = 0;
  
  for (const table of tables) {
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