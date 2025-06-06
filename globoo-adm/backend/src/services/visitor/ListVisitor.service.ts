import prismaClient from "../../prisma";
import { Visitor, VisitorStatus } from "@prisma/client";

interface ListVisitorRequest {
  search?: string;
  status?: VisitorStatus;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
}

interface ListVisitorResponse {
  visitors: Visitor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ListVisitorService {
  async execute({
    search,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc"
  }: ListVisitorRequest): Promise<ListVisitorResponse> {
    
    // Definir parâmetros de paginação
    const skip = (page - 1) * limit;
    
    // Construir where para filtros
    const where: any = {};
    
    // Filtro por termo de busca (nome, documento, empresa ou anfitrião)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { documentNumber: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { hostName: { contains: search, mode: "insensitive" } }
      ];
    }
    
    // Filtro por status
    if (status) {
      where.status = status;
    }
    
    // Filtro por intervalo de datas (entrada agendada ou real)
    if (startDate && endDate) {
      where.OR = [
        {
          scheduledEntry: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          actualEntry: {
            gte: startDate,
            lte: endDate
          }
        }
      ];
    } else if (startDate) {
      where.OR = [
        { scheduledEntry: { gte: startDate } },
        { actualEntry: { gte: startDate } }
      ];
    } else if (endDate) {
      where.OR = [
        { scheduledEntry: { lte: endDate } },
        { actualEntry: { lte: endDate } }
      ];
    }
    
    // Definir a ordenação
    const orderBy: any = {};
    orderBy[sort] = order;
    
    // Buscar visitantes e total
    const [visitors, total] = await Promise.all([
      prismaClient.visitor.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          photo: {
            select: {
              id: true,
              filename: true,
              mimetype: true,
              size: true,
              uploadDate: true
            }
          }
        }
      }),
      prismaClient.visitor.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      visitors,
      total,
      page,
      limit,
      totalPages
    };
  }
}

export { ListVisitorService };