import { Request, Response } from "express";
import { CreateUserPermissionService } from "../../services/userPermission/CreateUserPermission.service";

class CreateUserPermissionController {
    async handle(req: Request, res: Response) {
        try {
            const { userId, profileId, permissions } = req.body;

            // Validar os campos obrigatórios
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "ID do usuário é obrigatório"
                });
            }

            if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "É necessário fornecer ao menos uma permissão"
                });
            }

            // Instanciar o serviço
            const createUserPermissionService = new CreateUserPermissionService();

            // Executar o serviço
            const userPermission = await createUserPermissionService.execute({
                userId,
                profileId,
                permissions
            });

            return res.status(201).json({
                success: true,
                message: "Permissões atribuídas com sucesso",
                userPermission
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { CreateUserPermissionController };