import { Request, Response } from "express";
import { ViewInvoiceAttachmentService } from "../../services/invoice/ViewInvoiceAttachment.service";

class ViewInvoiceAttachmentController {
  async handle(req: Request, res: Response) {
    try {
      const { invoiceId, attachmentId } = req.params;

      if (!invoiceId || !attachmentId) {
        return res.status(400).json({
          success: false,
          message: "ID da fatura e do anexo são obrigatórios"
        });
      }

      console.log(`Visualizando anexo - Invoice ID: ${invoiceId}, Attachment ID: ${attachmentId}`);

      const viewInvoiceAttachmentService = new ViewInvoiceAttachmentService();
      const attachment = await viewInvoiceAttachmentService.execute({
        invoiceId,
        attachmentId
      });

      // Configurar headers para visualização inline
      res.setHeader('Content-Type', attachment.mimetype);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.originalName)}"`);
      
      // Garantir que o conteúdo seja um Buffer
      let contentBuffer;
      if (Buffer.isBuffer(attachment.content)) {
        contentBuffer = attachment.content;
      } else if (typeof attachment.content === 'string') {
        contentBuffer = Buffer.from(attachment.content, 'base64');
      } else if (attachment.content && typeof attachment.content === 'object') {
        contentBuffer = Buffer.from(attachment.content as ArrayBuffer);
      } else {
        return res.status(500).json({
          success: false,
          message: "Formato de conteúdo não suportado"
        });
      }
      
      // Enviar o conteúdo do arquivo
      return res.send(contentBuffer);
    } catch (error) {
      console.error('Erro ao visualizar anexo:', error);
      return res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : "Anexo não encontrado"
      });
    }
  }
}

export { ViewInvoiceAttachmentController };