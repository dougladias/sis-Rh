import prismaClient from "../../prisma";

class DeleteVisitorPhotoService {
  async execute(visitorId: string) {
    if (!visitorId) {
      throw new Error("ID do visitante é obrigatório");
    }

    // Verificar se a foto existe
    const photoExists = await prismaClient.visitorPhoto.findUnique({
      where: { visitorId }
    });

    if (!photoExists) {
      throw new Error("Foto não encontrada");
    }

    // Excluir a foto
    await prismaClient.visitorPhoto.delete({
      where: { visitorId }
    });

    return true;
  }
}

export { DeleteVisitorPhotoService };