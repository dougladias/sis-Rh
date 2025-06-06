import { Request, Response } from "express";
import { ListTimeSheetService } from "../../services/TimeSheet/ListTimeSheet.service";

class ListTimeSheetController {
    async handle(req: Request, res: Response) {
        try {
            // Extrair parâmetros de consulta
            const {
                workerId,
                startDate,
                endDate,
                isAbsent,
                page,
                limit
            } = req.query;

            // Converter parâmetros para os tipos apropriados
            const params = {
                workerId: workerId as string,
                startDate: startDate as string,
                endDate: endDate as string,
                isAbsent: isAbsent === undefined ? undefined : isAbsent === 'true',
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10
            };

            // Instanciar o serviço
            const listLogService = new ListTimeSheetService();

            // Executar o serviço
            const result = await listLogService.execute(params);

            return res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { ListTimeSheetController };