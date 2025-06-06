import { Request, Response } from "express";
import { UpdateDeductionService } from "../../services/deduction/UpdateDeduction.service";

class UpdateDeductionController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                code,
                type,
                description,
                percentage,
                value,
                isRequired
            } = req.body;

            // Instanciar o serviço
            const updateDeductionService = new UpdateDeductionService();

            // Executar o serviço
            const deduction = await updateDeductionService.execute({
                id,
                code,
                type,
                description,
                percentage: percentage !== undefined ? Number(percentage) : undefined,
                value: value !== undefined ? Number(value) : undefined,
                isRequired
            });

            return res.status(200).json({
                success: true,
                message: "Dedução atualizada com sucesso",
                deduction
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { UpdateDeductionController };