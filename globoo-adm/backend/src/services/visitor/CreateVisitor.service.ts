import prismaClient from "../../prisma";
import { DocumentType, Visitor, VisitorStatus } from "@prisma/client";

interface CreateVisitorRequest {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email?: string;
  company?: string;
  reason: string;
  hostName: string;
  hostDepartment?: string;
  scheduledEntry?: Date;
  scheduledExit?: Date;
  status: VisitorStatus;
  notes?: string;
}

class CreateVisitorService {
  async execute({
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
    status,
    notes
  }: CreateVisitorRequest): Promise<Visitor> {
    // Validações básicas
    if (!name || !documentNumber || !phone || !reason || !hostName) {
      throw new Error("Campos obrigatórios não preenchidos");
    }

    // Criar visitante
    const visitor = await prismaClient.visitor.create({
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
        status,
        notes
      }
    });

    return visitor;
  }
}

export { CreateVisitorService };