import { Request, Response } from "express";
import { AddBenefitService } from "../../services/benefit/AddBenefit.service";

class AddBenefitController {
    async handle(req: Request, res: Response) {
        try {
            const { payslipId } = req.params;
            const {
                code,
                type,
                description,
                value
            } = req.body;

            // Validar campos obrigatórios
            if (!code || !type || value === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Código, tipo e valor são obrigatórios"
                });
            }

            // Instanciar o serviço
            const addBenefitService = new AddBenefitService();

            // Executar o serviço
            const benefit = await addBenefitService.execute({
                payslipId,
                code,
                type,
                description,
                value: Number(value)
            });

            return res.status(201).json({
                success: true,
                message: "Benefício adicionado com sucesso",
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

export { AddBenefitController };