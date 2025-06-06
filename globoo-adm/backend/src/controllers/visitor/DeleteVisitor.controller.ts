import { Request, Response } from "express";
import { DeleteVisitorService } from "../../services/visitor/DeleteVisitor.service";

class DeleteVisitorController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID do visitante não fornecido"
        });
      }

      const deleteVisitorService = new DeleteVisitorService();
      
      await deleteVisitorService.execute(id);

      return res.status(200).json({
        success: true,
        message: "Visitante excluído com sucesso"
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Erro ao excluir visitante"
      });
    }
  }
}

export { DeleteVisitorController };