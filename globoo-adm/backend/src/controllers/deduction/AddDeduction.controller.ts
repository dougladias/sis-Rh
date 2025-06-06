import { Request, Response } from "express";
import { AddDeductionService } from "../../services/deduction/AddDeduction.service";

class AddDeductionController {
    async handle(req: Request, res: Response) {
        try {
            const { payslipId } = req.params;
            const {
                code,
                type,
                description,
                percentage,
                value,
                isRequired
            } = req.body;

            // Validar campos obrigatórios
            if (!code || !type || value === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Código, tipo e valor são obrigatórios"
                });
            }

            // Instanciar o serviço
            const addDeductionService = new AddDeductionService();

            // Executar o serviço
            const deduction = await addDeductionService.execute({
                payslipId,
                code,
                type,
                description,
                percentage: percentage ? Number(percentage) : undefined,
                value: Number(value),
                isRequired
            });

            return res.status(201).json({
                success: true,
                message: "Dedução adicionada com sucesso",
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

export { AddDeductionController };