import { Request, Response } from "express";
import { InvoiceStatus } from "@prisma/client";
import { UpdateInvoiceService } from "../../services/invoice/UpdateInvoice.service";

class UpdateInvoiceController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        number,
        issueDate,
        dueDate,
        value,
        description,
        status,
        issuerName,
        issuerDocument,
        issuerEmail,
        recipientName,
        recipientDocument,
        recipientEmail,
        paymentDate,
        paymentMethod,
        notes
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID da fatura é obrigatório"
        });
      }

      const updateInvoiceService = new UpdateInvoiceService();
      const updatedInvoice = await updateInvoiceService.execute({
        id,
        number,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        value: value ? Number(value) : undefined,
        description,
        status: status as InvoiceStatus | undefined,
        issuerName,
        issuerDocument,
        issuerEmail,
        recipientName,
        recipientDocument,
        recipientEmail,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        paymentMethod,
        notes
      });

      return res.status(200).json({
        success: true,
        message: "Fatura atualizada com sucesso",
        invoice: updatedInvoice
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao atualizar fatura"
      });
    }
  }
}

export { UpdateInvoiceController };