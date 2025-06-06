import prismaClient from "../../prisma";
import { ContractType, WorkerStatus } from "@prisma/client";

interface ListWorkerParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: WorkerStatus;
  contractType?: ContractType;
}

class ListWorkerService {
  async execute({
    page = 1,
    limit = 10,
    search,
    department,
    status,
    contractType
  }: ListWorkerParams) {
    // Garantir que page e limit são números positivos
    const currentPage = page > 0 ? page : 1;
    const itemsPerPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * itemsPerPage;

    // Construir filtros
    const where: any = {};

    // Filtro de busca por nome, código ou CPF
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtro por departamento
    if (department) {
      where.department = department;
    }

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Filtro por tipo de contrato
    if (contractType) {
      where.contractType = contractType;
    }

    // Buscar funcionários com paginação e filtros
    const workers = await prismaClient.worker.findMany({
      where,
      skip,
      take: itemsPerPage,
      orderBy: {
        name: 'asc'
      }
    });

    // Contar total de registros para informações de paginação
    const totalWorkers = await prismaClient.worker.count({ where });
    
    // Calcular total de páginas
    const totalPages = Math.ceil(totalWorkers / itemsPerPage);

    return {
      workers,
      pagination: {
        total: totalWorkers,
        page: currentPage,
        limit: itemsPerPage,
        totalPages
      }
    };
  }
}

export { ListWorkerService };