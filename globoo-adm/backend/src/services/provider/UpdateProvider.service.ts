import prismaClient from "../../prisma";
import { DocumentType, Provider, ProviderStatus } from "@prisma/client";

interface UpdateProviderRequest {
  id: string;
  name?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  phone?: string;
  email?: string | null;
  company?: string | null;
  serviceType?: string | null;
  reason?: string;
  hostName?: string;
  hostDepartment?: string | null;
  scheduledEntry?: Date | null;
  scheduledExit?: Date | null;
  actualEntry?: Date | null;
  actualExit?: Date | null;
  status?: ProviderStatus;
  contractNumber?: string | null;
  notes?: string | null;
}

class UpdateProviderService {
  async execute({
    id,
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
    actualEntry,
    actualExit,
    status,
    contractNumber,
    notes
  }: UpdateProviderRequest): Promise<Provider> {
    
    // Validação de ID
    if (!id) {
      throw { statusCode: 400, message: "ID do prestador não fornecido" };
    }
    
    // Verificar se o prestador existe
    const providerExists = await prismaClient.provider.findUnique({
      where: { id }
    });
    
    if (!providerExists) {
      throw { statusCode: 404, message: "Prestador não encontrado" };
    }
    
    // Atualizar prestador
    const provider = await prismaClient.provider.update({
      where: { id },
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
        actualEntry,
        actualExit,
        status,
        contractNumber,
        notes
      }
    });
    
    return provider;
  }
}

export { UpdateProviderService };