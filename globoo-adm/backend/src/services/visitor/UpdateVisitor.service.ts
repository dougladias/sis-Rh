import prismaClient from "../../prisma";
import { DocumentType, Visitor, VisitorStatus } from "@prisma/client";

interface UpdateVisitorRequest {
  id: string;
  name?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  phone?: string;
  email?: string | null;
  company?: string | null;
  reason?: string;
  hostName?: string;
  hostDepartment?: string | null;
  scheduledEntry?: Date | null;
  scheduledExit?: Date | null;
  actualEntry?: Date | null;
  actualExit?: Date | null;
  status?: VisitorStatus;
  temperature?: number | null;
  notes?: string | null;
}

class UpdateVisitorService {
  async execute({
    id,
    name,
    documentType,
    documentNumber,
    phone,
    email,
    company,
    reason,
    hostName,
    hostDepartment,
    scheduledEntry,
    scheduledExit,
    actualEntry,
    actualExit,
    status,
    temperature,
    notes
  }: UpdateVisitorRequest): Promise<Visitor> {
    
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
    
    // Atualizar visitante
    const visitor = await prismaClient.visitor.update({
      where: { id },
      data: {
        name,
        documentType,
        documentNumber,
        phone,
        email,
        company,
        reason,
        hostName,
        hostDepartment,
        scheduledEntry,
        scheduledExit,
        actualEntry,
        actualExit,
        status,
        temperature,
        notes
      }
    });
    
    return visitor;
  }
}

export { UpdateVisitorService };