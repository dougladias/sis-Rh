import { Request, Response } from "express";
import { GetPayslipService } from "../../services/payslip/IdPayslip.service";

class GetPayslipController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const getPayslipService = new GetPayslipService();

            // Executar o serviço
            const payslip = await getPayslipService.execute(id);

            return res.status(200).json({
                success: true,
                payslip
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { GetPayslipController };