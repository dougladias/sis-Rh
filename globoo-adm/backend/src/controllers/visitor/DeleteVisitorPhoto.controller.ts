import { Request, Response } from "express";
import { DeleteVisitorPhotoService } from "../../services/visitor/DeleteVisitorPhoto.service";

class DeleteVisitorPhotoController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Instanciar o serviço
      const deleteVisitorPhotoService = new DeleteVisitorPhotoService();

      // Executar o serviço
      await deleteVisitorPhotoService.execute(id);

      return res.status(200).json({
        success: true,
        message: "Foto removida com sucesso"
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao remover foto"
      });
    }
  }
}

export { DeleteVisitorPhotoController };