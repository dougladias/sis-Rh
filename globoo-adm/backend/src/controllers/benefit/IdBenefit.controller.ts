import { Request, Response } from "express";
import { GetBenefitService } from "../../services/benefit/IdBenefit.service";

class GetBenefitController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const getBenefitService = new GetBenefitService();

            // Executar o serviço
            const benefit = await getBenefitService.execute(id);

            return res.status(200).json({
                success: true,
                benefit
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { GetBenefitController };