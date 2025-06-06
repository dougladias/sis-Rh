import prismaClient from "../../prisma";

class GetTimeSheetService {
  async execute(id: string) {
    // Verificar se o TimeSheet existe
    const TimeSheet= await prismaClient.log.findUnique({
      where: { id },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: true,
            position: true
          }
        }
      }
    });

    if (!TimeSheet) {
      throw new Error("Registro de ponto não encontrado");
    }

    return TimeSheet;
  }
}

export { GetTimeSheetService };