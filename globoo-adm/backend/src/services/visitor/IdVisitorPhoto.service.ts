import prismaClient from "../../prisma";
import { VisitorPhoto } from "@prisma/client";

class GetVisitorPhotoService {
  async execute(visitorId: string): Promise<VisitorPhoto | null> {
    if (!visitorId) {
      throw new Error("ID do visitante é obrigatório");
    }
    
    // Verificar se o visitante existe
    const visitorExists = await prismaClient.visitor.findUnique({
      where: { id: visitorId }
    });
    
    if (!visitorExists) {
      throw new Error("Visitante não encontrado");
    }
    
    // Buscar a foto
    const photo = await prismaClient.visitorPhoto.findUnique({
      where: { visitorId }
    });
    
    return photo;
  }
}

export { GetVisitorPhotoService };