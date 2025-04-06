/**
 * Ferramentas para serem usadas no console do navegador
 * Para usar, abra o console (F12) e digite:
 * PauloCellTools.resetAllStats()
 */

import { resetAllStatistics, resetVisualStatistics } from './reset-stats';

// Objeto global que será exposto no console
export const PauloCellTools = {
  /**
   * Reinicializa todas as estatísticas
   */
  resetAllStats: () => {
    console.log('Reinicializando todas as estatísticas...');
    const success = resetAllStatistics();
    if (success) {
      console.log('%c ✅ Todas as estatísticas foram reinicializadas com sucesso!', 'color: green; font-weight: bold');
      console.log('Recarregue a página para ver as mudanças.');
      return true;
    } else {
      console.error('❌ Erro ao reinicializar estatísticas');
      return false;
    }
  },

  /**
   * Reinicializa apenas as estatísticas visuais
   */
  resetVisualStats: () => {
    console.log('Reinicializando estatísticas visuais...');
    const success = resetVisualStatistics();
    if (success) {
      console.log('%c ✅ Estatísticas visuais reinicializadas com sucesso!', 'color: green; font-weight: bold');
      console.log('Recarregue a página para ver as mudanças.');
      return true;
    } else {
      console.error('❌ Erro ao reinicializar estatísticas visuais');
      return false;
    }
  },

  /**
   * Mostra todas as estatísticas atuais (para debug)
   */
  showAllStats: () => {
    try {
      const allStats = localStorage.getItem('pauloCell_statistics');
      if (allStats) {
        console.log('📊 Estatísticas atuais:');
        console.log(JSON.parse(allStats));
      } else {
        console.log('Nenhuma estatística encontrada.');
      }
    } catch (error) {
      console.error('Erro ao mostrar estatísticas:', error);
    }
  }
};

// Expõe as ferramentas globalmente
if (typeof window !== 'undefined') {
  (window as any).PauloCellTools = PauloCellTools;
}

export default PauloCellTools; 