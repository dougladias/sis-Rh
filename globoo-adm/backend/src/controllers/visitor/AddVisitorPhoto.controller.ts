import { Request, Response } from "express";
import { AddVisitorPhotoService } from "../../services/visitor/AddVisitorPhoto.service";

class AddVisitorPhotoController {
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
      const addVisitorPhotoService = new AddVisitorPhotoService();

      // Executar o serviço
      const photo = await addVisitorPhotoService.execute({
        visitorId: id,
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

export { AddVisitorPhotoController };