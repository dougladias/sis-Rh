import prismaClient from "../../prisma";

class DeletePayslipService {
  async execute(id: string) {
    // Verificar se o holerite existe
    const payslipExists = await prismaClient.payslip.findUnique({
      where: { id },
      include: {
        payroll: true
      }
    });

    if (!payslipExists) {
      throw new Error("Holerite não encontrado");
    }

    // Verificar se a folha de pagamento associada já foi concluída
    if (payslipExists.payroll.status === 'COMPLETED') {
      throw new Error("Não é possível excluir um holerite de uma folha de pagamento concluída");
    }

    // Excluir o holerite e seus relacionamentos (deduções e benefícios serão
    // excluídos automaticamente devido ao onDelete: Cascade)
    await prismaClient.payslip.delete({
      where: { id }
    });

    return { success: true };
  }
}

export { DeletePayslipService };