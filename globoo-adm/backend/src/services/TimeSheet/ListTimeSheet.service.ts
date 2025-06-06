import prismaClient from "../../prisma";

interface ListTimeSheetParams {
  workerId?: string;
  startDate?: string;
  endDate?: string;
  isAbsent?: boolean;
  page?: number;
  limit?: number;
}

class ListTimeSheetService {
  async execute({
    workerId,
    startDate,
    endDate,
    isAbsent,
    page = 1,
    limit = 10
  }: ListTimeSheetParams) {
    // Garantir que page e limit são números positivos
    const currentPage = page > 0 ? page : 1;
    const itemsPerPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * itemsPerPage;

    // Construir filtros
    const where: any = {};

    // Filtro por funcionário
    if (workerId) {
      where.workerId = workerId;
    }

    // Filtro por período de datas
    if (startDate || endDate) {
      where.date = {};
      
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Filtro por ausência
    if (isAbsent !== undefined) {
      where.isAbsent = isAbsent;
    }

    // Buscar TimeSheet com paginação e filtros
    const TimeSheet = await prismaClient.log.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: true
          }
        }
      },
      skip,
      take: itemsPerPage,
      orderBy: [
        { date: 'desc' },
        { workerId: 'asc' }
      ]
    });

    // Contar total de registros para informações de paginação
    const totalTimeSheets = await prismaClient.log.count({ where });
    
    // Calcular total de páginas
    const totalPages = Math.ceil(totalTimeSheets / itemsPerPage);

    return {
      TimeSheet,
      pagination: {
        total: totalTimeSheets,
        page: currentPage,
        limit: itemsPerPage,
        totalPages
      }
    };
  }
}

export { ListTimeSheetService };