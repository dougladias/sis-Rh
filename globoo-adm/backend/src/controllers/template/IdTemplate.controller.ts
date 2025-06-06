import { Request, Response } from "express";
import { GetTemplateByIdService } from "../../services/template/IdTemplate.service";

class GetTemplateByIdController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { includeFileData } = req.query;

      // Instanciar o serviço
      const getTemplateByIdService = new GetTemplateByIdService();

      // Executar o serviço
      const template = await getTemplateByIdService.execute({ 
        id, 
        includeFileData: includeFileData === 'true' 
      });

      return res.status(200).json({
        success: true,
        template
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao buscar template"
      });
    }
  }
}

export { GetTemplateByIdController };