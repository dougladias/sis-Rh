import { Request, Response } from "express";
import { DeleteInvoiceAttachmentService } from "../../services/invoice/DeleteInvoiceAttachment.service";

class DeleteInvoiceAttachmentController {
  async handle(req: Request, res: Response) {
    try {
      const { invoiceId, attachmentId } = req.params;

      if (!invoiceId || !attachmentId) {
        return res.status(400).json({
          success: false,
          message: "ID da fatura e do anexo são obrigatórios"
        });
      }

      const deleteInvoiceAttachmentService = new DeleteInvoiceAttachmentService();
      await deleteInvoiceAttachmentService.execute({
        invoiceId,
        attachmentId
      });

      return res.status(200).json({
        success: true,
        message: "Anexo excluído com sucesso"
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao excluir anexo"
      });
    }
  }
}

export { DeleteInvoiceAttachmentController };