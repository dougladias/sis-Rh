import { Request, Response } from "express";
import { UpdateProfileService } from "../../services/profile/UpdateProfile.service";

class UpdateProfileController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, permissions, isActive } = req.body;

            // Verifica se pelo menos um campo para atualização foi fornecido
            if (!name && description === undefined && !permissions && isActive === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Nenhum dado fornecido para atualização"
                });
            }

            // Verifica se as permissões, quando enviadas, são um array
            if (permissions && !Array.isArray(permissions)) {
                return res.status(400).json({
                    success: false,
                    message: "As permissões devem ser enviadas como um array"
                });
            }

            // Instancia o serviço
            const updateProfileService = new UpdateProfileService();

            // Executa o serviço
            const profile = await updateProfileService.execute({
                id,
                name,
                description,
                permissions,
                isActive
            });

            return res.status(200).json({
                success: true,
                message: "Perfil atualizado com sucesso",
                profile
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { UpdateProfileController };