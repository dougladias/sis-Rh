import { Request, Response } from "express";
import { DeleteBenefitService } from "../../services/benefit/DeleteBenefit.service";

class DeleteBenefitController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const deleteBenefitService = new DeleteBenefitService();

            // Executar o serviço
            await deleteBenefitService.execute(id);

            return res.status(200).json({
                success: true,
                message: "Benefício excluído com sucesso"
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { DeleteBenefitController };