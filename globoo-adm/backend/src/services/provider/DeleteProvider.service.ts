import prismaClient from "../../prisma";

class DeleteProviderService {
  async execute(id: string): Promise<void> {
    // Validação de ID
    if (!id) {
      throw { statusCode: 400, message: "ID do prestador não fornecido" };
    }
    
    // Verificar se o prestador existe
    const providerExists = await prismaClient.provider.findUnique({
      where: { id }
    });
    
    if (!providerExists) {
      throw { statusCode: 404, message: "Prestador não encontrado" };
    }
    
    // Excluir prestador (a foto será excluída automaticamente por causa da relação cascade)
    await prismaClient.provider.delete({
      where: { id }
    });
  }
}

export { DeleteProviderService };