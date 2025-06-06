import prismaClient from "../../prisma";

class DeleteTimeSheetService {
  async execute(id: string) {
    // Verificar se o log existe
    const TimeSheetExists = await prismaClient.log.findUnique({
      where: { id }
    });

    if (!TimeSheetExists) {
      throw new Error("Registro de ponto não encontrado");
    }

    // Excluir o log
    await prismaClient.log.delete({
      where: { id }
    });

    return { success: true };
  }
}

export { DeleteTimeSheetService };