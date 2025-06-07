import prismaClient from "../../prisma";
import { ProviderPhoto } from "@prisma/client";

class GetProviderPhotoService {
  async execute(providerId: string): Promise<ProviderPhoto | null> {
    if (!providerId) {
      throw new Error("ID do prestador é obrigatório");
    }
    
    // Verificar se o prestador existe
    const providerExists = await prismaClient.provider.findUnique({
      where: { id: providerId }
    });
    
    if (!providerExists) {
      throw new Error("Prestador não encontrado");
    }
    
    // Buscar a foto
    const photo = await prismaClient.providerPhoto.findUnique({
      where: { providerId }
    });
    
    return photo;
  }
}

export { GetProviderPhotoService };