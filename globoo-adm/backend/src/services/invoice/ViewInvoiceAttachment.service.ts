import prismaClient from "../../prisma";

interface ViewInvoiceAttachmentRequest {
  invoiceId: string;
  attachmentId: string;
}

class ViewInvoiceAttachmentService {
  async execute({ invoiceId, attachmentId }: ViewInvoiceAttachmentRequest) {
    if (!invoiceId || !attachmentId) {
      throw new Error("ID da fatura e do anexo são obrigatórios");
    }

    // Buscar o anexo específico relacionado à fatura
    const attachment = await prismaClient.invoiceAttachment.findFirst({
      where: {
        id: attachmentId,
        invoiceId
      }
    });

    if (!attachment) {
      throw new Error("Anexo não encontrado");
    }

    // Retorna os dados do anexo incluindo o conteúdo para exibição/download
    return {
      id: attachment.id,
      filename: attachment.filename,
      originalName: attachment.originalName,
      mimetype: attachment.mimetype,
      size: attachment.size,
      content: attachment.content,
      uploadDate: attachment.uploadDate
    };
  }
}

export { ViewInvoiceAttachmentService };