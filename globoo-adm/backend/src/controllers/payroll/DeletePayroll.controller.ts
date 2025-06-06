import { Request, Response } from "express";
import { DeletePayrollService } from "../../services/payroll/DeletePayroll.service";

class DeletePayrollController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const deletePayrollService = new DeletePayrollService();

            // Executar o serviço
            await deletePayrollService.execute(id);

            return res.status(200).json({
                success: true,
                message: "Folha de pagamento excluída com sucesso"
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Ocorreu um erro inesperado"
            });
        }
    }
}

export { DeletePayrollController };