import prismaClient from "../../prisma";
import { PayrollStatus } from "@prisma/client";

class DeletePayrollService {
  async execute(id: string) {
    // Verificar se a folha de pagamento existe
    const payrollExists = await prismaClient.payroll.findUnique({
      where: { id }
    });

    if (!payrollExists) {
      throw new Error("Folha de pagamento não encontrada");
    }

    // Verificar se a folha está em status que permite exclusão
    if (payrollExists.status === PayrollStatus.PROCESSING || 
        payrollExists.status === PayrollStatus.COMPLETED) {
      throw new Error("Não é possível excluir uma folha de pagamento que já está em processamento ou concluída");
    }

    // Verificar se há holerites associados
    const payslipsCount = await prismaClient.payslip.count({
      where: { payrollId: id }
    });

    if (payslipsCount > 0) {
      throw new Error("Não é possível excluir uma folha de pagamento com holerites associados");
    }

    // Excluir a folha de pagamento
    await prismaClient.payroll.delete({
      where: { id }
    });

    return { success: true };
  }
}

export { DeletePayrollService };