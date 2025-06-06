import { Request, Response } from "express";
import { DeleteDeductionService } from "../../services/deduction/DeleteDeduction.service";

class DeleteDeductionController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const deleteDeductionService = new DeleteDeductionService();

            // Executar o serviço
            await deleteDeductionService.execute(id);

            return res.status(200).json({
                success: true,
                message: "Dedução excluída com sucesso"
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Ocorreu um erro inesperado"
            });
        }
    }
}

export { DeleteDeductionController };