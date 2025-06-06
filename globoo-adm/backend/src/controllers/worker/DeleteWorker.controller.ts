import { Request, Response } from "express";
import { DeleteWorkerService } from "../../services/worker/DeleteWorker.service";

class DeleteWorkerController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const deleteWorkerService = new DeleteWorkerService();

            // Executar o serviço
            await deleteWorkerService.execute(id);

            return res.status(200).json({
                success: true,
                message: "Funcionário excluído com sucesso"
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Ocorreu um erro inesperado"
            });
        }
    }
}

export { DeleteWorkerController };