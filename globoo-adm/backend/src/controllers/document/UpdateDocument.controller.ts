import { Request, Response } from "express";
import { UpdateDocumentService } from "../../services/document/UpdateDocument.service";
import { DocumentType } from "@prisma/client";

class UpdateDocumentController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        documentType, 
        description, 
        category, 
        expiresAt, 
        isActive 
      } = req.body;

      // Instanciar o serviço
      const updateDocumentService = new UpdateDocumentService();

      // Executar o serviço
      const document = await updateDocumentService.execute({
        id,
        documentType: documentType as DocumentType,
        description,
        category,
        expiresAt: expiresAt === undefined ? undefined : 
                  expiresAt ? new Date(expiresAt) : null,
        isActive
      });

      return res.status(200).json({
        success: true,
        message: "Documento atualizado com sucesso",
        document
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao atualizar documento"
      });
    }
  }
}

export { UpdateDocumentController };