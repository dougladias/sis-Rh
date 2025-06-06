import prismaClient from "../../prisma";

interface UpdateDeductionRequest {
  id: string;
  code?: string;
  type?: string;
  description?: string | null;
  percentage?: number | null;
  value?: number;
  isRequired?: boolean;
}

class UpdateDeductionService {
  async execute(data: UpdateDeductionRequest) {
    const { id } = data;

    // Verificar se a dedução existe
    const deductionExists = await prismaClient.deduction.findUnique({
      where: { id },
      include: {
        payslip: true
      }
    });

    if (!deductionExists) {
      throw new Error("Dedução não encontrada");
    }

    // Verificar se o holerite permite edição (não está em status final)
    if (deductionExists.payslip.status === 'PAID' || deductionExists.payslip.status === 'CANCELLED') {
      throw new Error("Não é possível editar deduções de um holerite pago ou cancelado");
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (data.code !== undefined) updateData.code = data.code;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.percentage !== undefined) updateData.percentage = data.percentage;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.isRequired !== undefined) updateData.isRequired = data.isRequired;

    // Atualizar a dedução
    const updatedDeduction = await prismaClient.deduction.update({
      where: { id },
      data: updateData
    });

    // Se o valor foi alterado, recalcular os totais do holerite
    if (data.value !== undefined) {
      // Buscar todas as deduções do holerite
      const allDeductions = await prismaClient.deduction.findMany({
        where: { payslipId: deductionExists.payslipId }
      });

      // Calcular o total de deduções
      const totalDeductions = allDeductions.reduce((sum, item) => 
        sum + Number(item.value), 0);

      // Buscar o holerite para obter valores atuais
      const payslip = await prismaClient.payslip.findUnique({
        where: { id: deductionExists.payslipId }
      });

      if (payslip) {
        // Recalcular o salário líquido
        const netSalary = Number(payslip.baseSalary) + 
                        Number(payslip.totalBenefits) - 
                        totalDeductions;

        // Atualizar o holerite
        await prismaClient.payslip.update({
          where: { id: deductionExists.payslipId },
          data: {
            totalDeductions,
            netSalary,
            updatedAt: new Date()
          }
        });
      }
    }

    return updatedDeduction;
  }
}

export { UpdateDeductionService };