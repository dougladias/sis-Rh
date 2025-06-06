import { Request, Response } from "express";
import { ListDeductionService } from "../../services/deduction/ListDeduction.service";

class ListDeductionController {
    async handle(req: Request, res: Response) {
        try {
            const { payslipId } = req.params;

            // Instanciar o serviço
            const listDeductionService = new ListDeductionService();

            // Executar o serviço
            const deductions = await listDeductionService.execute(payslipId);

            return res.status(200).json({
                success: true,
                deductions
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { ListDeductionController };