import { Request, Response } from "express";
import { UpdateBenefitService } from "../../services/benefit/UpdateBenefit.service";

class UpdateBenefitController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                code,
                type,
                description,
                value
            } = req.body;

            // Instanciar o serviço
            const updateBenefitService = new UpdateBenefitService();

            // Executar o serviço
            const benefit = await updateBenefitService.execute({
                id,
                code,
                type,
                description,
                value: value !== undefined ? Number(value) : undefined
            });

            return res.status(200).json({
                success: true,
                message: "Benefício atualizado com sucesso",
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

export { UpdateBenefitController };