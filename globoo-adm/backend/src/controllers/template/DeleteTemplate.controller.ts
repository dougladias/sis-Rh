import { Request, Response } from "express";
import { DeleteTemplateService } from "../../services/template/DeleteTemplate.service";

class DeleteTemplateController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Instanciar o serviço
      const deleteTemplateService = new DeleteTemplateService();

      // Executar o serviço
      await deleteTemplateService.execute(id);

      return res.status(200).json({
        success: true,
        message: "Template excluído com sucesso"
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao excluir template"
      });
    }
  }
}

export { DeleteTemplateController };