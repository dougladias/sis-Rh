import { Request, Response } from "express";
import { DeleteProviderService } from "../../services/provider/DeleteProvider.service";

class DeleteProviderController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID do prestador não fornecido"
        });
      }

      const deleteProviderService = new DeleteProviderService();
      
      await deleteProviderService.execute(id);

      return res.status(200).json({
        success: true,
        message: "Prestador excluído com sucesso"
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Erro ao excluir prestador"
      });
    }
  }
}

export { DeleteProviderController };