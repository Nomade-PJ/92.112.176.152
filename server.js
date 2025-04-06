// Servidor Express para hospedar a aplicação React e a API em produção
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { createClient } from '@supabase/supabase-js';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';

// Configuração para usar __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config();

// Porta para o servidor
const PORT = process.env.PORT || 3000;

// Cliente Supabase para o servidor
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Chave com privilégios admin para o servidor

// Verificar variáveis de ambiente essenciais
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️ Variáveis de ambiente do Supabase não encontradas!');
  console.error('VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias para o servidor.');
  process.exit(1);
}

// Criar cliente Supabase com a service role key (apenas para o servidor)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para verificar a conexão com o Supabase
async function checkSupabaseConnection() {
  try {
    console.log('Verificando conexão com o Supabase...');
    const { error } = await supabase.from('settings').select('count');
    
    if (error) {
      console.error('❌ Erro ao conectar ao Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com o Supabase estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro inesperado ao conectar ao Supabase:', error.message);
    return false;
  }
}

const app = express();

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", supabaseUrl, "https://api.emailjs.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.emailjs.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://www.gravatar.com", "https://ui-avatars.com"]
    }
  }
}));

// Middleware para compressão
app.use(compression());

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.VITE_APP_URL].filter(Boolean) 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Configurar middleware de sessão
app.use(session({
  secret: process.env.JWT_SECRET || 'paulocell-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies em produção
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Middleware para logging de requisições
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Injetar cliente Supabase nas requisições
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// =================================
// Definir rotas da API
// =================================

// Rota para verificar status do servidor
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ****************************************
// API PARA CLIENTES
// ****************************************
app.get('/api/customers', async (req, res) => {
  try {
    const { data, error } = await supabase.from('customers').select('*');
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    // Primeiro, buscamos o cliente para salvar na lixeira
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Salvar na lixeira
    await supabase
      .from('trash_bin')
      .insert({
        type: 'customer',
        data: customer,
        deleted_at: new Date()
      });
    
    // Excluir o cliente
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', req.params.id);
    
    if (deleteError) throw deleteError;
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// ****************************************
// ROTAS PARA OUTROS RECURSOS (Semelhantes às de clientes)
// ****************************************
// Você pode adicionar rotas para devices, services, inventory, etc. seguindo o mesmo padrão

// =================================
// Iniciar servidor
// =================================

// Verificar conexão com o Supabase antes de iniciar o servidor
checkSupabaseConnection().then(isConnected => {
  if (!isConnected && process.env.NODE_ENV === 'production') {
    console.error('⚠️ AVISO: Não foi possível estabelecer conexão com o Supabase.');
    console.error('O servidor será iniciado, mas algumas funcionalidades podem não funcionar corretamente.');
  }
  
  // Servir arquivos estáticos do build React
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Todas as outras requisições GET não tratadas retornarão nossa aplicação React
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
  
  // Iniciar o servidor
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📁 Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 URL: ${process.env.VITE_APP_URL || `http://localhost:${PORT}`}`);
    console.log(`🔌 Supabase: ${supabaseUrl}`);
  });
}).catch(error => {
  console.error('Erro fatal ao iniciar o servidor:', error);
  process.exit(1);
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  
  // Registrar erro no Supabase (tabela de logs)
  if (process.env.ENABLE_ERROR_REPORTING === 'true') {
    supabase.from('activity_logs').insert({
      action: 'error',
      details: {
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
      }
    }).then(() => {
      console.log('Erro registrado no Supabase');
    }).catch((logError) => {
      console.error('Erro ao registrar erro no Supabase:', logError);
    });
  }
  
  res.status(500).json({ 
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'production' ? 'Detalhes do erro não disponíveis' : err.message
  });
}); 