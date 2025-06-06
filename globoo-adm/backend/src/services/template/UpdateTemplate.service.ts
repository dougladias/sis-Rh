import prismaClient from "../../prisma";

import { DocumentType } from "@prisma/client";

interface UpdateTemplateRequest {
  id: string;
  name?: string;
  type?: DocumentType;
  category?: string;
  description?: string;
  version?: string; 
  format?: string;
  fileData?: Buffer;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isActive?: boolean;
}

class UpdateTemplateService {
  async execute({
    id,
    name,
    type,
    category,
    description,
    version,
    format,
    fileData,
    fileName,
    fileSize,
    mimeType,
    isActive
  }: UpdateTemplateRequest) {
    if (!id) {
      throw new Error("ID do template é obrigatório");
    }

    // Verificar se o template existe
    const templateExists = await prismaClient.template.findUnique({
      where: { id }
    });

    if (!templateExists) {
      throw new Error("Template não encontrado");
    }

    // Verificar se o nome já existe em outro template (se estiver alterando o nome)
    if (name && name !== templateExists.name) {
      const nameExists = await prismaClient.template.findFirst({
        where: {
          name,
          id: { not: id }
        }
      });

      if (nameExists) {
        throw new Error("Já existe um template com este nome");
      }
    }

    // Criar objeto de atualização com campos não nulos
    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (version !== undefined) updateData.version = version;
    if (format !== undefined) updateData.format = format;
    if (fileData !== undefined) updateData.fileData = fileData;
    if (fileName !== undefined) updateData.fileName = fileName;
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (mimeType !== undefined) updateData.mimeType = mimeType;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Atualizar o template
    const updatedTemplate = await prismaClient.template.update({
      where: { id },
      data: updateData,
      select: {
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
            email: true
          }
        }
      }
    });

    return updatedTemplate;
  }
}

export { UpdateTemplateService };