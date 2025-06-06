import prismaClient from "../../prisma";

class ListDeductionService {
  async execute(payslipId: string) {
    // Verificar se o holerite existe
    const payslipExists = await prismaClient.payslip.findUnique({
      where: { id: payslipId }
    });

    if (!payslipExists) {
      throw new Error("Holerite não encontrado");
    }

    // Buscar todas as deduções do holerite
    const deductions = await prismaClient.deduction.findMany({
      where: { payslipId },
      orderBy: { code: 'asc' }
    });

    return deductions;
  }
}

export { ListDeductionService };