import prismaClient from "../../prisma";
import { PayrollStatus } from "@prisma/client";

interface ProcessPayrollRequest {
  id: string;
  processedBy: string;
}

class ProcessPayrollService {
  async execute({ id, processedBy }: ProcessPayrollRequest) {
    // Verificar se a folha de pagamento existe
    const payroll = await prismaClient.payroll.findUnique({
      where: { id }
    });

    if (!payroll) {
      throw new Error("Folha de pagamento não encontrada");
    }

    // Verificar se a folha está em status que permite processamento
    if (payroll.status === PayrollStatus.COMPLETED) {
      throw new Error("Esta folha de pagamento já foi processada");
    }

    if (payroll.status === PayrollStatus.CANCELLED) {
      throw new Error("Não é possível processar uma folha de pagamento cancelada");
    }

    // Verificar se há funcionários ativos para gerar holerites
    const activeWorkers = await prismaClient.worker.findMany({
      where: { status: "ACTIVE" }
    });

    if (activeWorkers.length === 0) {
      throw new Error("Não há funcionários ativos para processar a folha de pagamento");
    }

    // Primeiro, atualiza o status para PROCESSING
    await prismaClient.payroll.update({
      where: { id },
      data: {
        status: PayrollStatus.PROCESSING,
        updatedAt: new Date()
      }
    });

    // Remover holerites existentes (apenas se estiver em DRAFT)
    if (payroll.status === PayrollStatus.DRAFT) {
      await prismaClient.payslip.deleteMany({
        where: { payrollId: id }
      });
    }

    // Criar holerites para cada funcionário ativo
    const payslipPromises = activeWorkers.map(async (worker) => {
      // Aqui você pode implementar lógica para calcular deduções, benefícios etc.
      const netSalary = worker.salary;
      
      return prismaClient.payslip.create({
        data: {
          payrollId: id,
          workerId: worker.id,
          employeeCode: worker.employeeCode,
          employeeName: worker.name,
          department: worker.department,
          position: worker.position,
          baseSalary: worker.salary,
          totalBenefits: worker.allowance || 0,
          totalDeductions: 0, // Aqui você calcularia INSS, IR, etc.
          netSalary: netSalary,
          status: "DRAFT"
        }
      });
    });

    // Executar criação de holerites
    const payslips = await Promise.all(payslipPromises);

    // Calcular totalizadores da folha
    let totalGrossSalary = 0;
    let totalDeductions = 0;
    let totalBenefits = 0;
    let totalNetSalary = 0;

    payslips.forEach(payslip => {
      totalGrossSalary += Number(payslip.baseSalary);
      totalDeductions += Number(payslip.totalDeductions);
      totalBenefits += Number(payslip.totalBenefits);
      totalNetSalary += Number(payslip.netSalary);
    });

    // Atualizar a folha de pagamento com os totalizadores
    const updatedPayroll = await prismaClient.payroll.update({
      where: { id },
      data: {
        status: PayrollStatus.COMPLETED,
        processedAt: new Date(),
        processedBy,
        totalGrossSalary,
        totalDeductions,
        totalBenefits,
        totalNetSalary,
        employeeCount: payslips.length,
        updatedAt: new Date()
      }
    });

    return {
      payroll: updatedPayroll,
      payslipsCreated: payslips.length
    };
  }
}

export { ProcessPayrollService };