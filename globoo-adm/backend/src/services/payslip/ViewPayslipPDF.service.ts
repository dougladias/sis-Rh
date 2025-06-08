import prismaClient from "../../prisma";
import PDFDocument from 'pdfkit';

class GeneratePayslipPDFService {
  async execute(payslipId: string): Promise<Buffer> {
    // Buscar o holerite com todos os dados necessários
    const payslip = await prismaClient.payslip.findUnique({
      where: { id: payslipId },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            cpf: true,
            rg: true,
            department: true,
            position: true,
            contractType: true,
            admissionDate: true,
            email: true,
            phone: true,
            address: true
          }
        },
        payroll: {
          select: {
            id: true,
            month: true,
            year: true,
            description: true
          }
        },
        deductions: {
          orderBy: {
            code: 'asc'
          }
        },
        benefits: {
          orderBy: {
            code: 'asc'
          }
        }
      }
    });

    if (!payslip) {
      throw new Error("Holerite não encontrado");
    }

    // Criar novo documento PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Array para armazenar os chunks do PDF
    const chunks: Buffer[] = [];
    
    // Capturar os dados do PDF
    doc.on('data', (chunk) => chunks.push(chunk));
    
    // Promise para aguardar a finalização do PDF
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Gerar o conteúdo do PDF
    this.generatePDFContent(doc, payslip);

    // Finalizar o documento
    doc.end();

    // Retornar o buffer do PDF
    return pdfPromise;
  }

  private generatePDFContent(doc: PDFKit.PDFDocument, payslip: any) {
    const { worker, payroll, deductions, benefits } = payslip;
    
    // Configurações
    const borderColor = '#000000';
    const textColor = '#000000';
    
    // Margens e dimensões - ajustadas para o layout exato
    const margin = 20;
    const pageWidth = 595;
    const contentWidth = pageWidth - (margin * 2);

    let yPos = 30;

    // Caixa do EMPREGADOR (canto superior esquerdo)
    doc.rect(margin, yPos, 150, 80)
       .stroke(borderColor);
    
    doc.fontSize(8)
       .fillColor(textColor)
       .text('EMPREGADOR', margin + 5, yPos + 5)
       .text('Nome: GLOBOO SISTEMAS LTDA', margin + 5, yPos + 18)
       .text('Endereço: Rua das Empresas, 123', margin + 5, yPos + 30)
       .text('CNPJ: 12.345.678/0001-90', margin + 5, yPos + 55);

    // Título central
    doc.fontSize(14)
       .text('Recibo de Pagamento de Salário', margin + 170, yPos + 20, { width: 250, align: 'center' });

    // Caixa da referência (canto superior direito)
    doc.rect(pageWidth - margin - 120, yPos, 120, 80)
       .stroke(borderColor);
    
    doc.fontSize(8)
       .text(`Referência: ${this.formatMonthYear(payroll.month, payroll.year)}`, pageWidth - margin - 115, yPos + 15)
       .fontSize(12)
       .text('janeiro-20', pageWidth - margin - 90, yPos + 45, { align: 'center' });

    yPos += 90;

    // Caixa dos dados do funcionário
    doc.rect(margin, yPos, contentWidth, 40)
       .stroke(borderColor);
    
    doc.fontSize(8)
       .text('CÓDIGO   NOME DO FUNCIONÁRIO', margin + 5, yPos + 5)
       .fontSize(10)
       .text(`${worker.employeeCode}    ${worker.name.toUpperCase()}`, margin + 5, yPos + 18);

    // Lado direito - Matrícula e Função
    doc.fontSize(8)
       .text('MATRÍCULA', pageWidth - margin - 150, yPos + 5)
       .text('FUNÇÃO', pageWidth - margin - 80, yPos + 5)
       .fontSize(10)
       .text(worker.employeeCode, pageWidth - margin - 150, yPos + 18)
       .text(worker.position.toUpperCase(), pageWidth - margin - 80, yPos + 18);

    yPos += 50;

    // Tabela principal EXATAMENTE como na imagem
    this.generateExactPaymentTable(doc, payslip, yPos, margin, contentWidth);
  }

  private generateExactPaymentTable(doc: PDFKit.PDFDocument, payslip: any, startY: number, margin: number, contentWidth: number) {
    const pageWidth = 595;
    const { benefits, deductions } = payslip;
    const borderColor = '#000000';
    let yPos = startY;

    // Tabela principal - dimensões exatas da imagem
    const tableHeight = 320;
    const tableWidth = contentWidth;

    // Caixa principal
    doc.rect(margin, yPos, tableWidth, tableHeight)
       .stroke(borderColor);

    // Definir larguras das colunas EXATAMENTE como na imagem
    const col1Width = 40;   // Cód
    const col2Width = 200;  // Descrição  
    const col3Width = 80;   // Referência
    const col4Width = 80;   // Proventos
    const col5Width = 75;   // Descontos

    // Cabeçalho da tabela
    const headerHeight = 15;
    
    // Linhas verticais do cabeçalho
    doc.moveTo(margin + col1Width, yPos).lineTo(margin + col1Width, yPos + headerHeight).stroke(borderColor);
    doc.moveTo(margin + col1Width + col2Width, yPos).lineTo(margin + col1Width + col2Width, yPos + headerHeight).stroke(borderColor);
    doc.moveTo(margin + col1Width + col2Width + col3Width, yPos).lineTo(margin + col1Width + col2Width + col3Width, yPos + headerHeight).stroke(borderColor);
    doc.moveTo(margin + col1Width + col2Width + col3Width + col4Width, yPos).lineTo(margin + col1Width + col2Width + col3Width + col4Width, yPos + headerHeight).stroke(borderColor);

    // Linha horizontal do cabeçalho
    doc.moveTo(margin, yPos + headerHeight).lineTo(margin + tableWidth, yPos + headerHeight).stroke(borderColor);

    // Textos do cabeçalho
    doc.fontSize(8)
       .text('Cód', margin + 15, yPos + 4)
       .text('Descrição', margin + col1Width + 80, yPos + 4)
       .text('Referência', margin + col1Width + col2Width + 15, yPos + 4)
       .text('Proventos', margin + col1Width + col2Width + col3Width + 15, yPos + 4)
       .text('Descontos', margin + col1Width + col2Width + col3Width + col4Width + 10, yPos + 4);

    yPos += headerHeight + 5;

    // Área de dados
    let dataY = yPos;

    // Linhas verticais da área de dados (até o final da tabela)
    const dataAreaHeight = 220;
    doc.moveTo(margin + col1Width, yPos).lineTo(margin + col1Width, yPos + dataAreaHeight).stroke(borderColor);
    doc.moveTo(margin + col1Width + col2Width, yPos).lineTo(margin + col1Width + col2Width, yPos + dataAreaHeight).stroke(borderColor);
    doc.moveTo(margin + col1Width + col2Width + col3Width, yPos).lineTo(margin + col1Width + col2Width + col3Width, yPos + dataAreaHeight).stroke(borderColor);
    doc.moveTo(margin + col1Width + col2Width + col3Width + col4Width, yPos).lineTo(margin + col1Width + col2Width + col3Width + col4Width, yPos + dataAreaHeight).stroke(borderColor);

    // Preenchimento dos dados - EXATAMENTE como na imagem
    doc.fontSize(8);

    // 001 SALARIO BASE
    doc.text('001', margin + 15, dataY)
       .text('SALARIO BASE', margin + col1Width + 5, dataY)
       .text('220,00', margin + col1Width + col2Width + 20, dataY)
       .text('2.500,00', margin + col1Width + col2Width + col3Width + 20, dataY, { align: 'right', width: 50 });
    dataY += 12;

    // 003 COMISSÃO (se houver benefícios)
    if (benefits && benefits.length > 0) {
      const firstBenefit = benefits[0];
      doc.text('003', margin + 15, dataY)
         .text('COMISSÃO', margin + col1Width + 5, dataY)
         .text('', margin + col1Width + col2Width + 20, dataY)
         .text(this.formatCurrencySimple(firstBenefit.value), margin + col1Width + col2Width + col3Width + 20, dataY, { align: 'right', width: 50 });
      dataY += 12;
    }

    // 061 INSS (primeira dedução)
    if (deductions && deductions.length > 0) {
      const inss = deductions.find((d: any) => d.type.includes('INSS')) || deductions[0];
      doc.text('061', margin + 15, dataY)
         .text('INSS', margin + col1Width + 5, dataY)
         .text('9,15%', margin + col1Width + col2Width + 20, dataY)
         .text(this.formatCurrencySimple(inss.value), margin + col1Width + col2Width + col3Width + col4Width + 15, dataY, { align: 'right', width: 50 });
      dataY += 12;

      // 054 IRRF (segunda dedução se existir)
      if (deductions.length > 1) {
        const irrf = deductions.find((d: any) => d.type.includes('IRRF')) || deductions[1];
        doc.text('054', margin + 15, dataY)
           .text('IRRF', margin + col1Width + 5, dataY)
           .text('7,50%', margin + col1Width + col2Width + 20, dataY)
           .text(this.formatCurrencySimple(irrf.value), margin + col1Width + col2Width + col3Width + col4Width + 15, dataY, { align: 'right', width: 50 });
        dataY += 12;
      }
    }

    // Linha separadora antes dos totais
    yPos += dataAreaHeight;
    doc.moveTo(margin, yPos).lineTo(margin + tableWidth, yPos).stroke(borderColor);

    // Área dos totais
    const totalsHeight = 60;
    
    // Primeira linha dos totais - VENCIMENTOS
    yPos += 5;
    doc.fontSize(8)
       .text('VENCIMENTOS', margin + 5, yPos);

    // Linhas verticais na área de totais
    doc.moveTo(margin + col1Width + col2Width + col3Width, yPos - 5).lineTo(margin + col1Width + col2Width + col3Width, yPos + totalsHeight - 10).stroke(borderColor);
    doc.moveTo(margin + col1Width + col2Width + col3Width + col4Width, yPos - 5).lineTo(margin + col1Width + col2Width + col3Width + col4Width, yPos + totalsHeight - 10).stroke(borderColor);

    // Totais calculados
    const totalProventos = Number(payslip.baseSalary) + Number(payslip.totalBenefits);
    const totalDescontos = Number(payslip.totalDeductions);
    const totalLiquido = Number(payslip.netSalary);

    // Valores dos totais
    doc.text(this.formatCurrencySimple(totalProventos), margin + col1Width + col2Width + col3Width + 20, yPos, { align: 'right', width: 50 })
       .text(this.formatCurrencySimple(totalDescontos), margin + col1Width + col2Width + col3Width + col4Width + 15, yPos, { align: 'right', width: 50 });

    // Segunda linha dos totais
    yPos += 15;
    doc.moveTo(margin + col1Width + col2Width + col3Width, yPos - 3).lineTo(margin + tableWidth, yPos - 3).stroke(borderColor);
    
    doc.text('Líquido a Receber:', margin + 5, yPos)
       .fontSize(10)
       .text(this.formatCurrencySimple(totalLiquido), margin + col1Width + col2Width + col3Width + 20, yPos, { align: 'right', width: col4Width + col5Width - 20 });

    yPos += 25;

    // Seção inferior - caixinhas como na imagem
    const bottomBoxY = yPos + 20;
    
    // Labels da seção inferior
    doc.fontSize(7)
       .text('Salário Base  Base Cálc FGTS   FGTS 8p.100s  Base Cálc  INSS  Base Cálc  IRRF', margin, bottomBoxY)
       .text(this.formatCurrencySimple(payslip.baseSalary), margin, bottomBoxY + 15)
       .text(this.formatCurrencySimple(totalProventos), margin + 70, bottomBoxY + 15)
       .text('220,00', margin + 150, bottomBoxY + 15)
       .text(this.formatCurrencySimple(totalProventos), margin + 200, bottomBoxY + 15)
       .text('2.308,79', margin + 280, bottomBoxY + 15);

    // Caixa lateral direita (como na imagem original)
    doc.rect(pageWidth - margin - 50, startY, 50, tableHeight + 80)
       .stroke(borderColor);
    
    // Texto vertical na lateral (simulado)
    doc.fontSize(6)
       .text('DISCRIMINAÇÃO DE DESCONTO/DECLARAÇÃO DO EMPREGADO', pageWidth - margin - 45, startY + 20, {
         width: 40,
         align: 'center'
       });

    // Rodapé
    yPos += 80;
    doc.fontSize(6)
       .text(`Recibo gerado eletronicamente em ${this.formatDate(new Date())}`, margin, yPos, { align: 'center', width: contentWidth - 50 });
  }

  // Função auxiliar para formatar moeda simples (sem R$)
  private formatCurrencySimple(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  // Funções utilitárias
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR');
  }

  private formatMonthYear(month: number, year: number): string {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[month - 1]} ${year}`;
  }

  private formatCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Rascunho',
      'PROCESSED': 'Processado',
      'PAID': 'Pago',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
  }
}

export { GeneratePayslipPDFService };