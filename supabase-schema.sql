-- Schema para as tabelas do Supabase para o projeto PauloCell
-- Habilitar a extensão UUID para gerar IDs únicos no SQL Editor do Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clientes
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  document TEXT, -- CPF/CNPJ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispositivos
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- Tipo de dispositivo (celular, tablet, etc.)
  brand TEXT, -- Marca
  model TEXT, -- Modelo
  serial_number TEXT, -- Número de série
  imei TEXT, -- IMEI (para celulares)
  color TEXT, -- Cor
  condition TEXT, -- Estado de conservação
  accessories TEXT, -- Acessórios
  notes TEXT, -- Observações
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Serviços
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  status TEXT NOT NULL, -- Status do serviço (pendente, em andamento, concluído, etc.)
  description TEXT NOT NULL, -- Descrição do serviço
  problem TEXT, -- Problema relatado
  solution TEXT, -- Solução aplicada
  price DECIMAL(10, 2), -- Preço do serviço
  discount DECIMAL(10, 2) DEFAULT 0, -- Desconto
  total_price DECIMAL(10, 2), -- Preço total
  payment_method TEXT, -- Método de pagamento
  payment_status TEXT, -- Status do pagamento
  technician TEXT, -- Técnico responsável
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Data de entrada
  estimated_completion_date TIMESTAMP WITH TIME ZONE, -- Data estimada de conclusão
  completion_date TIMESTAMP WITH TIME ZONE, -- Data de conclusão
  notes TEXT, -- Observações
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventário
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- Nome do item
  description TEXT, -- Descrição detalhada
  category TEXT, -- Categoria
  brand TEXT, -- Marca
  model TEXT, -- Modelo
  quantity INTEGER DEFAULT 0, -- Quantidade em estoque
  min_quantity INTEGER DEFAULT 0, -- Quantidade mínima para alerta
  purchase_price DECIMAL(10, 2), -- Preço de compra
  sale_price DECIMAL(10, 2), -- Preço de venda
  supplier TEXT, -- Fornecedor
  location TEXT, -- Localização no estoque
  notes TEXT, -- Observações
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documentos (notas fiscais, orçamentos, etc.)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- Tipo de documento (nota fiscal, orçamento, recibo, etc.)
  number TEXT, -- Número do documento
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2), -- Valor total
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Data de emissão
  due_date TIMESTAMP WITH TIME ZONE, -- Data de vencimento
  status TEXT, -- Status do documento
  document_url TEXT, -- URL ou caminho para o documento
  content JSONB, -- Conteúdo do documento em formato JSON
  notes TEXT, -- Observações
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL UNIQUE, -- Tipo de configuração (company_data, notification_settings, etc.)
  data JSONB NOT NULL, -- Dados em formato JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lixeira para exclusão lógica
CREATE TABLE trash_bin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- Tipo de item excluído (customer, device, service, etc.)
  data JSONB NOT NULL, -- Dados do item excluído em formato JSON
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Estatísticas
CREATE TABLE statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- Tipo de estatística (daily, monthly, etc.)
  period TEXT NOT NULL, -- Período das estatísticas (data, mês, ano, etc.)
  data JSONB NOT NULL, -- Dados das estatísticas em formato JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(type, period) -- Garante que não haja duplicatas para o mesmo tipo e período
);

-- Logs de atividades do sistema
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- ID do usuário (pode ser nulo para ações do sistema)
  action TEXT NOT NULL, -- Ação realizada (login, criação, exclusão, etc.)
  entity_type TEXT, -- Tipo de entidade afetada (customer, device, service, etc.)
  entity_id UUID, -- ID da entidade afetada
  details JSONB, -- Detalhes da ação em formato JSON
  ip_address TEXT, -- Endereço IP do usuário
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar o desempenho
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_devices_customer_id ON devices(customer_id);
CREATE INDEX idx_services_customer_id ON services(customer_id);
CREATE INDEX idx_services_device_id ON services(device_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_inventory_name ON inventory(name);
CREATE INDEX idx_documents_customer_id ON documents(customer_id);
CREATE INDEX idx_documents_service_id ON documents(service_id);
CREATE INDEX idx_trash_bin_type ON trash_bin(type);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type_entity_id ON activity_logs(entity_type, entity_id);

-- RLS (Row Level Security) para limitar o acesso aos dados
-- Primeiro desabilita o RLS para todas as tabelas
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE trash_bin DISABLE ROW LEVEL SECURITY;
ALTER TABLE statistics DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- Habilita o RLS para todas as tabelas
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trash_bin ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Cria políticas para permitir acesso total a usuários autenticados
-- Essas políticas podem ser ajustadas de acordo com as necessidades
CREATE POLICY "Acesso total a clientes para usuários autenticados" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total a dispositivos para usuários autenticados" ON devices
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total a serviços para usuários autenticados" ON services
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total ao inventário para usuários autenticados" ON inventory
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total a documentos para usuários autenticados" ON documents
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total a configurações para usuários autenticados" ON settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total à lixeira para usuários autenticados" ON trash_bin
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total a estatísticas para usuários autenticados" ON statistics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total a logs de atividades para usuários autenticados" ON activity_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger a todas as tabelas
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_statistics_updated_at
  BEFORE UPDATE ON statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 