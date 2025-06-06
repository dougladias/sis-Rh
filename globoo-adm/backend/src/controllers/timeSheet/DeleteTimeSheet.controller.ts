import { Request, Response } from "express";
import { DeleteTimeSheetService } from "../../services/TimeSheet/DeleteTimeSheet.service";

class DeleteTimeSheetController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const deleteLogService = new DeleteTimeSheetService();

            // Executar o serviço
            await deleteLogService.execute(id);

            return res.status(200).json({
                success: true,
                message: "Registro de ponto excluído com sucesso"
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Ocorreu um erro inesperado"
            });
        }
    }
}

export { DeleteTimeSheetController };