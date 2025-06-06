import prismaClient from "../../prisma";

class GetBenefitService {
  async execute(id: string) {
    // Buscar o benefício pelo ID
    const benefit = await prismaClient.benefits.findUnique({
      where: { id },
      include: {
        payslip: {
          select: {
            id: true,
            employeeName: true,
            employeeCode: true
          }
        }
      }
    });

    if (!benefit) {
      throw new Error("Benefício não encontrado");
    }

    return benefit;
  }
}

export { GetBenefitService };