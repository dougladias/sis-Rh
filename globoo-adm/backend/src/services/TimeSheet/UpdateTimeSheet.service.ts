import prismaClient from "../../prisma";

interface UpdateTimeSheetRequest {
  id: string;
  date?: Date;
  entryTime?: Date | null;
  leaveTime?: Date | null;
  hoursWorked?: number | null;
  isAbsent?: boolean;
  absenceType?: string | null;
  notes?: string | null;
}

class UpdateTimeSheetService {
  async execute(data: UpdateTimeSheetRequest) {
    const { id } = data;

    // Verificar se o log existe
    const logExists = await prismaClient.log.findUnique({
      where: { id }
    });

    if (!logExists) {
      throw new Error("Registro de ponto não encontrado");
    }

    // Se a data estiver sendo alterada, verificar se já não existe outro log para o mesmo funcionário na nova data
    if (data.date && data.date.toString() !== logExists.date.toString()) {
      const existingLog = await prismaClient.log.findFirst({
        where: {
          workerId: logExists.workerId,
          date: new Date(data.date),
          id: { not: id }
        }
      });

      if (existingLog) {
        throw new Error("Já existe um registro para este funcionário nesta data");
      }
    }

    // Calcular horas trabalhadas automaticamente se entryTime e leaveTime forem fornecidos
    let hoursWorked = data.hoursWorked;
    
    if (
      (data.entryTime !== undefined || logExists.entryTime) && 
      (data.leaveTime !== undefined || logExists.leaveTime)
    ) {
      const entryTime = data.entryTime !== undefined && data.entryTime !== null ? 
                        new Date(data.entryTime) : 
                        logExists.entryTime;
      
      const leaveTime = data.leaveTime !== undefined && data.leaveTime !== null ? 
                        new Date(data.leaveTime) : 
                        logExists.leaveTime;
      
      if (entryTime && leaveTime) {
        // Calcula a diferença em milissegundos e converte para horas
        const diffInMs = leaveTime.getTime() - entryTime.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);
        
        // Arredonda para 2 casas decimais
        hoursWorked = Math.round(diffInHours * 100) / 100;
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (data.date) updateData.date = new Date(data.date);
    if (data.entryTime !== undefined) updateData.entryTime = data.entryTime ? new Date(data.entryTime) : null;
    if (data.leaveTime !== undefined) updateData.leaveTime = data.leaveTime ? new Date(data.leaveTime) : null;
    if (hoursWorked !== undefined) updateData.hoursWorked = hoursWorked;
    if (data.isAbsent !== undefined) updateData.isAbsent = data.isAbsent;
    if (data.absenceType !== undefined) updateData.absenceType = data.absenceType;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    // Atualizar o log no banco
    const updatedTimeSheet = await prismaClient.log.update({
      where: { id },
      data: updateData,
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: true
          }
        }
      }
    });

    return updatedTimeSheet;
  }
}

export { UpdateTimeSheetService };