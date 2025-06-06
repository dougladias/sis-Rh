import prismaClient from "../../prisma";

interface DeductionRequest {
  payslipId: string;
  code: string;
  type: string;
  description?: string;
  percentage?: number;
  value: number;
  isRequired?: boolean;
}

class AddDeductionService {
  async execute(data: DeductionRequest) {
    const { payslipId, code, type, description, percentage, value, isRequired } = data;

    // Verificar se o holerite existe
    const payslipExists = await prismaClient.payslip.findUnique({
      where: { id: payslipId }
    });

    if (!payslipExists) {
      throw new Error("Holerite não encontrado");
    }

    // Criar a dedução
    const deduction = await prismaClient.deduction.create({
      data: {
        payslipId,
        code,
        type,
        description: description || null,
        percentage: percentage || null,
        value,
        isRequired: isRequired || false
      }
    });

    // Atualizar o total de deduções no holerite
    const allDeductions = await prismaClient.deduction.findMany({
      where: { payslipId }
    });

    const totalDeductions = allDeductions.reduce((sum, item) => 
      sum + Number(item.value), 0);

    // Recalcular o salário líquido
    const netSalary = Number(payslipExists.baseSalary) + 
                     Number(payslipExists.totalBenefits) - 
                     totalDeductions;

    // Atualizar o holerite
    await prismaClient.payslip.update({
      where: { id: payslipId },
      data: {
        totalDeductions,
        netSalary,
        updatedAt: new Date()
      }
    });

    return deduction;
  }
}

export { AddDeductionService };