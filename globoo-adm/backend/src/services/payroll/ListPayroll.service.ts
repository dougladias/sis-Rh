import prismaClient from "../../prisma";
import { PayrollStatus } from "@prisma/client";

interface ListPayrollParams {
  year?: number;
  month?: number;
  status?: PayrollStatus;
  page?: number;
  limit?: number;
}

class ListPayrollService {
  async execute({
    year,
    month,
    status,
    page = 1,
    limit = 10
  }: ListPayrollParams) {
    // Garantir que page e limit são números positivos
    const currentPage = page > 0 ? page : 1;
    const itemsPerPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * itemsPerPage;

    // Construir filtros
    const where: any = {};

    // Filtro por ano
    if (year) {
      where.year = year;
    }

    // Filtro por mês
    if (month) {
      where.month = month;
    }

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Buscar folhas de pagamento com paginação e filtros
    const payrolls = await prismaClient.payroll.findMany({
      where,
      skip,
      take: itemsPerPage,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
      include: {
        _count: {
          select: { 
            payslips: true 
          }
        }
      }
    });

    // Contar total de registros para informações de paginação
    const totalPayrolls = await prismaClient.payroll.count({ where });
    
    // Calcular total de páginas
    const totalPages = Math.ceil(totalPayrolls / itemsPerPage);

    return {
      payrolls: payrolls.map(payroll => ({
        ...payroll,
        payslipsCount: payroll._count.payslips,
        _count: undefined
      })),
      pagination: {
        total: totalPayrolls,
        page: currentPage,
        limit: itemsPerPage,
        totalPages
      }
    };
  }
}

export { ListPayrollService };