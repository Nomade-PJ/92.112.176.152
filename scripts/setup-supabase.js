#!/usr/bin/env node

// Script para configurar o Supabase
// Uso: node scripts/setup-supabase.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { exec } from 'child_process';

// Obter diretório atual em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
const rootDir = path.join(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

// Verificar variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = process.env.USE_SUPABASE;

if (!useSupabase || useSupabase !== 'true') {
  console.error('⚠️ AVISO: Supabase não está ativado no arquivo .env.');
  console.error('Defina USE_SUPABASE=true antes de executar este script.');
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ As variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.');
  process.exit(1);
}

console.log('✅ Configurações do Supabase encontradas no arquivo .env');
console.log(`URL: ${supabaseUrl}`);

// Verificar existência do arquivo SQL
const schemaPath = path.join(rootDir, 'supabase-schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Arquivo supabase-schema.sql não encontrado!');
  console.error('Este arquivo é necessário para criar o esquema do banco de dados.');
  process.exit(1);
}

console.log('✅ Arquivo supabase-schema.sql encontrado');

// Instruções para configurar o Supabase manualmente
console.log('\n=================================================================');
console.log('INSTRUÇÕES PARA CONFIGURAR O SUPABASE');
console.log('=================================================================');
console.log('1. Acesse o dashboard do Supabase em: https://supabase.com/dashboard');
console.log('2. Crie um novo projeto ou use um existente');
console.log('3. Vá para o SQL Editor');
console.log('4. Cole o conteúdo do arquivo supabase-schema.sql e execute');
console.log('5. Verifique se as tabelas foram criadas corretamente');
console.log('\nVocê também pode executar o comando abaixo para verificar se tudo está configurado:');
console.log('node scripts/migrate-to-supabase.js\n');

console.log('Deseja instalar a CLI do Supabase para gerenciamento local? (S/N)');
process.stdin.once('data', (data) => {
  const input = data.toString().trim().toLowerCase();
  if (input === 's' || input === 'sim') {
    console.log('Instalando CLI do Supabase...');
    exec('npm install -g supabase', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro ao instalar a CLI do Supabase:', error);
        process.exit(1);
      }
      console.log(stdout);
      console.log('✅ CLI do Supabase instalada com sucesso!');
      console.log('Para iniciar o Supabase localmente, execute:');
      console.log('supabase init');
      console.log('supabase start');
      process.exit(0);
    });
  } else {
    console.log('✅ Configuração manual concluída!');
    process.exit(0);
  }
}); 