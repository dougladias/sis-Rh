import { Request, Response } from "express";
import { CreateTimeSheetService } from "../../services/TimeSheet/CreateTimeSheet.service";

class CreateTimeSheetController {
    async handle(req: Request, res: Response) {
        try {
            const {
                workerId,
                date,
                entryTime,
                leaveTime,
                hoursWorked,
                isAbsent,
                absenceType,
                notes
            } = req.body;

            // Validar os campos obrigatórios
            if (!workerId || !date) {
                return res.status(400).json({
                    success: false,
                    message: "ID do funcionário e data são obrigatórios"
                });
            }

            // Validar regras de negócio
            if (isAbsent && (entryTime || leaveTime)) {
                return res.status(400).json({
                    success: false,
                    message: "Um funcionário ausente não pode ter registro de entrada ou saída"
                });
            }

            // Instanciar o serviço
            const createLogService = new CreateTimeSheetService();

            // Executar o serviço
            const log = await createLogService.execute({
                workerId,
                date: new Date(date),
                entryTime: entryTime ? new Date(entryTime) : null,
                leaveTime: leaveTime ? new Date(leaveTime) : null,
                hoursWorked: hoursWorked ? Number(hoursWorked) : null,
                isAbsent: isAbsent || false,
                absenceType,
                notes
            });

            return res.status(201).json({
                success: true,
                message: "Registro de ponto criado com sucesso",
                log
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { CreateTimeSheetController };