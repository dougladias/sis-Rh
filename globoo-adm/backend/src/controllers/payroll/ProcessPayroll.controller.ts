import { Request, Response } from "express";
import { ProcessPayrollService } from "../../services/payroll/ProcessPayroll.service";

class ProcessPayrollController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { processedBy } = req.body;

            // Verificar se o processedBy foi informado
            if (!processedBy) {
                return res.status(400).json({
                    success: false,
                    message: "É necessário informar quem está processando a folha"
                });
            }

            // Instanciar o serviço
            const processPayrollService = new ProcessPayrollService();

            // Executar o serviço
            const result = await processPayrollService.execute({ id, processedBy });

            return res.status(200).json({
                success: true,
                message: "Folha de pagamento processada com sucesso",
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

export { ProcessPayrollController };