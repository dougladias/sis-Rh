import { Request, Response } from "express";
import { DeletePayslipService } from "../../services/payslip/DeletePayslip.service";

class DeletePayslipController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const deletePayslipService = new DeletePayslipService();

            // Executar o serviço
            await deletePayslipService.execute(id);

            return res.status(200).json({
                success: true,
                message: "Holerite excluído com sucesso"
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Ocorreu um erro inesperado"
            });
        }
    }
}

export { DeletePayslipController };