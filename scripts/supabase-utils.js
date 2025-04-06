#!/usr/bin/env node

/**
 * Utilitários para Supabase - PauloCell
 * 
 * Este script permite:
 * 1. Testar a conexão com o Supabase
 * 2. Criar um usuário administrativo
 * 3. Verificar os usuários existentes
 */

const { createClient } = require('@supabase/supabase-js');

// URL e chaves do Supabase - valores fixos
const SUPABASE_URL = 'http://92.112.176.152:8000';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE3OTk1MzU2MDB9.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTc5OTUzNTYwMH0.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

// Credenciais do usuário admin
const ADMIN_EMAIL = 'canalstvoficial@gmail.com';
const ADMIN_PASSWORD = 'paulocell@admin1';

// Cria o cliente Supabase com chave anônima (para operações públicas)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cria o cliente Supabase com service role key (para operações administrativas)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Testa a conexão com o Supabase
 */
async function testConnection() {
  console.log('🔄 Testando conexão com o Supabase...');

  try {
    // Tentar buscar algum dado simples
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Conexão com o Supabase estabelecida com sucesso!');
    console.log('📊 Dados de teste:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao Supabase:', error.message);
    console.error('Detalhes:', error);
    return false;
  }
}

/**
 * Cria um usuário administrador
 */
async function createAdminUser() {
  console.log(`🔄 Criando usuário administrador (${ADMIN_EMAIL})...`);

  try {
    // Verificar se o usuário já existe
    const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (searchError) {
      throw searchError;
    }
    
    const userExists = existingUsers.users.some(user => user.email === ADMIN_EMAIL);
    
    if (userExists) {
      console.log('ℹ️ O usuário administrador já existe.');
      return true;
    }

    // Criar o usuário
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { 
        full_name: 'Paulo Cell Admin'
      }
    });

    if (error) {
      throw error;
    }

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('📊 Detalhes do usuário:', data.user);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error.message);
    console.error('🔍 Se você estiver tendo problemas com o Service Role Key, verifique:');
    console.error('   1. Se o contêiner Supabase está rodando corretamente');
    console.error('   2. Se a tabela auth.users existe no banco de dados');
    console.error('   3. Se você está usando a chave de serviço correta');
    
    // Tentar uma abordagem alternativa com signup normal
    console.log('🔄 Tentando criar usuário com método alternativo...');
    
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        options: {
          data: { full_name: 'Paulo Cell Admin' }
        }
      });
      
      if (signupError) {
        throw signupError;
      }
      
      console.log('✅ Usuário criado com método alternativo!');
      console.log('📊 Detalhes do usuário:', data.user);
      return true;
    } catch (altError) {
      console.error('❌ Método alternativo também falhou:', altError.message);
      return false;
    }
  }
}

/**
 * Lista os usuários existentes
 */
async function listUsers() {
  console.log('🔄 Listando usuários existentes...');

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      throw error;
    }

    console.log('✅ Usuários recuperados com sucesso!');
    console.log('📊 Total de usuários:', data.users.length);
    
    data.users.forEach((user, index) => {
      console.log(`\n👤 Usuário ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Criado em: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
      console.log(`   Metadata:`, user.user_metadata);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error.message);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  console.log('🚀 Utilitário Supabase - PauloCell');
  console.log('=================================');
  console.log(`URL do Supabase: ${SUPABASE_URL}`);
  console.log('');
  
  // Se não houver argumentos, mostrar ajuda
  if (args.length === 0) {
    console.log('📌 Comandos disponíveis:');
    console.log('   test        - Testa a conexão com o Supabase');
    console.log('   create-user - Cria um usuário administrador');
    console.log('   list-users  - Lista os usuários existentes');
    console.log('   all         - Executa todos os comandos acima');
    console.log('');
    console.log('Exemplo: node supabase-utils.js test');
    return;
  }
  
  const command = args[0];
  
  if (command === 'test' || command === 'all') {
    await testConnection();
    console.log('');
  }
  
  if (command === 'create-user' || command === 'all') {
    await createAdminUser();
    console.log('');
  }
  
  if (command === 'list-users' || command === 'all') {
    await listUsers();
    console.log('');
  }
  
  console.log('✨ Operação concluída!');
}

// Executar a função principal
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 