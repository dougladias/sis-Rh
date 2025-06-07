import { Request, Response } from "express";
import { UpdateUserPermissionService } from "../../services/permission/UpdateUserPermission.service";

class UpdateUserPermissionController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { permissions, profileId } = req.body;

            // Validar os campos obrigatórios
            if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "É necessário fornecer ao menos uma permissão"
                });
            }

            // Instanciar o serviço
            const updateUserPermissionService = new UpdateUserPermissionService();

            // Executar o serviço
            const userPermission = await updateUserPermissionService.execute({
                id,
                permissions,
                profileId
            });

            return res.status(200).json({
                success: true,
                message: "Permissões atualizadas com sucesso",
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

export { UpdateUserPermissionController };