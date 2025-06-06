import prismaClient from "../../prisma";

class GetDeductionService {
  async execute(id: string) {
    // Buscar a dedução pelo ID
    const deduction = await prismaClient.deduction.findUnique({
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

    if (!deduction) {
      throw new Error("Dedução não encontrada");
    }

    return deduction;
  }
}

export { GetDeductionService };