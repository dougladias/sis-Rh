import { Request, Response } from "express";
import { AddInvoiceAttachmentService } from "../../services/invoice/AddInvoiceAttachment.service";

// Extend the Request interface to include the uploadedFile property
declare global {
  namespace Express {
    interface Request {
      uploadedFile?: {
        originalname: string;
        filename: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
      };
    }
  }
}

class AddInvoiceAttachmentController {
  async handle(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;

      // Verificar se há um arquivo enviado
      if (!req.uploadedFile) {
        return res.status(400).json({
          success: false,
          message: "Arquivo não enviado"
        });
      }
      
      const { originalname, filename, mimetype, size, buffer } = req.uploadedFile;

      // Instanciar o serviço
      const addInvoiceAttachmentService = new AddInvoiceAttachmentService();

      // Executar o serviço
      const attachment = await addInvoiceAttachmentService.execute({
        invoiceId,
        filename,
        originalName: originalname,
        mimetype,
        size,
        content: buffer
      });

      return res.status(201).json({
        success: true,
        message: "Anexo adicionado com sucesso",
        attachment
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao adicionar anexo"
      });
    }
  }
}

export { AddInvoiceAttachmentController };