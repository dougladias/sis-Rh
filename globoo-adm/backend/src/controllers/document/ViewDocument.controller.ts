import { Request, Response } from "express";
import { GetDocumentByIdService } from "../../services/document/IdDocument.service";

class ViewDocumentController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Instanciar o serviço
      const getDocumentByIdService = new GetDocumentByIdService();

      // Executar o serviço
      const document = await getDocumentByIdService.execute({ 
        id, 
        includeContent: true 
      });
    

      // Verificar se o conteúdo existe
      if (!document.content) {
        return res.status(404).json({
          success: false,
          message: "Conteúdo do documento não encontrado"
        });
      }

      // Configurar cabeçalhos para visualização inline
      res.setHeader('Content-Type', document.mimetype);
      res.setHeader('Content-Disposition', `inline; filename=${document.originalName}`);
      
      // Garantir que o conteúdo é um Buffer ou convertê-lo se for string base64
      let contentBuffer;
      if (Buffer.isBuffer(document.content)) {
        contentBuffer = document.content;
      } else if (typeof document.content === 'string') {
        contentBuffer = Buffer.from(document.content, 'base64');
      } else if (document.content && typeof document.content === 'object') {        
        contentBuffer = Buffer.from(document.content as ArrayBuffer);
      } else {
        return res.status(500).json({
          success: false,
          message: "Formato de conteúdo não suportado"
        });
      }
      
      // Enviar o conteúdo do arquivo
      return res.send(contentBuffer);
    } catch (error) {
      console.error('Erro ao visualizar documento:', error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao visualizar documento"
      });
    }
  }
}

export { ViewDocumentController };