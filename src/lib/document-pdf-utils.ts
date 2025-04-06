import jsPDF from 'jspdf';
import 'jspdf-autotable';
// @ts-ignore
import { jsPDF as jsPDFType } from 'jspdf';

interface DocumentItem {
  description: string;
  quantity: number;
  unitValue: number;
  ncm?: string;
  cfop?: string;
}

interface Document {
  id: string;
  type: 'nfe' | 'nfce' | 'nfse';
  number: string;
  customer: string;
  customerId?: string;
  date: string;
  value: number;
  status: 'Emitida' | 'Cancelada' | 'Pendente';
  items: DocumentItem[];
  paymentMethod: string;
  observations?: string;
  invoiceId?: string;
  invoiceUrl?: string;
  // Campos específicos para documentos fiscais
  naturezaOperacao?: string; // Para NF-e
  cpfCnpjConsumidor?: string; // Para NFC-e
  servicosPrestados?: string; // Para NFS-e
  aliquotaIss?: number; // Para NFS-e
}

/**
 * Generates an enhanced PDF for a fiscal document with a professional layout
 * @param document The document to generate PDF for
 * @param filename The filename to save the PDF as
 * @param returnPath If true, returns the file path instead of void
 * @returns The file path if returnPath is true, otherwise void
 */
export const generateEnhancedDocumentPDF = (document: Document, filename?: string, returnPath: boolean = false): string | void => {
  try {
    // Create a new jsPDF instance in portrait, A4 format
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add header with company info
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Paulo Cell Sistema', pageWidth / 2, margin, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('paulocell.com.br', pageWidth / 2, margin + 7, { align: 'center' });
    
    // Add document title with red border for emphasis
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    
    // Draw a red border around the title
    doc.setDrawColor(255, 0, 0);
    doc.rect(margin, margin + 15, contentWidth, 10, 'S');
    
    // Center the title text
    doc.text('Documento Fiscal', pageWidth / 2, margin + 20, { align: 'center' });
    
    // Add document info
    let yPos = margin + 35;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Número: ${document.type.toUpperCase()}-${document.number}`, margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo: ${getDocumentTypeLabel(document.type)}`, margin, yPos);
    yPos += 8;
    
    doc.text(`Cliente: ${document.customer}`, margin, yPos);
    yPos += 8;
    
    // Adicionar CPF/CNPJ do consumidor se disponível
    if (document.cpfCnpjConsumidor) {
      doc.text(`CPF/CNPJ: ${document.cpfCnpjConsumidor}`, margin, yPos);
      yPos += 8;
    }
    
    doc.text(`Data: ${formatDate(document.date)}`, margin, yPos);
    yPos += 8;
    
    doc.text(`Valor: ${formatCurrency(document.value)}`, margin, yPos);
    yPos += 8;
    
    doc.text(`Status: ${document.status}`, margin, yPos);
    yPos += 8;
    
    doc.text(`Forma de Pagamento: ${document.paymentMethod}`, margin, yPos);
    yPos += 8;
    
    // Adicionar informações específicas por tipo de documento
    if (document.type === 'nfe' && document.naturezaOperacao) {
      doc.text(`Natureza da Operação: ${document.naturezaOperacao}`, margin, yPos);
      yPos += 8;
    }
    
    if (document.type === 'nfse' && document.servicosPrestados) {
      doc.text(`Serviços Prestados: ${document.servicosPrestados}`, margin, yPos);
      yPos += 8;
    }
    
    if (document.type === 'nfse' && document.aliquotaIss !== undefined) {
      doc.text(`Alíquota ISS: ${document.aliquotaIss}%`, margin, yPos);
      yPos += 8;
    }
    
    // Adicionar link para nota fiscal se disponível
    if (document.invoiceUrl) {
      doc.setTextColor(0, 0, 255);
      doc.setFont('helvetica', 'italic');
      doc.text(`Link para Nota: ${document.invoiceUrl}`, margin, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPos += 15;
    } else {
      yPos += 8;
    }
    
    // Add items table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Itens', margin, yPos);
    yPos += 10;
    
    // Define table headers and rows
    let headers, rows;
    
    // Tabela expandida para NF-e e NFC-e incluindo NCM e CFOP quando disponíveis
    if (document.type === 'nfe' || document.type === 'nfce') {
      const hasNcm = document.items.some(item => item.ncm);
      const hasCfop = document.items.some(item => item.cfop);
      
      if (hasNcm && hasCfop) {
        headers = [['Descrição', 'NCM', 'CFOP', 'Qtd', 'Valor Unit.', 'Valor Total']];
        rows = document.items.map(item => [
          item.description,
          item.ncm || '-',
          item.cfop || '-',
          item.quantity.toString(),
          formatCurrency(item.unitValue),
          formatCurrency(item.quantity * item.unitValue)
        ]);
      } else if (hasNcm) {
        headers = [['Descrição', 'NCM', 'Qtd', 'Valor Unit.', 'Valor Total']];
        rows = document.items.map(item => [
          item.description,
          item.ncm || '-',
          item.quantity.toString(),
          formatCurrency(item.unitValue),
          formatCurrency(item.quantity * item.unitValue)
        ]);
      } else if (hasCfop) {
        headers = [['Descrição', 'CFOP', 'Qtd', 'Valor Unit.', 'Valor Total']];
        rows = document.items.map(item => [
          item.description,
          item.cfop || '-',
          item.quantity.toString(),
          formatCurrency(item.unitValue),
          formatCurrency(item.quantity * item.unitValue)
        ]);
      } else {
        // Formato padrão sem NCM ou CFOP
        headers = [['Descrição', 'Quantidade', 'Valor Unitário', 'Valor Total']];
        rows = document.items.map(item => [
          item.description,
          item.quantity.toString(),
          formatCurrency(item.unitValue),
          formatCurrency(item.quantity * item.unitValue)
        ]);
      }
    } else {
      // Para NFS-e e outros tipos de documento
      headers = [['Descrição', 'Quantidade', 'Valor Unitário', 'Valor Total']];
      rows = document.items.map(item => [
        item.description,
        item.quantity.toString(),
        formatCurrency(item.unitValue),
        formatCurrency(item.quantity * item.unitValue)
      ]);
    }
    
    // Calcular larguras de coluna com base no número de colunas
    const columnStyles = {};
    const columnCount = headers[0].length;
    const descriptionWidth = columnCount <= 4 ? 0.5 : 0.4;
    
    // Distribuir a largura entre as colunas
    columnStyles[0] = { cellWidth: contentWidth * descriptionWidth }; // Descrição
    
    for (let i = 1; i < columnCount - 2; i++) {
      columnStyles[i] = { 
        cellWidth: contentWidth * (0.6 / (columnCount - 2)), 
        halign: 'center' 
      };
    }
    
    columnStyles[columnCount - 2] = { 
      cellWidth: contentWidth * 0.15, 
      halign: 'right' 
    }; // Valor Unitário
    
    columnStyles[columnCount - 1] = { 
      cellWidth: contentWidth * 0.15, 
      halign: 'right' 
    }; // Valor Total
    
    // Add table to document
    (doc as any).autoTable({
      head: headers,
      body: rows,
      startY: yPos,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      styles: { font: 'helvetica', fontSize: 10 },
      columnStyles: columnStyles
    });
    
    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Add financial summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Sumário Financeiro', margin, finalY);
    
    const summaryStartY = finalY + 8;
    doc.setFont('helvetica', 'normal');
    doc.text('Valor Total dos Itens:', margin, summaryStartY);
    doc.text(formatCurrency(document.value), pageWidth - margin, summaryStartY, { align: 'right' });
    
    // Adicionar informações específicas por tipo de documento
    let summaryY = summaryStartY + 8;
    
    if (document.type === 'nfse' && document.aliquotaIss !== undefined) {
      const issValue = document.value * (document.aliquotaIss / 100);
      doc.text('Valor do ISS:', margin, summaryY);
      doc.text(formatCurrency(issValue), pageWidth - margin, summaryY, { align: 'right' });
      summaryY += 8;
    }
    
    // Adiciona uma linha para separar
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, summaryY, pageWidth - margin, summaryY);
    summaryY += 8;
    
    // Valor total
    doc.setFont('helvetica', 'bold');
    doc.text('Valor Total:', margin, summaryY);
    doc.text(formatCurrency(document.value), pageWidth - margin, summaryY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    summaryY += 15;
    
    // Add observations if available
    if (document.observations) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', margin, summaryY);
      
      doc.setFont('helvetica', 'normal');
      doc.text(document.observations, margin, summaryY + 8, { 
        maxWidth: contentWidth,
        lineHeightFactor: 1.5
      });
    }
    
    // Add QR Code or barcode for NFC-e if available (just a placeholder)
    if (document.type === 'nfce' && document.invoiceUrl) {
      try {
        // Aqui está apenas mostrando uma mensagem, em uma implementação real
        // devemos gerar um QR Code real usando uma biblioteca
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('QR Code da NFC-e disponível online:', margin, doc.internal.pageSize.getHeight() - 30);
        doc.text('Para verificar a autenticidade, escaneie o QR Code ou acesse o site', margin, doc.internal.pageSize.getHeight() - 25);
        doc.setTextColor(0, 0, 255);
        doc.text(document.invoiceUrl, margin, doc.internal.pageSize.getHeight() - 20);
        doc.setTextColor(0, 0, 0);
      } catch (e) {
        console.error('Erro ao adicionar QR Code:', e);
      }
    }
    
    // Add footer
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Paulo Cell Sistema - Documento gerado em ' + new Date().toLocaleString('pt-BR'), pageWidth / 2, footerY, { align: 'center' });
    
    // Save the PDF
    const outputFilename = filename || `documento_${document.type}_${document.number}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(outputFilename);
    
    // Return the filename if returnPath is true
    if (returnPath) {
      return outputFilename;
    }
  } catch (error) {
    console.error('Error generating enhanced PDF:', error);
    throw error;
  }
};

/**
 * Generates HTML content for printing a fiscal document
 * @param document The document to generate print content for
 */
export const generateEnhancedPrintContent = (document: Document): string => {
  try {
    const printStyles = `
      <style>
        @media print {
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .document-container { max-width: 800px; margin: 0 auto; }
          .document-header { text-align: center; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .company-website { font-size: 14px; color: #666; margin-bottom: 20px; }
          .document-title { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 20px; 
            text-align: center; 
            border: 1px solid red; 
            padding: 5px 0; 
            width: 50%; 
            margin-left: auto; 
            margin-right: auto; 
          }
          .document-info { margin-bottom: 30px; }
          .document-info p { margin: 5px 0; }
          .info-label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #f2f2f2; text-align: left; padding: 10px; border: 1px solid #ddd; }
          td { padding: 10px; border: 1px solid #ddd; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .observations { margin-top: 20px; }
          .observations-title { font-weight: bold; margin-bottom: 10px; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 40px; }
        }
      </style>
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Documento Fiscal</title>
          ${printStyles}
        </head>
        <body>
          <div class="document-container">
            <div class="document-header">
              <div class="company-name">Paulo Cell Sistema</div>
              <div class="company-website">paulocell.com.br</div>
              <div class="document-title">Documento Fiscal</div>
            </div>
            
            <div class="document-info">
              <p><span class="info-label">Número:</span> ${document.type.toUpperCase()}-${document.number}</p>
              <p><span class="info-label">Tipo:</span> ${getDocumentTypeLabel(document.type)}</p>
              <p><span class="info-label">Cliente:</span> ${document.customer}</p>
              <p><span class="info-label">Data:</span> ${formatDate(document.date)}</p>
              <p><span class="info-label">Valor:</span> ${formatCurrency(document.value)}</p>
              <p><span class="info-label">Status:</span> ${document.status}</p>
              <p><span class="info-label">Forma de Pagamento:</span> ${document.paymentMethod}</p>
            </div>
            
            <h2>Itens</h2>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th class="text-center">Quantidade</th>
                  <th class="text-right">Valor Unitário</th>
                  <th class="text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                ${document.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.unitValue)}</td>
                    <td class="text-right">${formatCurrency(item.quantity * item.unitValue)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            ${document.observations ? `
              <div class="observations">
                <div class="observations-title">Observações:</div>
                <p>${document.observations}</p>
              </div>
            ` : ''}
            
            <div class="footer">
              Paulo Cell Sistema - Documento gerado em ${new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </body>
      </html>
    `;
  } catch (error) {
    console.error('Error generating enhanced print content:', error);
    throw error;
  }
};

// Helper functions
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return dateString;
  }
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const getDocumentTypeLabel = (type: string): string => {
  switch (type) {
    case 'nfe': return 'Nota Fiscal Eletrônica (NF-e)';
    case 'nfce': return 'Nota Fiscal de Consumidor Eletrônica (NFC-e)';
    case 'nfse': return 'Nota Fiscal de Serviços Eletrônica (NFS-e)';
    default: return type.toUpperCase();
  }
};

/**
 * Generates a PDF with multiple fiscal documents where each document is on a separate page
 * @param documents Array of documents to include in the PDF
 * @returns Promise<boolean> indicating success or failure
 */
export const generateMultipleDocumentsPDF = async (documents: Document[]): Promise<boolean> => {
  try {
    if (!documents || documents.length === 0) {
      console.error('Nenhum documento fornecido para geração de PDF');
      return false;
    }

    console.log(`Iniciando geração de PDF com ${documents.length} documentos`);

    // Create a new jsPDF instance in portrait, A4 format
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const totalDocuments = documents.length;
    
    // Sort documents by date (newest first)
    const sortedDocuments = [...documents].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    console.log('Documentos ordenados, gerando página de capa...');
    
    // Adicionar uma página de capa
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    try {
      // Título da capa
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Documentos Fiscais', pageWidth / 2, 50, { align: 'center' });
      
      // Subtítulo com informações do período
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      const today = new Date().toLocaleDateString('pt-BR');
      doc.text(`Relatório gerado em ${today}`, pageWidth / 2, 70, { align: 'center' });
      doc.text(`Total de documentos: ${totalDocuments}`, pageWidth / 2, 85, { align: 'center' });
      
      // Adicionar resumo dos documentos (se não forem muitos)
      if (totalDocuments <= 20) {
        doc.setFontSize(12);
        doc.text('Resumo dos documentos:', margin, 110);
        
        let yPos = 120;
        for (let index = 0; index < sortedDocuments.length; index++) {
          const doc1 = sortedDocuments[index];
          if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 30;
          }
          const docDate = new Date(doc1.date).toLocaleDateString('pt-BR');
          doc.text(`${index+1}. ${doc1.type.toUpperCase()}-${doc1.number}: ${doc1.customer} - ${formatCurrency(doc1.value)} (${docDate})`, margin, yPos);
          yPos += 8;
        }
      }
      
      // Adicionar rodapé na página de capa
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Paulo Cell Sistema - Cada documento aparece em uma página separada neste relatório.', 
        pageWidth / 2, pageHeight - 20, { align: 'center' });
      
      console.log('Página de capa gerada, processando documentos individuais...');
      
      // Process each document and add to the PDF
      for (let i = 0; i < sortedDocuments.length; i++) {
        try {
          console.log(`Processando documento ${i + 1} de ${sortedDocuments.length}`);
          
          // Adicionar nova página para cada documento
          doc.addPage();
          
          const document = sortedDocuments[i];
          const contentWidth = pageWidth - (margin * 2);
          
          // Cabeçalho com informações da empresa
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0);
          doc.text('Paulo Cell Sistema', pageWidth / 2, margin, { align: 'center' });
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('paulocell.com.br', pageWidth / 2, margin + 7, { align: 'center' });
          
          // Fundo colorido para o tipo e número do documento
          doc.setFillColor(255, 140, 0); // Laranja
          doc.rect(margin, margin + 15, contentWidth, 10, 'F');
          
          // Texto do título com fundo colorido
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255); // Texto branco
          doc.text(`${document.type.toUpperCase()}-${document.number}`, pageWidth / 2, margin + 22, { align: 'center' });
          
          // Resetar cor do texto
          doc.setTextColor(0);
          
          // Informações do documento
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          
          let yPos = margin + 35;
          
          // Dados principais em duas colunas
          const col1X = margin;
          const col2X = pageWidth / 2;
          
          // Coluna 1
          doc.setFont('helvetica', 'bold');
          doc.text('Cliente:', col1X, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(document.customer, col1X + 30, yPos);
          
          // Coluna 2
          doc.setFont('helvetica', 'bold');
          doc.text('Data:', col2X, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(formatDate(document.date), col2X + 30, yPos);
          yPos += 10;
          
          // Coluna 1
          doc.setFont('helvetica', 'bold');
          doc.text('Valor Total:', col1X, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(formatCurrency(document.value), col1X + 30, yPos);
          
          // Coluna 2
          doc.setFont('helvetica', 'bold');
          doc.text('Status:', col2X, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(document.status, col2X + 30, yPos);
          yPos += 10;
          
          // Coluna 1
          doc.setFont('helvetica', 'bold');
          doc.text('Pagamento:', col1X, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(document.paymentMethod || '-', col1X + 30, yPos);
          
          yPos += 20;
          
          // Campos específicos por tipo de documento
          if (document.type === 'nfe' && document.naturezaOperacao) {
            doc.text(`Natureza da Operação: ${document.naturezaOperacao}`, margin, yPos);
            yPos += 7;
          }
          
          if (document.type === 'nfce' && document.cpfCnpjConsumidor) {
            doc.text(`CPF/CNPJ do Consumidor: ${document.cpfCnpjConsumidor}`, margin, yPos);
            yPos += 7;
          }
          
          if (document.type === 'nfse') {
            if (document.servicosPrestados) {
              doc.text(`Serviços Prestados: ${document.servicosPrestados}`, margin, yPos);
              yPos += 7;
            }
            
            if (document.aliquotaIss !== undefined) {
              doc.text(`Alíquota ISS: ${document.aliquotaIss}%`, margin, yPos);
              yPos += 7;
            }
          }
          
          // Título da tabela
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Itens do Documento', margin, yPos + 5);
          
          // Verificar se o documento tem itens
          if (!document.items || document.items.length === 0) {
            yPos += 15;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text('Nenhum item encontrado neste documento.', margin, yPos);
          } else {
            // Preparar dados para a tabela
            const tableColumn = ['Descrição', 'Qtd', 'Valor Unit', 'Total'];
            const tableRows = document.items.map(item => [
              item.description,
              String(item.quantity),
              formatCurrency(item.unitValue),
              formatCurrency(item.quantity * item.unitValue)
            ]);
            
            try {
              // Adicionar tabela
              (doc as any).autoTable({
                startY: yPos + 10,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [255, 140, 0], textColor: [255, 255, 255] },
                margin: { left: margin, right: margin },
                styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
                columnStyles: {
                  0: { cellWidth: contentWidth * 0.5 },
                  1: { cellWidth: contentWidth * 0.1, halign: 'center' },
                  2: { cellWidth: contentWidth * 0.2, halign: 'right' },
                  3: { cellWidth: contentWidth * 0.2, halign: 'right' }
                }
              });
              
              // Obter a posição Y após a tabela
              let finalY = (doc as any).lastAutoTable.finalY + 10;
              
              // Adicionar observações se existirem
              if (document.observations) {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Observações:', margin, finalY);
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                
                // Quebrar observações em múltiplas linhas se necessário
                const lines = doc.splitTextToSize(document.observations, contentWidth);
                doc.text(lines, margin, finalY + 7);
              }
            } catch (tableError) {
              console.error(`Erro ao gerar tabela para o documento ${i + 1}:`, tableError);
              // Continuar com o próximo documento em caso de erro na tabela
            }
          }
          
          // Adicionar paginação
          doc.setFontSize(8);
          doc.text(`Documento ${i + 1} de ${totalDocuments}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        } catch (docError) {
          console.error(`Erro ao processar o documento ${i + 1}:`, docError);
          // Continuar com o próximo documento em caso de erro
        }
      }
      
      console.log('Documentos processados, salvando PDF...');
      
      // Gerar nome de arquivo com data e hora para evitar duplicação
      const timestamp = new Date().toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .substring(0, 15);
      
      const filename = `Documentos_Fiscais_${timestamp}.pdf`;
      
      // Salvar o PDF usando método padrão
      try {
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
          return false;
        }
      }
    } catch (processingError) {
      console.error('Erro no processamento do PDF:', processingError);
      return false;
    }
  } catch (error) {
    console.error('Erro geral ao gerar PDF de múltiplos documentos:', error);
    return false;
  }
};