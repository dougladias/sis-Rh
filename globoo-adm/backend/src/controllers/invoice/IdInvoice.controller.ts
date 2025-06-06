import { Request, Response } from "express";
import { GetInvoiceByIdService } from "../../services/invoice/IdInvoice.service";

class GetInvoiceByIdController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID da fatura é obrigatório"
        });
      }

      const getInvoiceByIdService = new GetInvoiceByIdService();
      const invoice = await getInvoiceByIdService.execute(id);

      return res.status(200).json({
        success: true,
        invoice
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : "Fatura não encontrada"
      });
    }
  }
}

export { GetInvoiceByIdController };