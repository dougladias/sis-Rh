import prismaClient from "../../prisma";

interface DeleteInvoiceAttachmentRequest {
  invoiceId: string;
  attachmentId: string;
}

class DeleteInvoiceAttachmentService {
  async execute({ invoiceId, attachmentId }: DeleteInvoiceAttachmentRequest) {
    if (!invoiceId || !attachmentId) {
      throw new Error("ID da fatura e do anexo são obrigatórios");
    }

    // Verificar se o anexo existe e pertence à fatura
    const attachment = await prismaClient.invoiceAttachment.findFirst({
      where: {
        id: attachmentId,
        invoiceId
      }
    });

    if (!attachment) {
      throw new Error("Anexo não encontrado ou não pertence à fatura informada");
    }

    // Excluir o anexo
    await prismaClient.invoiceAttachment.delete({
      where: { id: attachmentId }
    });

    return true;
  }
}

export { DeleteInvoiceAttachmentService };