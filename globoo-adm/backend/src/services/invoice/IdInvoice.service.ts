import prismaClient from "../../prisma";

class GetInvoiceByIdService {
  async execute(id: string) {
    if (!id) {
      throw new Error("ID da fatura é obrigatório");
    }

    const invoice = await prismaClient.invoice.findUnique({
      where: { id },
      include: {
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimetype: true,
            size: true,
            uploadDate: true
          }
        }
      }
    });

    if (!invoice) {
      throw new Error("Fatura não encontrada");
    }

    return invoice;
  }
}

export { GetInvoiceByIdService };