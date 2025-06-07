import { Request, Response } from "express";
import { GetProviderByIdService } from "../../services/provider/IdProvider.service";

class GetProviderByIdController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID do prestador não fornecido"
        });
      }

      const getProviderByIdService = new GetProviderByIdService();
      
      const provider = await getProviderByIdService.execute(id);

      return res.json({
        success: true,
        provider
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Erro ao buscar prestador"
      });
    }
  }
}

export { GetProviderByIdController };