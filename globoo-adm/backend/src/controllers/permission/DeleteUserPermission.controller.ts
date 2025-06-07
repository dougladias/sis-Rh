import { Request, Response } from "express";
import { DeleteUserPermissionService } from "../../services/permission/DeleteUserPermission.service";

class DeleteUserPermissionController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instanciar o serviço
            const deleteUserPermissionService = new DeleteUserPermissionService();

            // Executar o serviço
            await deleteUserPermissionService.execute(id);

            return res.status(200).json({
                success: true,
                message: "Permissão removida com sucesso"
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Ocorreu um erro inesperado"
            });
        }
    }
}

export { DeleteUserPermissionController };