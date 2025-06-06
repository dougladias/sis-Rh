import prismaClient from "../../prisma";
import { InvoiceStatus } from "@prisma/client";

interface CreateInvoiceRequest {
  number: string;
  issueDate: Date;
  dueDate?: Date;
  value: number;
  description: string;
  status?: InvoiceStatus;
  issuerName: string;
  issuerDocument?: string;
  issuerEmail?: string;
  recipientName: string;
  recipientDocument?: string;
  recipientEmail?: string;
  paymentDate?: Date;
  paymentMethod?: string;
  notes?: string;
}

class CreateInvoiceService {
  async execute({
    number,
    issueDate,
    dueDate,
    value,
    description,
    status = InvoiceStatus.PENDING,
    issuerName,
    issuerDocument,
    issuerEmail,
    recipientName,
    recipientDocument,
    recipientEmail,
    paymentDate,
    paymentMethod,
    notes
  }: CreateInvoiceRequest) {
    
    // Validações básicas
    if (!number) {
      throw new Error("Número da fatura é obrigatório");
    }

    if (!issueDate) {
      throw new Error("Data de emissão é obrigatória");
    }

    if (!value || value <= 0) {
      throw new Error("Valor da fatura deve ser maior que zero");
    }

    if (!description) {
      throw new Error("Descrição da fatura é obrigatória");
    }

    if (!issuerName) {
      throw new Error("Nome do emissor é obrigatório");
    }

    if (!recipientName) {
      throw new Error("Nome do destinatário é obrigatório");
    }

    // Verificar se já existe uma fatura com este número
    const invoiceExists = await prismaClient.invoice.findUnique({
      where: { number }
    });

    if (invoiceExists) {
      throw new Error("Já existe uma fatura com este número");
    }

    // Criar a fatura
    const invoice = await prismaClient.invoice.create({
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

    return invoice;
  }
}

export { CreateInvoiceService };