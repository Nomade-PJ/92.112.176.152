import React from 'react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

interface ResetStatisticsButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  visualOnly?: boolean;
}

const ResetStatisticsButton: React.FC<ResetStatisticsButtonProps> = ({ 
  variant = 'destructive', 
  size = 'default',
  visualOnly = false
}) => {
  
  const handleReset = () => {
    try {
      // Mostrar um toast de que o processo está em andamento
      toast.info(visualOnly ? 
        'Reinicializando estatísticas visuais...' : 
        'Reinicializando todas as estatísticas...'
      );
      
      if (visualOnly) {
        // Reinicialização de estatísticas visuais
        try {
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
          
          // Definir flag de dados resetados
          localStorage.setItem('pauloCell_data_reset_flag', 'true');
          
          console.log('Estatísticas visuais reinicializadas com sucesso!');
          toast.success('Estatísticas visuais reinicializadas com sucesso!');
          
        } catch (err) {
          console.error('Erro ao reinicializar estatísticas visuais:', err);
          toast.error('Erro ao reinicializar estatísticas visuais');
          return;
        }
      } else {
        // Reinicialização completa de estatísticas
        try {
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
          
          // Definir flag de dados resetados
          localStorage.setItem('pauloCell_data_reset_flag', 'true');
          
          // Remover possíveis dados cache
          localStorage.removeItem('pauloCell_cache');
          
          console.log('Todas as estatísticas foram reinicializadas com sucesso!');
          toast.success('Todas as estatísticas reinicializadas com sucesso!');
          
        } catch (err) {
          console.error('Erro ao reinicializar todas as estatísticas:', err);
          toast.error('Erro ao reinicializar todas as estatísticas');
          return;
        }
      }
      
      // Recarregar a página após um breve delay para atualizar os dados
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erro ao reinicializar estatísticas:', error);
      toast.error('Erro ao reinicializar estatísticas');
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleReset}
    >
      {visualOnly ? 'Reiniciar Estatísticas Visuais' : 'Reiniciar Todas as Estatísticas'}
    </Button>
  );
};

export default ResetStatisticsButton; 