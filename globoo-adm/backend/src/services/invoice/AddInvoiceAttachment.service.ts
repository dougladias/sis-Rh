import prismaClient from "../../prisma";

interface AddInvoiceAttachmentRequest {
  invoiceId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  content: Buffer;
}

class AddInvoiceAttachmentService {
  async execute({
    invoiceId,
    filename,
    originalName,
    mimetype,
    size,
    content
  }: AddInvoiceAttachmentRequest) {
    // Validações básicas
    if (!invoiceId) {
      throw new Error("ID da fatura é obrigatório");
    }

    if (!originalName || !filename || !mimetype || !content) {
      throw new Error("Informações do arquivo são obrigatórias");
    }

    // Verificar se a fatura existe
    const invoiceExists = await prismaClient.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoiceExists) {
      throw new Error("Fatura não encontrada");
    }

    // Criar o anexo
    const attachment = await prismaClient.invoiceAttachment.create({
      data: {
        invoiceId,
        filename,
        originalName,
        mimetype,
        size,
        content,
        uploadDate: new Date()
      }
    });

    // Retornar o anexo sem o conteúdo binário
    const { content: _, ...attachmentWithoutContent } = attachment;
    return attachmentWithoutContent;
  }
}

export { AddInvoiceAttachmentService };