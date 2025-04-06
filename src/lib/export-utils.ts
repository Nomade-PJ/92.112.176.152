import jsPDF from 'jspdf';
// Import autotable dynamically to ensure compatibility with jsPDF v3
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ExportableData {
  [key: string]: any;
}

// Helper function to format data for export
const formatDataForExport = (data: ExportableData[]) => {
  return data.map(item => {
    const formattedItem: ExportableData = {};
    for (const [key, value] of Object.entries(item)) {
      // Skip internal fields and complex objects
      if (key === 'id' || typeof value === 'object' && value !== null && !Array.isArray(value)) continue;
      formattedItem[key] = value;
    }
    return formattedItem;
  });
};

// Export as PDF
export const exportToPDF = (data: ExportableData[], title: string) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Nenhum dado para exportar');
    }

    console.log(`Iniciando exportação de ${data.length} registros para PDF`);

    // Create a new jsPDF instance
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const formattedData = formatDataForExport(data);

    // Add title
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    doc.setFontSize(12);

    // Add data
    const headers = Object.keys(formattedData[0] || {});
    const rows = formattedData.map(item => headers.map(header => {
      // Formatação especial para valores monetários e datas
      if (typeof item[header] === 'number' && (header.includes('valor') || header.includes('value') || header.includes('preco'))) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item[header]);
      } else if (typeof item[header] === 'string' && header.includes('date')) {
        try {
          return new Date(item[header]).toLocaleDateString('pt-BR');
        } catch (e) {
          return item[header];
        }
      }
      return item[header] === null || item[header] === undefined ? '' : item[header];
    }));

    try {
      // Usando autoTable diretamente
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: 30,
        margin: { top: 25 },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [255, 140, 0], textColor: 255 } // Cor laranja para combinar com a identidade visual
      });

      // Gerar nome de arquivo com data e hora para evitar duplicação
      const timestamp = new Date().toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .substring(0, 15);
      
      const filename = `${title.toLowerCase().replace(/ /g, '_')}_${timestamp}.pdf`;

      try {
        // Save the PDF after table is created
        doc.save(filename);
        console.log('PDF salvo com sucesso');
        return true;
      } catch (saveError) {
        console.error('Erro ao salvar PDF com método padrão:', saveError);
        
        // Método alternativo para salvar o PDF em caso de erro
        try {
          console.log('Tentando método alternativo para salvar o PDF...');
          const blob = doc.output('blob');
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('PDF salvo com método alternativo');
          return true;
        } catch (alternativeSaveError) {
          console.error('Erro no método alternativo:', alternativeSaveError);
          throw alternativeSaveError;
        }
      }
    } catch (tableError) {
      console.error('Erro ao gerar tabela no PDF:', tableError);
      throw tableError;
    }
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    throw error;
  }
};

// Export individual document as PDF with more details
export const exportDocumentToPDF = (document: ExportableData, selectedColumns: string[]) => {
  try {
    if (!document) {
      throw new Error('No document to export');
    }

    // Create a new jsPDF instance
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text("Documento Fiscal", 20, 20);
    doc.setFontSize(12);
    doc.text(`Número: ${document.number}`, 20, 30);
    
    let yPosition = 40;
    
    // Add selected document information
    if (selectedColumns.includes('type')) {
      doc.text(`Tipo: ${document.type.toUpperCase()}`, 20, yPosition);
      yPosition += 10;
    }
    
    if (selectedColumns.includes('customer')) {
      doc.text(`Cliente: ${document.customer}`, 20, yPosition);
      yPosition += 10;
    }
    
    if (selectedColumns.includes('date')) {
      const date = new Date(document.date).toLocaleDateString('pt-BR');
      doc.text(`Data: ${date}`, 20, yPosition);
      yPosition += 10;
    }
    
    if (selectedColumns.includes('value')) {
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency', 
        currency: 'BRL'
      }).format(document.value);
      doc.text(`Valor: ${formattedValue}`, 20, yPosition);
      yPosition += 10;
    }
    
    if (selectedColumns.includes('status')) {
      doc.text(`Status: ${document.status}`, 20, yPosition);
      yPosition += 10;
    }
    
    if (selectedColumns.includes('paymentMethod') && document.paymentMethod) {
      doc.text(`Forma de Pagamento: ${document.paymentMethod}`, 20, yPosition);
      yPosition += 10;
    }
    
    // Add items if selected and available
    if (selectedColumns.includes('items') && document.items && document.items.length > 0) {
      yPosition += 5;
      doc.text("Itens:", 20, yPosition);
      yPosition += 10;
      
      const itemHeaders = ["Descrição", "Quantidade", "Valor Unitário", "Valor Total"];
      const itemRows = document.items.map((item: any) => [
        item.description,
        item.quantity.toString(),
        new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(item.unitValue),
        new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(item.quantity * item.unitValue)
      ]);
      
      // Use the autoTable plugin with proper type handling for jsPDF v3
      import('jspdf-autotable').then((autoTable) => {
        autoTable.default(doc, {
          head: [itemHeaders],
          body: itemRows,
          startY: yPosition,
          margin: { top: 25 },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 139, 202] }
        });
        
        // Handle observations after table is created
        if (selectedColumns.includes('observations') && document.observations) {
          const tableHeight = document.items && document.items.length > 0 ? 
            document.items.length * 10 + 15 : 0;
          let obsYPosition = yPosition + tableHeight + 10;
          
          doc.text("Observações:", 20, obsYPosition);
          obsYPosition += 10;
          doc.text(document.observations, 20, obsYPosition, { 
            maxWidth: 170 
          });
        }
        
        // Save the PDF after all content is added
        doc.save(`documento_${document.number}_${new Date().toISOString().split('T')[0]}.pdf`);
      });
    } else {
      // If no items, handle observations and save directly
      if (selectedColumns.includes('observations') && document.observations) {
        doc.text("Observações:", 20, yPosition);
        yPosition += 10;
        doc.text(document.observations, 20, yPosition, { 
          maxWidth: 170 
        });
      }
      
      // Save the PDF
      doc.save(`documento_${document.number}_${new Date().toISOString().split('T')[0]}.pdf`);
    }
    
    return true;
  } catch (error) {
    console.error('Error exporting document to PDF:', error);
    throw error;
  }
};

// Export as Excel
export const exportToExcel = (data: ExportableData[], title: string) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Nenhum dado para exportar');
    }

    console.log(`Iniciando exportação de ${data.length} registros para Excel`);

    // Prepara os dados formatando valores especiais
    const formattedData = data.map(item => {
      const formattedItem: ExportableData = {};
      
      // Processa as propriedades de primeiro nível
      for (const [key, value] of Object.entries(item)) {
        // Pula campos internos
        if (key === 'id') continue;
        
        // Formatação especial para valores monetários
        if (typeof value === 'number' && (key.includes('valor') || key.includes('value') || key.includes('preco'))) {
          formattedItem[key] = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        } 
        // Formatação especial para datas
        else if (typeof value === 'string' && (key.includes('date') || key.includes('data'))) {
          try {
            formattedItem[key] = new Date(value).toLocaleDateString('pt-BR');
          } catch (e) {
            formattedItem[key] = value;
          }
        }
        // Processamento especial para arrays como items
        else if (Array.isArray(value) && key === 'items') {
          // Contar itens e calcular valor total
          formattedItem['quantidade_itens'] = value.length;
          
          // Adicionar descrições dos primeiros 3 itens
          value.slice(0, 3).forEach((item, index) => {
            if (item.description) {
              formattedItem[`item_${index + 1}`] = item.description;
            }
          });
          
          // Indicar se há mais itens
          if (value.length > 3) {
            formattedItem['mais_itens'] = `E mais ${value.length - 3} item(s)`;
          }
        }
        // Processamento para objetos - extrair propriedades principais
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Para objetos aninhados, extrair propriedades selecionadas
          if (key === 'customer' && typeof value === 'object') {
            formattedItem['customer_name'] = value.name || 'N/A';
            if (value.email) formattedItem['customer_email'] = value.email;
            if (value.phone) formattedItem['customer_phone'] = value.phone;
          } else {
            // Para outros objetos, apenas stringify
            formattedItem[key] = JSON.stringify(value);
          }
        }
        // Valores padrão
        else {
          formattedItem[key] = value === null || value === undefined ? '' : value;
        }
      }
      
      return formattedItem;
    });

    // Converter para worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Ajustar largura das colunas
    const defaultColumnWidth = 18;
    const columnWidths = {};
    
    Object.keys(formattedData[0] || {}).forEach(key => {
      // Definir larguras personalizadas com base no tipo de coluna
      if (key.includes('description') || key.includes('observ')) {
        columnWidths[key] = 40; // Colunas de descrição mais largas
      } else if (key.includes('date') || key.includes('data')) {
        columnWidths[key] = 15; // Colunas de data com largura média
      } else if (key.includes('value') || key.includes('valor') || key.includes('price')) {
        columnWidths[key] = 15; // Colunas de valores financeiros
      } else {
        columnWidths[key] = defaultColumnWidth;
      }
    });
    
    worksheet['!cols'] = Object.keys(formattedData[0] || {}).map(key => ({ 
      wch: columnWidths[key] || defaultColumnWidth 
    }));
    
    // Criar workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

    // Gerar nome de arquivo com data e hora
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .substring(0, 15);
    
    const filename = `${title.toLowerCase().replace(/ /g, '_')}_${timestamp}.xlsx`;

    // Salvar arquivo
    XLSX.writeFile(workbook, filename);
    console.log('Excel salvo com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    throw error;
  }
};

// Export as CSV
export const exportToCSV = (data: ExportableData[], title: string) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Nenhum dado para exportar');
    }

    console.log(`Iniciando exportação de ${data.length} registros para CSV`);

    // Prepara os dados para CSV com formatação aprimorada
    const formattedData = data.map(item => {
      const formattedItem: ExportableData = {};
      
      // Processa as propriedades de primeiro nível
      for (const [key, value] of Object.entries(item)) {
        // Pula campos internos
        if (key === 'id') continue;
        
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1') // Adiciona espaços antes de letras maiúsculas
          .replace(/^./, str => str.toUpperCase()) // Capitaliza a primeira letra
          .trim(); // Remove espaços extras
        
        // Formatação especial para valores monetários
        if (typeof value === 'number' && (key.includes('valor') || key.includes('value') || key.includes('preco'))) {
          formattedItem[formattedKey] = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        } 
        // Formatação especial para datas
        else if (typeof value === 'string' && (key.includes('date') || key.includes('data'))) {
          try {
            formattedItem[formattedKey] = new Date(value).toLocaleDateString('pt-BR');
          } catch (e) {
            formattedItem[formattedKey] = value;
          }
        }
        // Processamento especial para arrays como items
        else if (Array.isArray(value) && key === 'items') {
          // Contar itens e calcular valor total
          formattedItem['Quantidade de Itens'] = value.length;
          
          // Adicionar descrições dos primeiros 3 itens
          value.slice(0, 3).forEach((item, index) => {
            if (item.description) {
              formattedItem[`Item ${index + 1}`] = item.description;
            }
            if (item.quantity && item.unitValue) {
              formattedItem[`Valor Item ${index + 1}`] = new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(item.quantity * item.unitValue);
            }
          });
          
          // Indicar se há mais itens
          if (value.length > 3) {
            formattedItem['Mais Itens'] = `E mais ${value.length - 3} item(s)`;
          }
        }
        // Processamento para objetos - extrair propriedades principais
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Para objetos aninhados, extrair propriedades selecionadas
          if (key === 'customer' && typeof value === 'object') {
            formattedItem['Nome Cliente'] = value.name || 'N/A';
            if (value.email) formattedItem['Email Cliente'] = value.email;
            if (value.phone) formattedItem['Telefone Cliente'] = value.phone;
          } else {
            try {
              // Para outros objetos, apenas stringify
              formattedItem[formattedKey] = JSON.stringify(value);
            } catch (e) {
              formattedItem[formattedKey] = '[Objeto Complexo]';
            }
          }
        }
        // Melhora para o tipo de documento
        else if (key === 'type' && typeof value === 'string') {
          const typeMap: Record<string, string> = {
            'nfe': 'Nota Fiscal Eletrônica',
            'nfce': 'Nota Fiscal de Consumidor Eletrônica',
            'nfse': 'Nota Fiscal de Serviço Eletrônica'
          };
          formattedItem[formattedKey] = typeMap[value.toLowerCase()] || value;
        }
        // Status formatado
        else if (key === 'status' && typeof value === 'string') {
          formattedItem[formattedKey] = value.charAt(0).toUpperCase() + value.slice(1);
        }
        // Valores padrão
        else {
          formattedItem[formattedKey] = value === null || value === undefined ? '' : value;
        }
      }
      
      return formattedItem;
    });

    // Converte para CSV usando PapaParse
    const csv = Papa.unparse(formattedData, {
      delimiter: ";", // Usar ponto e vírgula para melhor compatibilidade com Excel em PT-BR
      header: true,
      quotes: true, // Colocar aspas em todos os campos para evitar problemas com delimitadores
    });

    // Adiciona BOM para garantir que caracteres especiais sejam exibidos corretamente
    const csvContent = "\ufeff" + csv;

    // Cria um blob e faz o download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Gerar nome de arquivo com data e hora para evitar duplicação
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .substring(0, 15);
    
    const filename = `${title.toLowerCase().replace(/ /g, '_')}_${timestamp}.csv`;
    
    // Cria um elemento de link e simula o clique
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Limpa recursos
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('CSV salvo com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao exportar para CSV:', error);
    throw error;
  }
};

// Generate document print content
export const generateDocumentPrintContent = (document: ExportableData, selectedColumns: string[]) => {
  try {
    if (!document) {
      throw new Error('No document to print');
    }
    
    const printStyles = `
      <style>
        @media print {
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          table { page-break-inside: auto; width: 100%; border-collapse: collapse; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .document-header { text-align: center; margin-bottom: 30px; }
          .document-info { margin: 20px; }
          .section-title { margin: 20px 0; }
        }
      </style>
    `;

    const getDocumentInfo = () => {
      const info = [];
      if (selectedColumns.includes('number')) info.push(`<p><strong>Número:</strong> ${document.number}</p>`);
      if (selectedColumns.includes('type')) info.push(`<p><strong>Tipo:</strong> ${document.type.toUpperCase()}</p>`);
      if (selectedColumns.includes('customer')) info.push(`<p><strong>Cliente:</strong> ${document.customer}</p>`);
      if (selectedColumns.includes('date')) info.push(`<p><strong>Data:</strong> ${new Date(document.date).toLocaleDateString('pt-BR')}</p>`);
      if (selectedColumns.includes('value')) info.push(`<p><strong>Valor:</strong> ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(document.value)}</p>`);
      if (selectedColumns.includes('status')) info.push(`<p><strong>Status:</strong> ${document.status}</p>`);
      if (selectedColumns.includes('paymentMethod') && document.paymentMethod) info.push(`<p><strong>Forma de Pagamento:</strong> ${document.paymentMethod}</p>`);
      if (selectedColumns.includes('observations') && document.observations) info.push(`<p><strong>Observações:</strong> ${document.observations}</p>`);
      return info.join('');
    };

    const getItemsTable = () => {
      if (!selectedColumns.includes('items') || !document.items || document.items.length === 0) {
        return '';
      }
      
      return `
        <h2 class="section-title">Itens</h2>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Quantidade</th>
              <th>Valor Unitário</th>
              <th>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${document.items.map((item: any) => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitValue)}</td>
                <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.unitValue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    };

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Documento Fiscal</title>
          ${printStyles}
        </head>
        <body>
          <div class="document-header">
            <h1>Documento Fiscal</h1>
          </div>
          <div class="document-info">
            ${getDocumentInfo()}
          </div>
          ${getItemsTable()}
        </body>
      </html>
    `;
    
    return content;
  } catch (error) {
    console.error('Error generating print content:', error);
    throw error;
  }
};

// Generate list print content
export const generateListPrintContent = (documents: ExportableData[], selectedColumns: string[]) => {
  try {
    if (!documents || documents.length === 0) {
      throw new Error('No documents to print');
    }
    
    const printStyles = `
      <style>
        @media print {
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          table { page-break-inside: auto; width: 100%; border-collapse: collapse; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .document-header { text-align: center; margin-bottom: 30px; }
          .section-title { margin: 20px 0; }
        }
      </style>
    `;

    const getTableHeaders = () => {
      const headers = [];
      if (selectedColumns.includes('number')) headers.push('<th>Número</th>');
      if (selectedColumns.includes('type')) headers.push('<th>Tipo</th>');
      if (selectedColumns.includes('customer')) headers.push('<th>Cliente</th>');
      if (selectedColumns.includes('date')) headers.push('<th>Data</th>');
      if (selectedColumns.includes('value')) headers.push('<th>Valor</th>');
      if (selectedColumns.includes('status')) headers.push('<th>Status</th>');
      if (selectedColumns.includes('paymentMethod')) headers.push('<th>Forma de Pagamento</th>');
      return headers.join('');
    };

    const getTableRows = () => {
      return documents.map(doc => {
        const cells = [];
        if (selectedColumns.includes('number')) cells.push(`<td>${doc.number}</td>`);
        if (selectedColumns.includes('type')) cells.push(`<td>${doc.type.toUpperCase()}</td>`);
        if (selectedColumns.includes('customer')) cells.push(`<td>${doc.customer}</td>`);
        if (selectedColumns.includes('date')) cells.push(`<td>${new Date(doc.date).toLocaleDateString('pt-BR')}</td>`);
        if (selectedColumns.includes('value')) cells.push(`<td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(doc.value)}</td>`);
        if (selectedColumns.includes('status')) cells.push(`<td>${doc.status}</td>`);
        if (selectedColumns.includes('paymentMethod')) cells.push(`<td>${doc.paymentMethod || '-'}</td>`);
        return `<tr>${cells.join('')}</tr>`;
      }).join('');
    };

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Lista de Documentos Fiscais</title>
          ${printStyles}
        </head>
        <body>
          <div class="document-header">
            <h1>Lista de Documentos Fiscais</h1>
            <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                ${getTableHeaders()}
              </tr>
            </thead>
            <tbody>
              ${getTableRows()}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    return content;
  } catch (error) {
    console.error('Error generating list print content:', error);
    throw error;
  }
};
