import { Request, Response } from "express";
import { ListWorkerService } from "../../services/worker/ListWorker.service";
import { ContractType, WorkerStatus } from "@prisma/client";

class ListWorkerController {
    async handle(req: Request, res: Response) {
        try {
            // Extrair parâmetros de consulta
            const {
                page,
                limit,
                search,
                department,
                status,
                contractType
            } = req.query;

            // Converter parâmetros para os tipos apropriados
            const params = {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
                search: search as string,
                department: department as string,
                status: status as WorkerStatus,
                contractType: contractType as ContractType
            };

            // Instanciar o serviço
            const listWorkerService = new ListWorkerService();

            // Executar o serviço
            const result = await listWorkerService.execute(params);

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

export { ListWorkerController };