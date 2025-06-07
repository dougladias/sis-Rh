import prismaClient from "../../prisma";

class DeleteProviderPhotoService {
  async execute(providerId: string) {
    if (!providerId) {
      throw new Error("ID do prestador é obrigatório");
    }

    // Verificar se a foto existe
    const photoExists = await prismaClient.providerPhoto.findUnique({
      where: { providerId }
    });

    if (!photoExists) {
      throw new Error("Foto não encontrada");
    }

    // Excluir a foto
    await prismaClient.providerPhoto.delete({
      where: { providerId }
    });

    return true;
  }
}

export { DeleteProviderPhotoService };