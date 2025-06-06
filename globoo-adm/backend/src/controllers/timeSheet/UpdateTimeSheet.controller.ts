import { Request, Response } from "express";
import { UpdateTimeSheetService } from "../../services/TimeSheet/UpdateTimeSheet.service";

class UpdateTimeSheetController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                date,
                entryTime,
                leaveTime,
                hoursWorked,
                isAbsent,
                absenceType,
                notes
            } = req.body;

            // Validar regras de negócio
            if (isAbsent && (entryTime || leaveTime)) {
                return res.status(400).json({
                    success: false,
                    message: "Um funcionário ausente não pode ter registro de entrada ou saída"
                });
            }

            // Instanciar o serviço
            const updateLogService = new UpdateTimeSheetService();

            // Executar o serviço
            const log = await updateLogService.execute({
                id,
                date: date ? new Date(date) : undefined,
                entryTime: entryTime === undefined ? undefined : entryTime ? new Date(entryTime) : null,
                leaveTime: leaveTime === undefined ? undefined : leaveTime ? new Date(leaveTime) : null,
                hoursWorked: hoursWorked === undefined ? undefined : hoursWorked ? Number(hoursWorked) : null,
                isAbsent,
                absenceType,
                notes
            });

            return res.status(200).json({
                success: true,
                message: "Registro de ponto atualizado com sucesso",
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

export { UpdateTimeSheetController };