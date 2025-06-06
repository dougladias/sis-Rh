import prismaClient from "../../prisma";
import { DocumentType } from "@prisma/client";

// Interface para definir os dados necessários para criar um documento
interface CreateDocumentRequest {
  workerId: string;
  documentType: DocumentType;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  content: Buffer;
  description?: string;
  category?: string;
  expiresAt?: Date;
}

class CreateDocumentService {
  async execute({
    workerId,
    documentType,
    filename,
    originalName,
    mimetype,
    size,
    content,
    description,
    category,
    expiresAt
  }: CreateDocumentRequest) {
    // Validações básicas
    if (!workerId) {
      throw new Error("ID do funcionário é obrigatório");
    }

    if (!documentType) {
      throw new Error("Tipo de documento é obrigatório");
    }

    if (!originalName || !filename || !mimetype) {
      throw new Error("Informações do arquivo são obrigatórias");
    }

    // Verificar se o funcionário existe
    const workerExists = await prismaClient.worker.findUnique({
      where: { id: workerId }
    });

    if (!workerExists) {
      throw new Error("Funcionário não encontrado");
    }

    // Criar o documento
    const document = await prismaClient.file.create({
      data: {
        workerId,
        documentType,
        filename,
        originalName,
        mimetype,
        size,
        content,
        description,
        category,
        expiresAt,
        isActive: true,
        uploadDate: new Date()
      }
    });

    // Retornar o documento sem o conteúdo binário
    const { content: _, ...documentWithoutContent } = document;
    return documentWithoutContent;
  }
}

export { CreateDocumentService };