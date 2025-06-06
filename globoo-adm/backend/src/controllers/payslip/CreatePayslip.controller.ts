import { Request, Response } from "express";
import { CreatePayslipService } from "../../services/payslip/CreatePayslip.service";
import { PayslipStatus } from "@prisma/client";

class CreatePayslipController {
    async handle(req: Request, res: Response) {
        try {
            const {
                payrollId,
                workerId,
                baseSalary,
                totalBenefits,
                totalDeductions,
                netSalary,
                status,
                paymentDate,
                deductions,
                benefits
            } = req.body;

            // Validar os campos obrigatórios
            if (!payrollId || !workerId) {
                return res.status(400).json({
                    success: false,
                    message: "IDs da folha de pagamento e do funcionário são obrigatórios"
                });
            }

            // Validar o status (se fornecido)
            if (status && !Object.values(PayslipStatus).includes(status as PayslipStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Status inválido para holerite"
                });
            }

            // Instanciar o serviço
            const createPayslipService = new CreatePayslipService();

            // Executar o serviço
            const payslip = await createPayslipService.execute({
                payrollId,
                workerId,
                baseSalary: baseSalary ? Number(baseSalary) : undefined,
                totalBenefits: totalBenefits ? Number(totalBenefits) : undefined,
                totalDeductions: totalDeductions ? Number(totalDeductions) : undefined,
                netSalary: netSalary ? Number(netSalary) : undefined,
                status: status as PayslipStatus,
                paymentDate: paymentDate ? new Date(paymentDate) : null,
                deductions,
                benefits
            });

            return res.status(201).json({
                success: true,
                message: "Holerite criado com sucesso",
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

export { CreatePayslipController };