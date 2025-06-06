import { Request, Response } from "express";
import { ListDocumentService } from "../../services/document/ListDocument.service";
import { DocumentType } from "@prisma/client";

class ListDocumentController {
  async handle(req: Request, res: Response) {
    try {
      const { 
        workerId, 
        documentType, 
        category, 
        isActive, 
        page, 
        limit 
      } = req.query;

      // Instanciar o serviço
      const listDocumentService = new ListDocumentService();

      // Executar o serviço
      const result = await listDocumentService.execute({
        workerId: workerId as string,
        documentType: documentType as DocumentType,
        category: category as string,
        isActive: isActive ? isActive === 'true' : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      });

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao listar documentos"
      });
    }
  }
}

export { ListDocumentController };