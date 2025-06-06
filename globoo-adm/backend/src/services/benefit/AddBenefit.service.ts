import prismaClient from "../../prisma";

interface BenefitRequest {
  payslipId: string;
  code: string;
  type: string;
  description?: string;
  value: number;
}

class AddBenefitService {
  async execute(data: BenefitRequest) {
    const { payslipId, code, type, description, value } = data;

    // Verificar se o holerite existe
    const payslipExists = await prismaClient.payslip.findUnique({
      where: { id: payslipId }
    });

    if (!payslipExists) {
      throw new Error("Holerite não encontrado");
    }

    // Criar o benefício
    const benefit = await prismaClient.benefits.create({
      data: {
        payslipId,
        code,
        type,
        description: description || null,
        value
      }
    });

    // Atualizar o total de benefícios no holerite
    const allBenefits = await prismaClient.benefits.findMany({
      where: { payslipId }
    });

    const totalBenefits = allBenefits.reduce((sum, item) => 
      sum + Number(item.value), 0);

    // Recalcular o salário líquido
    const netSalary = Number(payslipExists.baseSalary) + 
                     totalBenefits - 
                     Number(payslipExists.totalDeductions);

    // Atualizar o holerite
    await prismaClient.payslip.update({
      where: { id: payslipId },
      data: {
        totalBenefits,
        netSalary,
        updatedAt: new Date()
      }
    });

    return benefit;
  }
}

export { AddBenefitService };