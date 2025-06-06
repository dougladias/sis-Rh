import prismaClient from "../../prisma";
import { InvoiceStatus } from "@prisma/client";

interface UpdateInvoiceRequest {
  id: string;
  number?: string;
  issueDate?: Date;
  dueDate?: Date | null;
  value?: number;
  description?: string;
  status?: InvoiceStatus;
  issuerName?: string;
  issuerDocument?: string | null;
  issuerEmail?: string | null;
  recipientName?: string;
  recipientDocument?: string | null;
  recipientEmail?: string | null;
  paymentDate?: Date | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

class UpdateInvoiceService {
  async execute({
    id,
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
  }: UpdateInvoiceRequest) {
    // Validações básicas
    if (!id) {
      throw new Error("ID da fatura é obrigatório");
    }

    // Verificar se a fatura existe
    const invoiceExists = await prismaClient.invoice.findUnique({
      where: { id }
    });

    if (!invoiceExists) {
      throw new Error("Fatura não encontrada");
    }

    // Se estiver atualizando o número, verificar se já existe outro com esse número
    if (number && number !== invoiceExists.number) {
      const numberExists = await prismaClient.invoice.findUnique({
        where: { number }
      });

      if (numberExists) {
        throw new Error("Já existe uma fatura com este número");
      }
    }

    // Atualizar a fatura
    const updatedInvoice = await prismaClient.invoice.update({
      where: { id },
      data: {
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
      }
    });

    return updatedInvoice;
  }
}

export { UpdateInvoiceService };