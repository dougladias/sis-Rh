import { Request, Response } from "express";
import { GetTemplateByIdService } from "../../services/template/IdTemplate.service";

class ViewTemplateController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Instanciar o serviço
      const getTemplateByIdService = new GetTemplateByIdService();

      // Executar o serviço com fileData incluído
      const template = await getTemplateByIdService.execute({ 
        id, 
        includeFileData: true 
      });

      // Verificar se o template tem dados de arquivo
      if (!template.fileData) {
        return res.status(404).json({
          success: false,
          message: "Arquivo não encontrado no template"
        });
      }
      // Configurar cabeçalhos para visualização inline
      res.setHeader('Content-Type', template.mimeType);
      res.setHeader('Content-Disposition', `inline; filename=${template.fileName}`);
      
      // Garantir que o conteúdo é um Buffer ou convertê-lo se necessário
      let contentBuffer;
      if (Buffer.isBuffer(template.fileData)) {
        contentBuffer = template.fileData;
      } else if (typeof template.fileData === 'string') {
        contentBuffer = Buffer.from(template.fileData, 'base64');
      } else if (template.fileData && typeof template.fileData === 'object') {        
        contentBuffer = Buffer.from(template.fileData as ArrayBuffer);
      } else {
        return res.status(500).json({
          success: false,
          message: "Formato de conteúdo não suportado"
        });
      }
      
      // Enviar o conteúdo do arquivo
      return res.send(contentBuffer);
    } catch (error) {
      console.error('Erro ao visualizar template:', error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao visualizar template"
      });
    }
  }
}

export { ViewTemplateController };