import prismaClient from "../../prisma";
import { PayslipStatus } from "@prisma/client";

interface ListPayslipParams {
  payrollId?: string;
  workerId?: string;
  status?: PayslipStatus;
  department?: string;
  page?: number;
  limit?: number;
  includeDetails?: boolean;
}

class ListPayslipService {
  async execute({
    payrollId,
    workerId,
    status,
    department,
    page = 1,
    limit = 10,
    includeDetails = false
  }: ListPayslipParams) {
    // Garantir que page e limit são números positivos
    const currentPage = page > 0 ? page : 1;
    const itemsPerPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * itemsPerPage;

    // Construir filtros
    const where: any = {};

    // Filtro por folha de pagamento
    if (payrollId) {
      where.payrollId = payrollId;
    }

    // Filtro por funcionário
    if (workerId) {
      where.workerId = workerId;
    }

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Filtro por departamento
    if (department) {
      where.department = department;
    }

    // Incluir detalhes dos relacionamentos?
    const include: any = {
      worker: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          department: true,
          position: true
        }
      }
    };

    // Adicionar mais detalhes se solicitado
    if (includeDetails) {
      include.deductions = true;
      include.benefits = true;
      include.payroll = {
        select: {
          id: true,
          month: true,
          year: true,
          status: true
        }
      };
    }

    // Buscar holerites com paginação e filtros
    const payslips = await prismaClient.payslip.findMany({
      where,
      include,
      skip,
      take: itemsPerPage,
      orderBy: [
        { employeeName: 'asc' }
      ]
    });

    // Contar total de registros para informações de paginação
    const totalPayslips = await prismaClient.payslip.count({ where });
    
    // Calcular total de páginas
    const totalPages = Math.ceil(totalPayslips / itemsPerPage);

    return {
      payslips,
      pagination: {
        total: totalPayslips,
        page: currentPage,
        limit: itemsPerPage,
        totalPages
      }
    };
  }
}

export { ListPayslipService };