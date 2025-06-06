import prismaClient from "../../prisma";

interface AddVisitorPhotoRequest {
  visitorId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  content: Buffer;
}

class AddVisitorPhotoService {
  async execute({
    visitorId,
    filename,
    originalName,
    mimetype,
    size,
    content
  }: AddVisitorPhotoRequest) {
    // Validações básicas
    if (!visitorId) {
      throw new Error("ID do visitante é obrigatório");
    }

    if (!originalName || !filename || !mimetype || !content) {
      throw new Error("Informações da foto são obrigatórias");
    }

    // Verificar se o visitante existe
    const visitorExists = await prismaClient.visitor.findUnique({
      where: { id: visitorId }
    });

    if (!visitorExists) {
      throw new Error("Visitante não encontrado");
    }

    // Verificar se já existe uma foto para este visitante
    const existingPhoto = await prismaClient.visitorPhoto.findUnique({
      where: { visitorId }
    });

    // Se já existe uma foto, atualizá-la
    if (existingPhoto) {
      const photo = await prismaClient.visitorPhoto.update({
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
    const photo = await prismaClient.visitorPhoto.create({
      data: {
        visitorId,
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

export { AddVisitorPhotoService };