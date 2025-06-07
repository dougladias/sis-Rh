import { Request, Response } from "express";
import { DeleteProviderPhotoService } from "../../services/provider/DeleteProviderPhoto.service";

class DeleteProviderPhotoController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Instanciar o serviço
      const deleteProviderPhotoService = new DeleteProviderPhotoService();

      // Executar o serviço
      await deleteProviderPhotoService.execute(id);

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

export { DeleteProviderPhotoController };