import { Request, Response } from "express";
import { InvoiceStatus } from "@prisma/client";
import { CreateInvoiceService } from "../../services/invoice/CreateInvoice.service";

class CreateInvoiceController {
  async handle(req: Request, res: Response) {
    try {
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

      // Validar os campos obrigatórios
      if (!number || !issueDate || !value || !description || !issuerName || !recipientName) {
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios não preenchidos"
        });
      }

      // Instanciar o serviço
      const createInvoiceService = new CreateInvoiceService();

      // Executar o serviço
      const invoice = await createInvoiceService.execute({
        number,
        issueDate: new Date(issueDate),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        value: Number(value),
        description,
        status: status as InvoiceStatus,
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

      return res.status(201).json({
        success: true,
        message: "Fatura criada com sucesso",
        invoice
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao criar fatura"
      });
    }
  }
}

export { CreateInvoiceController };