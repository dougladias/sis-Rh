import { Request, Response } from "express";
import { GetDeductionService } from "../../services/deduction/IdDeduction.service";

class GetDeductionController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const getDeductionService = new GetDeductionService();

            // Executar o serviço
            const deduction = await getDeductionService.execute(id);

            return res.status(200).json({
                success: true,
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

export { GetDeductionController };