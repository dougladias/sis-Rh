import { Request, Response } from "express";
import { UpdateTemplateService } from "../../services/template/UpdateTemplate.service";
import { DocumentType } from "@prisma/client";

class UpdateTemplateController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        name, 
        type, 
        category, 
        description, 
        version,
        format,
        isActive
      } = req.body;

      // Inicializar o serviço
      const updateTemplateService = new UpdateTemplateService();

      // Preparar dados para atualização
      const updateData: any = {
        id,
        name,
        type: type as DocumentType,
        category,
        description,
        version,
        format,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      };

      // Se um novo arquivo foi enviado via middleware uploadMiddleware
      if (req.uploadedFile) {
        const { originalname, filename, mimetype, size, buffer } = req.uploadedFile;
        updateData.fileData = buffer;
        updateData.fileName = originalname;
        updateData.fileSize = size;
        updateData.mimeType = mimetype;
      }

      // Executar o serviço
      const template = await updateTemplateService.execute(updateData);

      return res.status(200).json({
        success: true,
        message: "Template atualizado com sucesso",
        template
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao atualizar template"
      });
    }
  }
}

export { UpdateTemplateController };