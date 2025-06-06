import { Request, Response } from "express";
import { UpdatePayslipService } from "../../services/payslip/UpdatePayslip.service";
import { PayslipStatus } from "@prisma/client";

class UpdatePayslipController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                baseSalary,
                totalBenefits,
                totalDeductions,
                netSalary,
                status,
                paymentDate
            } = req.body;

            // Validar o status (se fornecido)
            if (status && !Object.values(PayslipStatus).includes(status as PayslipStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Status inválido para holerite"
                });
            }

            // Instanciar o serviço
            const updatePayslipService = new UpdatePayslipService();

            // Executar o serviço
            const payslip = await updatePayslipService.execute({
                id,
                baseSalary: baseSalary ? Number(baseSalary) : undefined,
                totalBenefits: totalBenefits ? Number(totalBenefits) : undefined,
                totalDeductions: totalDeductions ? Number(totalDeductions) : undefined,
                netSalary: netSalary ? Number(netSalary) : undefined,
                status: status as PayslipStatus,
                paymentDate: paymentDate === undefined ? undefined :
                    paymentDate ? new Date(paymentDate) : null
            });

            return res.status(200).json({
                success: true,
                message: "Holerite atualizado com sucesso",
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

export { UpdatePayslipController };