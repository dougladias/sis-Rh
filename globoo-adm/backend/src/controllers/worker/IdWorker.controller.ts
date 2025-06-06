import { Request, Response } from "express";
import { GetWorkerService } from "../../services/worker/IdWorker.service";

class GetWorkerController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const getWorkerService = new GetWorkerService();

            // Executar o serviço
            const worker = await getWorkerService.execute(id);

            return res.status(200).json({
                success: true,
                worker
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { GetWorkerController };