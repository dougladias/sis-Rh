import { Request, Response } from "express";
import { ListUserPermissionService } from "../../services/userPermission/ListUserPermission.service";

class ListUserPermissionController {
    async handle(req: Request, res: Response) {
        try {
            // Extrair parâmetros de consulta
            const { userId, profileId, page, limit } = req.query;

            // Converter parâmetros para os tipos apropriados
            const params = {
                userId: userId as string,
                profileId: profileId as string,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10
            };

            // Instanciar o serviço
            const listUserPermissionService = new ListUserPermissionService();

            // Executar o serviço
            const result = await listUserPermissionService.execute(params);

            return res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { ListUserPermissionController };