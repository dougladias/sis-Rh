import { Request, Response } from "express";
import { CreateDocumentService } from "../../services/document/CreateDocument.service";
import { DeleteDocumentService } from "../../services/document/DeleteDocument.service";
import { DocumentType } from "@prisma/client";

class CreateDocumentController {
  async handle(request: Request, response: Response) {
    try {
      // Verificar se há um arquivo enviado
      if (!request.file) {
        return response.status(400).json({ error: "Arquivo não enviado" });
      }

      const { 
        workerId, 
        documentType, 
        description, 
        category, 
        expiresAt 
      } = request.body;
      
      const { originalname, filename, mimetype, size, buffer } = request.file;

      const createDocumentService = new CreateDocumentService();

      const document = await createDocumentService.execute({
        workerId,
        documentType: documentType as DocumentType,
        filename,
        originalName: originalname,
        mimetype,
        size,
        content: buffer,
        description,
        category,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      return response.json(document);
    } catch (err) {
      console.error(err);
      return response.status(400).json({ error: (err as Error).message || "Erro ao criar documento" });
    }
  }
}

class DeleteDocumentController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Instanciar o serviço
      const deleteDocumentService = new DeleteDocumentService();

      // Executar o serviço
      await deleteDocumentService.execute(id);

      return res.status(200).json({
        success: true,
        message: "Documento excluído com sucesso"
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao excluir documento"
      });
    }
  }
}

export { CreateDocumentController, DeleteDocumentController };