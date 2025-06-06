import prismaClient from "../../prisma";
import { PayrollStatus } from "@prisma/client";

interface PayrollRequest {
  month: number;
  year: number;
  description?: string;
  status?: PayrollStatus;
}

class CreatePayrollService {
  async execute({ month, year, description, status = PayrollStatus.DRAFT }: PayrollRequest) {
    // Validações básicas
    if (month < 1 || month > 12) {
      throw new Error("Mês inválido. Deve ser um número entre 1 e 12.");
    }

    if (year < 2000 || year > 2100) {
      throw new Error("Ano inválido. Deve ser um número entre 2000 e 2100.");
    }

    // Verificar se já existe uma folha de pagamento para este mês e ano
    const existingPayroll = await prismaClient.payroll.findUnique({
      where: {
        month_year: {
          month,
          year
        }
      }
    });

    if (existingPayroll) {
      throw new Error(`Já existe uma folha de pagamento para ${month}/${year}`);
    }

    // Criar a folha de pagamento
    const payroll = await prismaClient.payroll.create({
      data: {
        month,
        year,
        description: description || `Folha de Pagamento - ${month}/${year}`,
        status,
        totalGrossSalary: 0,
        totalDeductions: 0,
        totalBenefits: 0,
        totalNetSalary: 0,
        employeeCount: 0
      }
    });

    return payroll;
  }
}

export { CreatePayrollService };