import prismaClient from "../../prisma";
import { Provider, ProviderStatus } from "@prisma/client";

interface ListProviderRequest {
  search?: string;
  status?: ProviderStatus;
  startDate?: Date;
  endDate?: Date;
  serviceType?: string;
  company?: string;
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
}

interface ListProviderResponse {
  providers: Provider[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ListProviderService {
  async execute({
    search,
    status,
    startDate,
    endDate,
    serviceType,
    company,
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc"
  }: ListProviderRequest): Promise<ListProviderResponse> {
    
    // Definir parâmetros de paginação
    const skip = (page - 1) * limit;
    
    // Construir where para filtros
    const where: any = {};
    
    // Filtro por termo de busca (nome, documento, empresa, tipo de serviço ou anfitrião)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { documentNumber: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { serviceType: { contains: search, mode: "insensitive" } },
        { hostName: { contains: search, mode: "insensitive" } }
      ];
    }
    
    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Filtro por tipo de serviço
    if (serviceType) {
      where.serviceType = {
        contains: serviceType,
        mode: "insensitive"
      };
    }

    // Filtro por empresa
    if (company) {
      where.company = {
        contains: company,
        mode: "insensitive"
      };
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
    
    // Buscar prestadores e total
    const [providers, total] = await Promise.all([
      prismaClient.provider.findMany({
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
      prismaClient.provider.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      providers,
      total,
      page,
      limit,
      totalPages
    };
  }
}

export { ListProviderService };