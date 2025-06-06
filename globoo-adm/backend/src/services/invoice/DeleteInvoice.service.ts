import prismaClient from "../../prisma";

class DeleteInvoiceService {
  async execute(id: string) {
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

    // Excluir a fatura e seus anexos (em cascata conforme definido no schema)
    await prismaClient.invoice.delete({
      where: { id }
    });

    return true;
  }
}

export { DeleteInvoiceService };