import { Request, Response } from "express";
import { ListBenefitService } from "../../services/benefit/ListBenefit.service";

class ListBenefitController {
    async handle(req: Request, res: Response) {
        try {
            const { payslipId } = req.params;

            // Instanciar o serviço
            const listBenefitService = new ListBenefitService();

            // Executar o serviço
            const benefits = await listBenefitService.execute(payslipId);

            return res.status(200).json({
                success: true,
                benefits
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { ListBenefitController };