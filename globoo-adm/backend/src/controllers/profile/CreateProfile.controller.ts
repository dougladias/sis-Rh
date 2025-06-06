import { Request, Response } from "express";
import { CreateProfileService } from "../../services/profile/CreateProfile.service";

class CreateProfileController {
    async handle(req: Request, res: Response) {
        try {
            const { name, description, permissions, isActive } = req.body;

            // Verifica se as permissões foram enviadas como array
            if (!Array.isArray(permissions)) {
                return res.status(400).json({
                    success: false,
                    message: "As permissões devem ser enviadas como um array"
                });
            }

            // Instancia o serviço
            const createProfileService = new CreateProfileService();

            // Executa o serviço
            const profile = await createProfileService.execute({
                name,
                description,
                permissions,
                isActive
            });

            return res.status(201).json({
                success: true,
                message: "Perfil criado com sucesso",
                profile
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { CreateProfileController };