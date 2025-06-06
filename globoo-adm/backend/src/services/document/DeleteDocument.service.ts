import prismaClient from "../../prisma";

class DeleteDocumentService {
  async execute(id: string) {
    if (!id) {
      throw new Error("ID do documento é obrigatório");
    }

    // Verificar se o documento existe
    const documentExists = await prismaClient.file.findUnique({
      where: { id }
    });

    if (!documentExists) {
      throw new Error("Documento não encontrado");
    }

    // Excluir o documento
    await prismaClient.file.delete({
      where: { id }
    });

    return true;
  }
}

export { DeleteDocumentService };