import prismaClient from "../../prisma";

interface UpdateBenefitRequest {
  id: string;
  code?: string;
  type?: string;
  description?: string | null;
  value?: number;
}

class UpdateBenefitService {
  async execute(data: UpdateBenefitRequest) {
    const { id } = data;

    // Verificar se o benefício existe
    const benefitExists = await prismaClient.benefits.findUnique({
      where: { id },
      include: {
        payslip: true
      }
    });

    if (!benefitExists) {
      throw new Error("Benefício não encontrado");
    }

    // Verificar se o holerite permite edição (não está em status final)
    if (benefitExists.payslip.status === 'PAID' || benefitExists.payslip.status === 'CANCELLED') {
      throw new Error("Não é possível editar benefícios de um holerite pago ou cancelado");
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (data.code !== undefined) updateData.code = data.code;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.value !== undefined) updateData.value = data.value;

    // Atualizar o benefício
    const updatedBenefit = await prismaClient.benefits.update({
      where: { id },
      data: updateData
    });

    // Se o valor foi alterado, recalcular os totais do holerite
    if (data.value !== undefined) {
      // Buscar todos os benefícios do holerite
      const allBenefits = await prismaClient.benefits.findMany({
        where: { payslipId: benefitExists.payslipId }
      });

      // Calcular o total de benefícios
      const totalBenefits = allBenefits.reduce((sum, item) => 
        sum + Number(item.value), 0);

      // Buscar o holerite para obter valores atuais
      const payslip = await prismaClient.payslip.findUnique({
        where: { id: benefitExists.payslipId }
      });

      if (payslip) {
        // Recalcular o salário líquido
        const netSalary = Number(payslip.baseSalary) + 
                        totalBenefits - 
                        Number(payslip.totalDeductions);

        // Atualizar o holerite
        await prismaClient.payslip.update({
          where: { id: benefitExists.payslipId },
          data: {
            totalBenefits,
            netSalary,
            updatedAt: new Date()
          }
        });
      }
    }

    return updatedBenefit;
  }
}

export { UpdateBenefitService };