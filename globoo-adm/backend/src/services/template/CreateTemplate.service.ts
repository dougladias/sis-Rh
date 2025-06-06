import prismaClient from "../../prisma";
import { DocumentType } from "@prisma/client";

interface CreateTemplateRequest {
  name: string;
  type: DocumentType;
  category: string;
  description: string;
  version: string;
  createdBy: string;
  format: string;
  fileData: Buffer;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

class CreateTemplateService {
  async execute({
    name,
    type,
    category,
    description,
    version,
    createdBy,
    format,
    fileData,
    fileName,
    fileSize,
    mimeType
  }: CreateTemplateRequest) {
    // Validações básicas
    if (!name) {
      throw new Error("Nome do template é obrigatório");
    }

    if (!description) {
      throw new Error("Descrição do template é obrigatória");
    }

    if (!createdBy) {
      throw new Error("O ID do criador é obrigatório");
    }

    if (!fileData || !fileName || !mimeType) {
      throw new Error("Arquivo do template é obrigatório");
    }

    // Verificar se o usuário existe
    const userExists = await prismaClient.user.findUnique({
      where: { id: createdBy }
    });

    if (!userExists) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se já existe um template com o mesmo nome
    const templateExists = await prismaClient.template.findFirst({
      where: { name }
    });

    if (templateExists) {
      throw new Error("Já existe um template com este nome");
    }

    // Criar o template
    const template = await prismaClient.template.create({
      data: {
        name,
        type,
        category,
        description,
        version,
        createdBy,
        format,
        fileData,
        fileName,
        fileSize,
        mimeType,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Retornar o template sem o conteúdo binário
    const { fileData: _, ...templateWithoutFileData } = template;
    return templateWithoutFileData;
  }
}

export { CreateTemplateService };