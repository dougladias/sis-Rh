import { Request, Response } from "express";
import { CreateTemplateService } from "../../services/template/CreateTemplate.service";
import { DocumentType } from "@prisma/client";

class CreateTemplateController {
  async handle(req: Request, res: Response) {
    try {
      // Verificar se há um arquivo enviado
      if (!req.uploadedFile) {
        return res.status(400).json({
          success: false,
          message: "Arquivo do template não enviado"
        });
      }

      const { 
        name, 
        type, 
        category, 
        description, 
        version = "1.0",
        format 
      } = req.body;

      // O ID do usuário geralmente vem do token de autenticação
      const createdBy = req.user_id;

      if (!createdBy) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado"
        });
      }
      
      const { originalname, filename, mimetype, size, buffer } = req.uploadedFile;

      // Instanciar o serviço
      const createTemplateService = new CreateTemplateService();

      // Executar o serviço
      const template = await createTemplateService.execute({
        name,
        type: type as DocumentType,
        category: category || "GENERAL",
        description,
        version,
        createdBy,
        format: format || mimetype.split('/')[1],
        fileData: buffer,
        fileName: originalname,
        fileSize: size,
        mimeType: mimetype
      });

      return res.status(201).json({
        success: true,
        message: "Template criado com sucesso",
        template
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao criar template"
      });
    }
  }
}

export { CreateTemplateController };