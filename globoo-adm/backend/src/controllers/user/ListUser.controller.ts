import { Request, Response } from "express";
import { ListUserService } from "../../services/user/ListUser.service";
import { Role } from "@prisma/client";

class ListUserController {
    async handle(req: Request, res: Response) {
        try {
            // Extrair parâmetros de consulta
            const { 
                page, 
                limit, 
                search, 
                role, 
                isActive 
            } = req.query;

            // Converter parâmetros para os tipos apropriados
            const params = {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
                search: search as string,
                role: role as Role,
                isActive: isActive === undefined ? undefined : isActive === 'true'
            };

            // Instanciar o serviço
            const listUserService = new ListUserService();

            // Executar o serviço
            const result = await listUserService.execute(params);

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

export { ListUserController };