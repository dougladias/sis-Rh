import { Request, Response } from "express";
import { UpdatePayrollService } from "../../services/payroll/UpdatePayroll.service";
import { PayrollStatus } from "@prisma/client";

class UpdatePayrollController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                description,
                status,
                processedAt,
                processedBy
            } = req.body;

            // Validar o status (se fornecido)
            if (status && !Object.values(PayrollStatus).includes(status as PayrollStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Status inválido para folha de pagamento"
                });
            }

            // Instanciar o serviço
            const updatePayrollService = new UpdatePayrollService();

            // Executar o serviço
            const payroll = await updatePayrollService.execute({
                id,
                description,
                status: status as PayrollStatus,
                processedAt: processedAt === undefined ? undefined : processedAt ? new Date(processedAt) : null,
                processedBy: processedBy === undefined ? undefined : processedBy
            });

            return res.status(200).json({
                success: true,
                message: "Folha de pagamento atualizada com sucesso",
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

export { UpdatePayrollController };