import prismaClient from "../../prisma";
import { DocumentType, Provider, ProviderStatus } from "@prisma/client";

interface CreateProviderRequest {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email?: string;
  company?: string;
  serviceType?: string;
  reason: string;
  hostName: string;
  hostDepartment?: string;
  scheduledEntry?: Date;
  scheduledExit?: Date;
  status: ProviderStatus;
  contractNumber?: string;
  notes?: string;
}

class CreateProviderService {
  async execute({
    name,
    documentType,
    documentNumber,
    phone,
    email,
    company,
    serviceType,
    reason,
    hostName,
    hostDepartment,
    scheduledEntry,
    scheduledExit,
    status,
    contractNumber,
    notes
  }: CreateProviderRequest): Promise<Provider> {
    // Validações básicas
    if (!name || !documentNumber || !phone || !reason || !hostName) {
      throw new Error("Campos obrigatórios não preenchidos");
    }

    // Criar prestador
    const provider = await prismaClient.provider.create({
      data: {
        name,
        documentType,
        documentNumber,
        phone,
        email,
        company,
        serviceType,
        reason,
        hostName,
        hostDepartment,
        scheduledEntry,
        scheduledExit,
        status,
        contractNumber,
        notes
      }
    });

    return provider;
  }
}

export { CreateProviderService };