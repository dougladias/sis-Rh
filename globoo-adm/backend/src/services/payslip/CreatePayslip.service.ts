import prismaClient from "../../prisma";
import { PayslipStatus } from "@prisma/client";

interface PayslipRequest {
  payrollId: string;
  workerId: string;
  baseSalary?: number;
  totalBenefits?: number;
  totalDeductions?: number;
  netSalary?: number;
  status?: PayslipStatus;
  paymentDate?: Date | null;
  deductions?: {
    code: string;
    type: string;
    description?: string;
    percentage?: number;
    value: number;
    isRequired?: boolean;
  }[];
  benefits?: {
    code: string;
    type: string;
    description?: string;
    value: number;
  }[];
}

class CreatePayslipService {
  async execute(data: PayslipRequest) {
    const { payrollId, workerId } = data;

    // Validações básicas
    if (!payrollId || !workerId) {
      throw new Error("IDs da folha de pagamento e do funcionário são obrigatórios");
    }

    // Verificar se a folha de pagamento existe
    const payrollExists = await prismaClient.payroll.findUnique({
      where: { id: payrollId }
    });

    if (!payrollExists) {
      throw new Error("Folha de pagamento não encontrada");
    }

    // Verificar se o funcionário existe
    const worker = await prismaClient.worker.findUnique({
      where: { id: workerId }
    });

    if (!worker) {
      throw new Error("Funcionário não encontrado");
    }

    // Verificar se já existe um holerite para este funcionário nesta folha
    const existingPayslip = await prismaClient.payslip.findUnique({
      where: {
        payrollId_workerId: {
          payrollId,
          workerId
        }
      }
    });

    if (existingPayslip) {
      throw new Error("Já existe um holerite para este funcionário nesta folha de pagamento");
    }

    // Calcular salário líquido se não fornecido
    let baseSalary = data.baseSalary || Number(worker.salary);
    let totalBenefits = data.totalBenefits || Number(worker.allowance || 0);
    let totalDeductions = data.totalDeductions || 0;
    let netSalary = data.netSalary || (baseSalary + totalBenefits - totalDeductions);

    // Criar o holerite
    const payslip = await prismaClient.payslip.create({
      data: {
        payrollId,
        workerId,
        employeeCode: worker.employeeCode,
        employeeName: worker.name,
        department: worker.department,
        position: worker.position,
        baseSalary,
        totalBenefits,
        totalDeductions,
        netSalary,
        status: data.status || PayslipStatus.DRAFT,
        paymentDate: data.paymentDate || null,
        
        // Criar deduções se fornecidas
        deductions: data.deductions ? {
          createMany: {
            data: data.deductions.map(deduction => ({
              code: deduction.code,
              type: deduction.type,
              description: deduction.description || null,
              percentage: deduction.percentage || null,
              value: deduction.value,
              isRequired: deduction.isRequired || false
            }))
          }
        } : undefined,
        
        // Criar benefícios se fornecidos
        benefits: data.benefits ? {
          createMany: {
            data: data.benefits.map(benefit => ({
              code: benefit.code,
              type: benefit.type,
              description: benefit.description || null,
              value: benefit.value
            }))
          }
        } : undefined
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: true,
            position: true
          }
        },
        deductions: true,
        benefits: true
      }
    });

    return payslip;
  }
}

export { CreatePayslipService };