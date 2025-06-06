import prismaClient from "../../prisma";
import { DocumentType } from "@prisma/client";

interface ListDocumentParams {
  workerId?: string;
  documentType?: DocumentType;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

class ListDocumentService {
  async execute({ 
    workerId, 
    documentType, 
    category,
    isActive,
    page = 1, 
    limit = 10 
  }: ListDocumentParams) {
    // Garantir que page e limit são números positivos
    const currentPage = page > 0 ? page : 1;
    const itemsPerPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * itemsPerPage;

    // Construir filtros dinâmicos
    const where: any = {};
    
    if (workerId) {
      where.workerId = workerId;
    }
    
    if (documentType) {
      where.documentType = documentType;
    }
    
    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Buscar documentos paginados
    const documents = await prismaClient.file.findMany({
      where,
      select: {
        id: true,
        workerId: true,
        documentType: true,
        filename: true,
        originalName: true,
        mimetype: true,
        size: true,
        description: true,
        category: true,
        expiresAt: true,
        isActive: true,
        uploadDate: true,
        worker: {
          select: {
            name: true,
            employeeCode: true,
            department: true
          }
        }
      },
      skip,
      take: itemsPerPage,
      orderBy: { uploadDate: 'desc' }
    });

    // Contar o total de registros
    const total = await prismaClient.file.count({ where });

    // Retornar os documentos e metadados de paginação
    return {
      documents,
      meta: {
        total,
        page: currentPage,
        limit: itemsPerPage,
        pages: Math.ceil(total / itemsPerPage)
      }
    };
  }
}

export { ListDocumentService };