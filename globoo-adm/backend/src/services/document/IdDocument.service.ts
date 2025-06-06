import prismaClient from "../../prisma";

interface GetDocumentRequest {
  id: string;
  includeContent?: boolean;
}

class GetDocumentByIdService {
  async execute({ id, includeContent = false }: GetDocumentRequest) {
    if (!id) {
      throw new Error("ID do documento é obrigatório");
    }

    // Definir campos a serem retornados
    const selectFields: any = {
      id: true,
      workerId: true,
      documentType: true,
      filename: true,
      originalName: true,
      mimetype: true,
      size: true,
      description: true,
      category: true,
      expiresAt: true,
      isActive: true,
      uploadDate: true,
      worker: {
        select: {
          name: true,
          employeeCode: true,
          department: true
        }
      }
    };

    // Incluir conteúdo apenas se solicitado explicitamente
    if (includeContent) {
      selectFields.content = true;
    }

    const document = await prismaClient.file.findUnique({
      where: { id },
      select: selectFields
    });

    if (!document) {
      throw new Error("Documento não encontrado");
    }

    return document;
  }
}

export { GetDocumentByIdService };