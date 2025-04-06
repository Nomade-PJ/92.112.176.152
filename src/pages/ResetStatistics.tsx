import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeftIcon, RefreshCcwIcon, HistoryIcon, DatabaseIcon, BarChart4Icon } from 'lucide-react';
import { resetAllStatistics, resetVisualStatistics } from '../lib/reset-stats';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

const ResetStatistics: React.FC = () => {
  const navigate = useNavigate();

  const handleResetAllStats = () => {
    try {
      // Mostrar um toast de que o processo está em andamento
      toast.info('Reinicializando todas as estatísticas...');
      
      // Lista completa de chaves para garantir limpeza total
      const keysToReset = [
        'pauloCell_statistics',
        'pauloCell_monthlyStats',
        'pauloCell_reportData',
        'pauloCell_chartData',
        'pauloCell_deviceStats', 
        'pauloCell_serviceStats',
        'pauloCell_customerStats',
        'pauloCell_salesStats',
        'pauloCell_inventoryStats',
        'pauloCell_dashboard_stats',
        'pauloCell_report_cache',
        'pauloCell_visuals',
        'pauloCell_total_stats',
        'pauloCell_reports',
        // Adicionando mais chaves possíveis
        'pauloCell_chart_config',
        'pauloCell_sales_data',
        'pauloCell_customer_stats',
        'pauloCell_period_data'
      ];

      // Dados zerados para inicializar
      const emptyStats = {
        devices: {
          byType: { tablet: 0, celular: 0, notebook: 0, outros: 0 },
          byStatus: { bomEstado: 0, problemasLeves: 0, problemasCriticos: 0 },
          byBrand: { Apple: 0, Samsung: 0, Xiaomi: 0, Motorola: 0, LG: 0, Outros: 0 }
        },
        services: {
          byStatus: { emAndamento: 0, aguardandoPecas: 0, concluidos: 0, cancelados: 0, entregues: 0 },
          byType: { trocaTela: 0, trocaBateria: 0, reparoPlaca: 0, conectorCarga: 0, outros: 0 },
          avgTime: { trocaTela: 0, trocaBateria: 0, reparoPlaca: 0, conectorCarga: 0, diagnostico: 0 }
        },
        customers: {
          byType: { pessoaFisica: 0, empresa: 0 },
          distribution: { tela: 0, bateria: 0, acessorio: 0, placa: 0, outro: 0 },
          monthly: { jan: 0, fev: 0, mar: 0, abr: 0, mai: 0, jun: 0, jul: 0, ago: 0, set: 0, out: 0, nov: 0, dez: 0 }
        },
        sales: {
          monthly: {
            services: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            parts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            total: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          },
          total: { value: 0, growth: 0 },
          services: { value: 0, growth: 0 },
          parts: { value: 0, growth: 0 }
        }
      };

      // Remover chaves existentes
      keysToReset.forEach(key => {
        localStorage.removeItem(key);
      });

      // Inicializar com dados zerados
      localStorage.setItem('pauloCell_statistics', JSON.stringify(emptyStats));
      
      // Definir flag de dados resetados para ser lida pela página de relatórios
      localStorage.setItem('pauloCell_data_reset_flag', 'true');

      // Remover possíveis dados cache
      localStorage.removeItem('pauloCell_cache');
      
      console.log('Todas as estatísticas foram reinicializadas com sucesso!');
      toast.success('Todas as estatísticas reinicializadas com sucesso!');
      
      // Recarregar a página após um breve delay para atualizar os dados
      setTimeout(() => {
        navigate('/reports');
      }, 1500);
    } catch (error) {
      console.error('Erro ao reinicializar estatísticas:', error);
      toast.error('Erro ao reinicializar estatísticas');
    }
  };

  const handleResetVisualStats = () => {
    try {
      // Mostrar um toast de que o processo está em andamento
      toast.info('Reinicializando estatísticas visuais...');
      
      // Lista completa de chaves para garantir limpeza total
      const keysToReset = [
        'pauloCell_chartData',
        'pauloCell_reportData',
        'pauloCell_dashboard_stats',
        'pauloCell_visuals',
        'pauloCell_report_cache',
        'pauloCell_chart_config',
        'pauloCell_period_data'
      ];
      
      // Remover todas as chaves
      keysToReset.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Definir flag de dados resetados para ser lida pela página de relatórios
      localStorage.setItem('pauloCell_data_reset_flag', 'true');
      
      console.log('Estatísticas visuais reinicializadas com sucesso!');
      toast.success('Estatísticas visuais reinicializadas com sucesso!');
      
      // Recarregar a página após um breve delay para atualizar os dados
      setTimeout(() => {
        navigate('/reports');
      }, 1500);
    } catch (error) {
      console.error('Erro ao reinicializar estatísticas visuais:', error);
      toast.error('Erro ao reinicializar estatísticas visuais');
    }
  };

  return (
    <MainLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Reinicialização de Estatísticas</h1>
        </div>

        <Alert className="mb-6">
          <DatabaseIcon className="h-4 w-4" />
          <AlertTitle>Informação Importante</AlertTitle>
          <AlertDescription>
            Esta página permite reinicializar as estatísticas do sistema. Os dados reais (clientes, 
            dispositivos, serviços) não serão afetados, apenas os dados estatísticos e gráficos.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart4Icon className="h-5 w-5" />
                Reinicializar Estatísticas Visuais
              </CardTitle>
              <CardDescription>
                Reinicializa apenas os dados visuais e gráficos, mantendo os dados estatísticos calculados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Esta ação irá zerar apenas os gráficos e visualizações, sem afetar os cálculos estatísticos
                internos. Útil quando você quer apenas limpar os gráficos.
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleResetVisualStats}
              >
                <RefreshCcwIcon className="mr-2 h-4 w-4" />
                Reinicializar Estatísticas Visuais
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <HistoryIcon className="h-5 w-5" />
                Reinicializar Todas as Estatísticas
              </CardTitle>
              <CardDescription>
                Reinicializa completamente todos os dados estatísticos e gráficos do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Esta ação irá zerar completamente todas as estatísticas, incluindo contadores, 
                gráficos e dados numéricos. Use quando quiser começar do zero.
              </p>
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={handleResetAllStats}
              >
                <RefreshCcwIcon className="mr-2 h-4 w-4" />
                Reinicializar Todas as Estatísticas
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default ResetStatistics; 