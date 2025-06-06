import prismaClient from "../../prisma";

class DeleteBenefitService {
  async execute(id: string) {
    // Verificar se o benefício existe
    const benefit = await prismaClient.benefits.findUnique({
      where: { id },
      include: {
        payslip: true
      }
    });

    if (!benefit) {
      throw new Error("Benefício não encontrado");
    }

    // Verificar se o holerite permite exclusão de benefícios
    if (benefit.payslip.status === 'PAID' || benefit.payslip.status === 'CANCELLED') {
      throw new Error("Não é possível excluir benefícios de um holerite pago ou cancelado");
    }

    // Armazenar o ID do holerite e o valor do benefício para recálculo posterior
    const payslipId = benefit.payslipId;
    const benefitValue = Number(benefit.value);
    
    // Excluir o benefício
    await prismaClient.benefits.delete({
      where: { id }
    });

    // Recalcular totais do holerite
    const payslip = await prismaClient.payslip.findUnique({
      where: { id: payslipId }
    });
    
    if (payslip) {
      // Calcular novo total de benefícios
      const newTotalBenefits = Number(payslip.totalBenefits) - benefitValue;
      
      // Recalcular salário líquido
      const newNetSalary = Number(payslip.baseSalary) + 
                         newTotalBenefits - 
                         Number(payslip.totalDeductions);
      
      // Atualizar o holerite
      await prismaClient.payslip.update({
        where: { id: payslipId },
        data: {
          totalBenefits: newTotalBenefits,
          netSalary: newNetSalary,
          updatedAt: new Date()
        }
      });
    }

    return { success: true };
  }
}

export { DeleteBenefitService };