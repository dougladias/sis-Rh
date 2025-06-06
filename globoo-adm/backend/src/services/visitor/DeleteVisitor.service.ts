import prismaClient from "../../prisma";

class DeleteVisitorService {
  async execute(id: string): Promise<void> {
    // Validação de ID
    if (!id) {
      throw { statusCode: 400, message: "ID do visitante não fornecido" };
    }
    
    // Verificar se o visitante existe
    const visitorExists = await prismaClient.visitor.findUnique({
      where: { id }
    });
    
    if (!visitorExists) {
      throw { statusCode: 404, message: "Visitante não encontrado" };
    }
    
    // Excluir visitante (a foto será excluída automaticamente por causa da relação cascade)
    await prismaClient.visitor.delete({
      where: { id }
    });
  }
}

export { DeleteVisitorService };