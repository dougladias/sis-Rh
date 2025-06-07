import prismaClient from "../../prisma";

interface AddProviderPhotoRequest {
  providerId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  content: Buffer;
}

class AddProviderPhotoService {
  async execute({
    providerId,
    filename,
    originalName,
    mimetype,
    size,
    content
  }: AddProviderPhotoRequest) {
    // Validações básicas
    if (!providerId) {
      throw new Error("ID do prestador é obrigatório");
    }

    if (!originalName || !filename || !mimetype || !content) {
      throw new Error("Informações da foto são obrigatórias");
    }

    // Verificar se o prestador existe
    const providerExists = await prismaClient.provider.findUnique({
      where: { id: providerId }
    });

    if (!providerExists) {
      throw new Error("Prestador não encontrado");
    }

    // Verificar se já existe uma foto para este prestador
    const existingPhoto = await prismaClient.providerPhoto.findUnique({
      where: { providerId }
    });

    // Se já existe uma foto, atualizá-la
    if (existingPhoto) {
      const photo = await prismaClient.providerPhoto.update({
        where: { id: existingPhoto.id },
        data: {
          filename,
          originalName,
          mimetype,
          size,
          content,
          uploadDate: new Date()
        }
      });

      // Retornar a foto sem o conteúdo binário
      const { content: _, ...photoWithoutContent } = photo;
      return photoWithoutContent;
    }

    // Se não existe, criar uma nova
    const photo = await prismaClient.providerPhoto.create({
      data: {
        providerId,
        filename,
        originalName,
        mimetype,
        size,
        content,
        uploadDate: new Date()
      }
    });

    // Retornar a foto sem o conteúdo binário
    const { content: _, ...photoWithoutContent } = photo;
    return photoWithoutContent;
  }
}

export { AddProviderPhotoService };