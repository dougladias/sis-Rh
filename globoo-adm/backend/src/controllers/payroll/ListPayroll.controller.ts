import { Request, Response } from "express";
import { ListPayrollService } from "../../services/payroll/ListPayroll.service";
import { PayrollStatus } from "@prisma/client";

class ListPayrollController {
    async handle(req: Request, res: Response) {
        try {
            // Extrair parâmetros de consulta
            const {
                year,
                month,
                status,
                page,
                limit
            } = req.query;

            // Converter parâmetros para os tipos apropriados
            const params = {
                year: year ? parseInt(year as string) : undefined,
                month: month ? parseInt(month as string) : undefined,
                status: status as PayrollStatus,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10
            };

            // Instanciar o serviço
            const listPayrollService = new ListPayrollService();

            // Executar o serviço
            const result = await listPayrollService.execute(params);

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

export { ListPayrollController };