import prismaClient from "../../prisma";

interface TimeSheetRequest {
  workerId: string;
  date: Date;
  entryTime?: Date | null;
  leaveTime?: Date | null;
  hoursWorked?: number | null;
  isAbsent?: boolean;
  absenceType?: string | null;
  notes?: string | null;
}

class CreateTimeSheetService {
  async execute(data: TimeSheetRequest) {
    const { workerId, date } = data;

    // Validações básicas
    if (!workerId || !date) {
      throw new Error("ID do funcionário e data são obrigatórios");
    }

    // Verificar se o funcionário existe
    const workerExists = await prismaClient.worker.findUnique({
      where: { id: workerId }
    });

    if (!workerExists) {
      throw new Error("Funcionário não encontrado");
    }

    // Verificar se já existe um registro para este funcionário nesta data
    const existingTimeSheet = await prismaClient.log.findUnique({
      where: {
        workerId_date: {
          workerId,
          date: new Date(date),
        }
      }
    });

    if (existingTimeSheet) {
      throw new Error("Já existe um registro para este funcionário nesta data");
    }

    // Calcular horas trabalhadas automaticamente se entryTime e leaveTime forem fornecidos
    let hoursWorked = data.hoursWorked;
    
    if (data.entryTime && data.leaveTime && !hoursWorked) {
      const entryTime = new Date(data.entryTime);
      const leaveTime = new Date(data.leaveTime);
      
      // Calcula a diferença em milissegundos e converte para horas
      const diffInMs = leaveTime.getTime() - entryTime.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      
      // Arredonda para 2 casas decimais
      hoursWorked = Math.round(diffInHours * 100) / 100;
    }

    // Criar o registro de ponto
    const TimeSheet = await prismaClient.log.create({
      data: {
        workerId,
        date: new Date(date),
        entryTime: data.entryTime ? new Date(data.entryTime) : null,
        leaveTime: data.leaveTime ? new Date(data.leaveTime) : null,
        hoursWorked: hoursWorked || null,
        isAbsent: data.isAbsent || false,
        absenceType: data.absenceType || null,
        notes: data.notes || null
      },
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

    return TimeSheet;
  }
}

export { CreateTimeSheetService };