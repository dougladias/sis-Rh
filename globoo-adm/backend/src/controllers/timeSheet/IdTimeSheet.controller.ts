import { Request, Response } from "express";
import { GetTimeSheetService } from "../../services/TimeSheet/IdTimeSheet.service";

class GetTimeSheetController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const getLogService = new GetTimeSheetService();

            // Executar o serviço
            const log = await getLogService.execute(id);

            return res.status(200).json({
                success: true,
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

export { GetTimeSheetController };