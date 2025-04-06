#!/usr/bin/env node

// Script para limpar recursos legados após a migração para o Supabase
// Uso: node scripts/clean-legacy.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import readline from 'readline';

// Obter diretório atual em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
const rootDir = path.join(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

// Interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para remover configurações do Firebase do arquivo .env
const removeFirebaseConfig = () => {
  const envPath = path.join(rootDir, '.env');
  const envProdPath = path.join(rootDir, '.env.production');
  
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/# Configurações do Firebase(.|\n)*?(?=\n# |$)/g, '');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Configurações do Firebase removidas do arquivo .env');
  }
  
  if (fs.existsSync(envProdPath)) {
    let envProdContent = fs.readFileSync(envProdPath, 'utf8');
    envProdContent = envProdContent.replace(/# Configurações do Firebase(.|\n)*?(?=\n# |$)/g, '');
    fs.writeFileSync(envProdPath, envProdContent);
    console.log('✅ Configurações do Firebase removidas do arquivo .env.production');
  }
};

// Função para remover pacotes do Firebase do package.json
const removeFirebasePackages = () => {
  const packageJsonPath = path.join(rootDir, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const firebasePackages = [
      'firebase',
      'firebase-admin',
      'firebase-functions',
      'firebase-tools',
      'reactfire'
    ];
    
    let packagesRemoved = false;
    
    if (packageJson.dependencies) {
      firebasePackages.forEach(pkg => {
        if (packageJson.dependencies[pkg]) {
          delete packageJson.dependencies[pkg];
          packagesRemoved = true;
        }
      });
    }
    
    if (packageJson.devDependencies) {
      firebasePackages.forEach(pkg => {
        if (packageJson.devDependencies[pkg]) {
          delete packageJson.devDependencies[pkg];
          packagesRemoved = true;
        }
      });
    }
    
    if (packagesRemoved) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Pacotes do Firebase removidos do package.json');
      
      console.log('Você deve executar "npm install" para atualizar o package-lock.json');
    } else {
      console.log('Nenhum pacote do Firebase encontrado no package.json');
    }
  }
};

// Função principal
const cleanLegacy = async () => {
  console.log('=== Limpeza de Recursos Legados ===\n');
  
  console.log('Esta ferramenta removerá configurações e dependências legadas do Firebase após a migração para o Supabase.');
  
  rl.question('\nDeseja continuar com a limpeza? (S/N): ', (answer) => {
    if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
      console.log('\nIniciando limpeza...\n');
      
      // Remover configurações do Firebase do .env
      removeFirebaseConfig();
      
      // Remover pacotes do Firebase do package.json
      removeFirebasePackages();
      
      console.log('\n✅ Limpeza concluída!');
      console.log('\nSugestões:');
      console.log('1. Execute "npm install" para atualizar o package-lock.json');
      console.log('2. Remova arquivos de configuração do Firebase manualmente, se existirem:');
      console.log('   - firebase.json');
      console.log('   - .firebaserc');
      console.log('   - firestore.rules');
      console.log('   - firestore.indexes.json');
      console.log('   - src/firebase.js ou src/lib/firebase.js');
    } else {
      console.log('Operação cancelada pelo usuário.');
    }
    
    rl.close();
  });
};

// Executar função principal
cleanLegacy().catch(error => {
  console.error('Erro inesperado:', error);
  process.exit(1);
}); 