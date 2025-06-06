import { Request, Response } from "express";
import { GetPayrollService } from "../../services/payroll/IdPayroll.service";

class GetPayrollController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const getPayrollService = new GetPayrollService();

            // Executar o serviço
            const payroll = await getPayrollService.execute(id);

            return res.status(200).json({
                success: true,
                payroll
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { GetPayrollController };