import { Request, Response } from "express";
import { AddProviderPhotoService } from "../../services/provider/AddProviderPhoto.service";

class AddProviderPhotoController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar se há um arquivo enviado
      if (!req.uploadedFile) {
        return res.status(400).json({
          success: false,
          message: "Foto não enviada"
        });
      }
      
      const { originalname, filename, mimetype, size, buffer } = req.uploadedFile;

      // Instanciar o serviço
      const addProviderPhotoService = new AddProviderPhotoService();

      // Executar o serviço
      const photo = await addProviderPhotoService.execute({
        providerId: id,
        filename,
        originalName: originalname,
        mimetype,
        size,
        content: buffer
      });

      return res.status(201).json({
        success: true,
        message: "Foto adicionada com sucesso",
        photo
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao adicionar foto"
      });
    }
  }
}

export { AddProviderPhotoController };