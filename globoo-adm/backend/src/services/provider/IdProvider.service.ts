import prismaClient from "../../prisma";
import { Provider } from "@prisma/client";

class GetProviderByIdService {
  async execute(id: string): Promise<Provider> {
    if (!id) {
      throw { statusCode: 400, message: "ID do prestador não fornecido" };
    }
    
    const provider = await prismaClient.provider.findUnique({
      where: { id },
      include: {
        photo: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimetype: true,
            size: true,
            uploadDate: true
          }
        }
      }
    });
    
    if (!provider) {
      throw { statusCode: 404, message: "Prestador não encontrado" };
    }
    
    return provider;
  }
}

export { GetProviderByIdService };