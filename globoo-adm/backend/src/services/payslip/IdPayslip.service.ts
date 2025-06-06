import prismaClient from "../../prisma";

class GetPayslipService {
  async execute(id: string) {
    // Verificar se o holerite existe
    const payslip = await prismaClient.payslip.findUnique({
      where: { id },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: true,
            position: true,
            contractType: true,
            cpf: true,
            email: true
          }
        },
        payroll: {
          select: {
            id: true,
            month: true,
            year: true,
            status: true
          }
        },
        deductions: true,
        benefits: true
      }
    });

    if (!payslip) {
      throw new Error("Holerite não encontrado");
    }

    return payslip;
  }
}

export { GetPayslipService };