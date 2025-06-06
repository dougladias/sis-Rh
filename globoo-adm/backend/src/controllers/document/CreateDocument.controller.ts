import prismaClient from "../../prisma";
import { DocumentType } from "@prisma/client";
import { Request, Response } from "express";
import { CreateDocumentService } from "../../services/document/CreateDocument.service";

// Extend the Request interface to include the 'file' property
declare global {
  namespace Express {
    interface Request {
      uploadedFile?: {
        originalname: string;
        filename: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
      };
    }
  }
}


interface ListDocumentsRequest {
  workerId?: string;
  documentType?: DocumentType;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

class ListDocumentsService {
  async execute({ 
    workerId, 
    documentType, 
    category,
    isActive,
    page = 1, 
    limit = 10 
  }: ListDocumentsRequest) {
    const skip = (page - 1) * limit;

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
      take: limit,
      orderBy: { uploadDate: 'desc' }
    });

    // Contar o total de registros
    const total = await prismaClient.file.count({ where });

    return {
      documents,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

class CreateDocumentController {
  async handle(req: Request, res: Response) {
    try {
      // Verificar se há um arquivo enviado
      if (!req.uploadedFile) {
        return res.status(400).json({
          success: false,
          message: "Arquivo não enviado"
        });
      }

      const { 
        workerId, 
        documentType, 
        description, 
        category, 
        expiresAt 
      } = req.body;
      
      const { originalname, filename, mimetype, size, buffer } = req.uploadedFile;

      // Instanciar o serviço
      const createDocumentService = new CreateDocumentService();

      // Executar o serviço
     const document = await createDocumentService.execute({
        workerId,
        documentType: documentType as DocumentType,
        filename,
        originalName: originalname,
        mimetype,
        size,
        content: buffer,
        description: description || undefined,
        category: category || undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      return res.status(201).json({
        success: true,
        message: "Documento criado com sucesso",
        document
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao criar documento"
      });
    }
  }
}

export { ListDocumentsService, CreateDocumentController };