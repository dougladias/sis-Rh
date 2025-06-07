import { Request, Response } from "express";
import { GetProviderPhotoService } from "../../services/provider/IdProviderPhoto.service";

class ViewProviderPhotoController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const getProviderPhotoService = new GetProviderPhotoService();
      const photo = await getProviderPhotoService.execute(id);

      if (!photo || !photo.content) {
        return res.status(404).json({
          success: false,
          message: "Foto não encontrada"
        });
      }

      // Configurar headers para exibição inline
      res.setHeader('Content-Type', photo.mimetype);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(photo.originalName)}"`);
      
      // Garantir que o conteúdo seja um Buffer
      let contentBuffer;
      if (Buffer.isBuffer(photo.content)) {
        contentBuffer = photo.content;
      } else if (typeof photo.content === 'string') {
        contentBuffer = Buffer.from(photo.content, 'base64');
      } else if (photo.content && typeof photo.content === 'object') {        
        contentBuffer = Buffer.from(photo.content as ArrayBuffer);
      } else {
        return res.status(500).json({
          success: false,
          message: "Formato de conteúdo não suportado"
        });
      }
      
      // Enviar o conteúdo da foto
      return res.send(contentBuffer);
    } catch (error) {
      console.error('Erro ao visualizar foto:', error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao visualizar foto"
      });
    }
  }
}

export { ViewProviderPhotoController };