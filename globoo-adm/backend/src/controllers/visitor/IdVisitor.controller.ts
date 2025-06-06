import { Request, Response } from "express";
import { GetVisitorByIdService } from "../../services/visitor/GetVisitorById.service";

class GetVisitorByIdController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID do visitante não fornecido"
        });
      }

      const getVisitorByIdService = new GetVisitorByIdService();
      
      const visitor = await getVisitorByIdService.execute(id);

      return res.json({
        success: true,
        visitor
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Erro ao buscar visitante"
      });
    }
  }
}

export { GetVisitorByIdController };