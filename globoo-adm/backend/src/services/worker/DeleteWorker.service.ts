import prismaClient from "../../prisma";

class DeleteWorkerService {
  async execute(id: string) {
    // Verificar se o funcionário existe
    const workerExists = await prismaClient.worker.findUnique({
      where: { id }
    });

    if (!workerExists) {
      throw new Error("Funcionário não encontrado");
    }

    try {
      // Excluir o funcionário do banco de dados
      await prismaClient.worker.delete({
        where: { id }
      });

      return { success: true };
    } catch (error) {
      // Verificar se é um erro de restrição de integridade referencial
      throw new Error(`Erro ao excluir funcionário: ${(error as Error).message}`);
    }
  }
}

export { DeleteWorkerService };