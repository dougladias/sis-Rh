import prismaClient from "../../prisma";

class GetWorkerService {
  async execute(id: string) {
    // Verificar se o funcionário existe
    const worker = await prismaClient.worker.findUnique({
      where: { id }
    });

    if (!worker) {
      throw new Error("Funcionário não encontrado");
    }

    return worker;
  }
}

export { GetWorkerService };