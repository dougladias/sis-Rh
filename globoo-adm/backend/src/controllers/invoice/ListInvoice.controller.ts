import { Request, Response } from "express";
import { InvoiceStatus } from "@prisma/client";
import { ListInvoiceService } from "../../services/invoice/ListInvoice.service";

class ListInvoiceController {
  async handle(req: Request, res: Response) {
    try {
      const {
        number,
        status,
        startDate,
        endDate,
        minValue,
        maxValue,
        issuerName,
        recipientName,
        page,
        limit
      } = req.query;

      // Instanciar o serviço
      const listInvoiceService = new ListInvoiceService();

      // Executar o serviço
      const result = await listInvoiceService.execute({
        number: number as string,
        status: status as InvoiceStatus,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        minValue: minValue ? Number(minValue) : undefined,
        maxValue: maxValue ? Number(maxValue) : undefined,
        issuerName: issuerName as string,
        recipientName: recipientName as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      });

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao listar faturas"
      });
    }
  }
}

export { ListInvoiceController };