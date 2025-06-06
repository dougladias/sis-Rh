import prismaClient from "../../prisma";
import { DocumentType } from "@prisma/client";
import { Request, Response } from "express";
import { GetDocumentByIdService } from "../../services/document/IdDocument.service";

interface UpdateDocumentRequest {
  id: string;
  documentType?: DocumentType;
  description?: string;
  category?: string;
  expiresAt?: Date | null;
  isActive?: boolean;
}

class UpdateDocumentService {
  async execute({
    id,
    documentType,
    description,
    category,
    expiresAt,
    isActive
  }: UpdateDocumentRequest) {
    if (!id) {
      throw new Error("ID do documento é obrigatório");
    }

    // Verificar se o documento existe
    const documentExists = await prismaClient.file.findUnique({
      where: { id }
    });

    if (!documentExists) {
      throw new Error("Documento não encontrado");
    }

    // Criar objeto de atualização com campos não nulos
    const updateData: any = {};

    if (documentType !== undefined) updateData.documentType = documentType;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Atualizar o documento
    const updatedDocument = await prismaClient.file.update({
      where: { id },
      data: updateData,
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
            employeeCode: true
          }
        }
      }
    });

    return updatedDocument;
  }
}

class GetDocumentByIdController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { includeContent } = req.query;

      // Instanciar o serviço
      const getDocumentByIdService = new GetDocumentByIdService();

      // Executar o serviço
      const document = await getDocumentByIdService.execute({ 
        id, 
        includeContent: includeContent === 'true' 
      });

      return res.status(200).json({
        success: true,
        document
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao buscar documento"
      });
    }
  }
}

export { UpdateDocumentService, GetDocumentByIdController };