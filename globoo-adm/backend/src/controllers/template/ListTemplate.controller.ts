import { Request, Response } from "express";
import { ListTemplateService } from "../../services/template/ListTemplate.service";
import { DocumentType } from "@prisma/client";

class ListTemplateController {
  async handle(req: Request, res: Response) {
    try {
      const { 
        type, 
        category, 
        name,
        isActive, 
        page, 
        limit 
      } = req.query;

      // Instanciar o serviço
      const listTemplateService = new ListTemplateService();

      // Executar o serviço
      const result = await listTemplateService.execute({
        type: type as DocumentType,
        category: category as string,
        name: name as string,
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
        message: error instanceof Error ? error.message : "Erro ao listar templates"
      });
    }
  }
}

export { ListTemplateController };