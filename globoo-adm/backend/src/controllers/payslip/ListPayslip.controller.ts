import { Request, Response } from "express";
import { ListPayslipService } from "../../services/payslip/ListPayslip.service";
import { PayslipStatus } from "@prisma/client";

class ListPayslipController {
    async handle(req: Request, res: Response) {
        try {
            // Extrair parâmetros de consulta
            const {
                payrollId,
                workerId,
                status,
                department,
                page,
                limit,
                details
            } = req.query;

            // Converter parâmetros para os tipos apropriados
            const params = {
                payrollId: payrollId as string,
                workerId: workerId as string,
                status: status as PayslipStatus,
                department: department as string,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
                includeDetails: details === 'true'
            };

            // Instanciar o serviço
            const listPayslipService = new ListPayslipService();

            // Executar o serviço
            const result = await listPayslipService.execute(params);

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

export { ListPayslipController };