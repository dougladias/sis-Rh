import prismaClient from "../../prisma";
import { PayslipStatus } from "@prisma/client";

interface UpdatePayslipRequest {
  id: string;
  baseSalary?: number;
  totalBenefits?: number;
  totalDeductions?: number;
  netSalary?: number;
  status?: PayslipStatus;
  paymentDate?: Date | null;
}

class UpdatePayslipService {
  async execute({ 
    id, 
    baseSalary,
    totalBenefits,
    totalDeductions,
    netSalary,
    status,
    paymentDate
  }: UpdatePayslipRequest) {
    // Verificar se o holerite existe
    const payslipExists = await prismaClient.payslip.findUnique({
      where: { id }
    });

    if (!payslipExists) {
      throw new Error("Holerite não encontrado");
    }

    // Validar a mudança de status
    if (status && status !== payslipExists.status) {
      // Se estiver alterando para PAID, definir a data de pagamento se não fornecida
      if (status === PayslipStatus.PAID && !paymentDate && !payslipExists.paymentDate) {
        paymentDate = new Date();
      }

      // Não permitir mudar de CANCELLED para outro status
      if (payslipExists.status === PayslipStatus.CANCELLED && status !== PayslipStatus.CANCELLED) {
        throw new Error("Um holerite cancelado não pode ser reativado");
      }
    }

    // Calcular o salário líquido atualizado se algum componente for alterado
    let updatedNetSalary = netSalary;
    
    if (!updatedNetSalary && (baseSalary !== undefined || totalBenefits !== undefined || totalDeductions !== undefined)) {
      const newBaseSalary = baseSalary !== undefined ? baseSalary : Number(payslipExists.baseSalary);
      const newTotalBenefits = totalBenefits !== undefined ? totalBenefits : Number(payslipExists.totalBenefits);
      const newTotalDeductions = totalDeductions !== undefined ? totalDeductions : Number(payslipExists.totalDeductions);
      
      updatedNetSalary = newBaseSalary + newTotalBenefits - newTotalDeductions;
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (baseSalary !== undefined) updateData.baseSalary = baseSalary;
    if (totalBenefits !== undefined) updateData.totalBenefits = totalBenefits;
    if (totalDeductions !== undefined) updateData.totalDeductions = totalDeductions;
    if (updatedNetSalary !== undefined) updateData.netSalary = updatedNetSalary;
    if (status !== undefined) updateData.status = status;
    if (paymentDate !== undefined) updateData.paymentDate = paymentDate;
    
    // Atualizar o holerite
    const updatedPayslip = await prismaClient.payslip.update({
      where: { id },
      data: updateData,
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
    });

    return updatedPayslip;
  }
}

export { UpdatePayslipService };