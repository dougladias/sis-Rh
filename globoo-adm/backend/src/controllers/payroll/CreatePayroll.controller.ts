import { Request, Response } from "express";
import { CreatePayrollService } from "../../services/payroll/CreatePayroll.service";
import { PayrollStatus } from "@prisma/client";

class CreatePayrollController {
    async handle(req: Request, res: Response) {
        try {
            const { month, year, description, status } = req.body;

            // Validar os campos obrigatórios
            if (!month || !year) {
                return res.status(400).json({
                    success: false,
                    message: "Mês e ano são obrigatórios"
                });
            }

            // Validar o status (se fornecido)
            if (status && !Object.values(PayrollStatus).includes(status as PayrollStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Status inválido para folha de pagamento"
                });
            }

            // Instanciar o serviço
            const createPayrollService = new CreatePayrollService();

            // Executar o serviço
            const payroll = await createPayrollService.execute({
                month: Number(month),
                year: Number(year),
                description,
                status: status as PayrollStatus
            });

            return res.status(201).json({
                success: true,
                message: "Folha de pagamento criada com sucesso",
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

export { CreatePayrollController };