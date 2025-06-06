import prismaClient from "../../prisma";

class GetPayrollService {
  async execute(id: string) {
    // Verificar se a folha de pagamento existe
    const payroll = await prismaClient.payroll.findUnique({
      where: { id },
      include: {
        payslips: {
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
        },
        _count: {
          select: { payslips: true }
        }
      }
    });

    if (!payroll) {
      throw new Error("Folha de pagamento não encontrada");
    }

    // Remover _count da resposta e adicionar payslipsCount
    const { _count, ...payrollData } = payroll;
    
    return {
      ...payrollData,
      payslipsCount: _count.payslips
    };
  }
}

export { GetPayrollService };