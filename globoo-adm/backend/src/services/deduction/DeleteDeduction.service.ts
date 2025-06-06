import prismaClient from "../../prisma";

class DeleteDeductionService {
  async execute(id: string) {
    // Verificar se a dedução existe
    const deduction = await prismaClient.deduction.findUnique({
      where: { id },
      include: {
        payslip: true
      }
    });

    if (!deduction) {
      throw new Error("Dedução não encontrada");
    }

    // Verificar se o holerite permite exclusão de deduções
    if (deduction.payslip.status === 'PAID' || deduction.payslip.status === 'CANCELLED') {
      throw new Error("Não é possível excluir deduções de um holerite pago ou cancelado");
    }

    // Armazenar o ID do holerite e o valor da dedução para recálculo posterior
    const payslipId = deduction.payslipId;
    const deductionValue = Number(deduction.value);
    
    // Excluir a dedução
    await prismaClient.deduction.delete({
      where: { id }
    });

    // Recalcular totais do holerite
    const payslip = await prismaClient.payslip.findUnique({
      where: { id: payslipId }
    });
    
    if (payslip) {
      // Calcular novo total de deduções
      const newTotalDeductions = Number(payslip.totalDeductions) - deductionValue;
      
      // Recalcular salário líquido
      const newNetSalary = Number(payslip.baseSalary) + 
                         Number(payslip.totalBenefits) - 
                         newTotalDeductions;
      
      // Atualizar o holerite
      await prismaClient.payslip.update({
        where: { id: payslipId },
        data: {
          totalDeductions: newTotalDeductions,
          netSalary: newNetSalary,
          updatedAt: new Date()
        }
      });
    }

    return { success: true };
  }
}

export { DeleteDeductionService };