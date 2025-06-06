import prismaClient from "../../prisma";
import { Visitor } from "@prisma/client";

class GetVisitorByIdService {
  async execute(id: string): Promise<Visitor> {
    if (!id) {
      throw { statusCode: 400, message: "ID do visitante não fornecido" };
    }
    
    const visitor = await prismaClient.visitor.findUnique({
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
    
    if (!visitor) {
      throw { statusCode: 404, message: "Visitante não encontrado" };
    }
    
    return visitor;
  }
}

export { GetVisitorByIdService };