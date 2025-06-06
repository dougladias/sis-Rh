import prismaClient from "../../prisma";

interface GetTemplateByIdRequest {
  id: string;
  includeFileData?: boolean;
}

class GetTemplateByIdService {
  async execute({ id, includeFileData = false }: GetTemplateByIdRequest) {
    if (!id) {
      throw new Error("ID do template é obrigatório");
    }

    // Definir campos a serem retornados
    const selectFields: any = {
      id: true,
      name: true,
      type: true,
      category: true,
      description: true,
      version: true,
      createdBy: true,
      format: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      creator: {
        select: {
          name: true,
          email: true,
          role: true
        }
      }
    };

    // Incluir conteúdo apenas se solicitado explicitamente
    if (includeFileData) {
      selectFields.fileData = true;
    }

    const template = await prismaClient.template.findUnique({
      where: { id },
      select: selectFields
    });

    if (!template) {
      throw new Error("Template não encontrado");
    }

    return template;
  }
}

export { GetTemplateByIdService };