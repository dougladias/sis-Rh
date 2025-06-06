import { Request, Response } from "express";
import { DeleteInvoiceService } from "../../services/invoice/DeleteInvoice.service";

class DeleteInvoiceController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID da fatura é obrigatório"
        });
      }

      const deleteInvoiceService = new DeleteInvoiceService();
      await deleteInvoiceService.execute(id);

      return res.status(200).json({
        success: true,
        message: "Fatura excluída com sucesso"
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao excluir fatura"
      });
    }
  }
}

export { DeleteInvoiceController };