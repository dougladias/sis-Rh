import prismaClient from "../../prisma";

class ListBenefitService {
  async execute(payslipId: string) {
    // Verificar se o holerite existe
    const payslipExists = await prismaClient.payslip.findUnique({
      where: { id: payslipId }
    });

    if (!payslipExists) {
      throw new Error("Holerite não encontrado");
    }

    // Buscar todos os benefícios do holerite
    const benefits = await prismaClient.benefits.findMany({
      where: { payslipId },
      orderBy: { code: 'asc' }
    });

    return benefits;
  }
}

export { ListBenefitService };