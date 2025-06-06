import prismaClient from "../../prisma";
import { DocumentType } from "@prisma/client";

interface ListTemplateParams {
  type?: DocumentType;
  category?: string;
  name?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

class ListTemplateService {
  async execute({ 
    type, 
    category, 
    name,
    isActive,
    page = 1, 
    limit = 10 
  }: ListTemplateParams) {
    const currentPage = page > 0 ? page : 1;
    const itemsPerPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * itemsPerPage;

    // Construir filtros dinâmicos
    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (category) {
      where.category = category;
    }

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive'
      };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Buscar templates paginados
    const templates = await prismaClient.template.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        category: true,
        description: true,
        version: true,
        createdBy: true,
        format: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      },
      skip,
      take: itemsPerPage,
      orderBy: { createdAt: 'desc' }
    });

    // Contar o total de registros
    const total = await prismaClient.template.count({ where });

    // Retornar os templates e metadados de paginação
    return {
      templates,
      meta: {
        total,
        page: currentPage,
        limit: itemsPerPage,
        pages: Math.ceil(total / itemsPerPage)
      }
    };
  }
}

export { ListTemplateService };