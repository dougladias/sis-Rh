import prismaClient from "../../prisma";
import { PayrollStatus } from "@prisma/client";

interface UpdatePayrollRequest {
  id: string;
  description?: string;
  status?: PayrollStatus;
  processedAt?: Date | null;
  processedBy?: string | null;
}

class UpdatePayrollService {
  async execute({ 
    id, 
    description, 
    status, 
    processedAt, 
    processedBy 
  }: UpdatePayrollRequest) {
    // Verificar se a folha de pagamento existe
    const payrollExists = await prismaClient.payroll.findUnique({
      where: { id }
    });

    if (!payrollExists) {
      throw new Error("Folha de pagamento não encontrada");
    }

    // Validar a mudança de status
    if (status && status !== payrollExists.status) {
      // Regras para mudança de status
      if (payrollExists.status === PayrollStatus.CANCELLED && status !== PayrollStatus.DRAFT) {
        throw new Error("Uma folha de pagamento cancelada só pode ser reativada como rascunho");
      }

      if (payrollExists.status === PayrollStatus.COMPLETED && status === PayrollStatus.DRAFT) {
        throw new Error("Uma folha de pagamento completada não pode voltar para rascunho");
      }

      // Se estiver alterando para PROCESSING ou COMPLETED, verifica se tem holerites
      if ((status === PayrollStatus.PROCESSING || status === PayrollStatus.COMPLETED)) {
        const payslipsCount = await prismaClient.payslip.count({
          where: { payrollId: id }
        });

        if (payslipsCount === 0) {
          throw new Error("Não é possível processar uma folha de pagamento sem holerites");
        }
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    
    // Tratamento especial para processedAt e processedBy
    if (processedAt !== undefined) {
      updateData.processedAt = processedAt ? new Date(processedAt) : null;
    }
    
    if (processedBy !== undefined) {
      updateData.processedBy = processedBy;
    }
    
    // Se o status for COMPLETED e não houver processedAt, definir para agora
    if (status === PayrollStatus.COMPLETED && !processedAt && !payrollExists.processedAt) {
      updateData.processedAt = new Date();
    }
    
    // Sempre atualizar o updatedAt
    updateData.updatedAt = new Date();
    
    // Atualizar a folha de pagamento
    const updatedPayroll = await prismaClient.payroll.update({
      where: { id },
      data: updateData
    });

    return updatedPayroll;
  }
}

export { UpdatePayrollService };