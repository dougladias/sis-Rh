import { Request, Response } from "express";
import { ListProfileService } from "../../services/profile/ListProfile.service";

class ListProfileController {
    async handle(req: Request, res: Response) {
        try {
            // Extrair parâmetros de consulta
            const { 
                page, 
                limit, 
                search, 
                isActive 
            } = req.query;

            // Converter parâmetros para os tipos apropriados
            const params = {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
                search: search as string,
                isActive: isActive === undefined ? undefined : isActive === 'true'
            };

            // Instanciar o serviço
            const listProfileService = new ListProfileService();

            // Executar o serviço
            const result = await listProfileService.execute(params);

            return res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred";
            return res.status(400).json({
                success: false,
                message: message
            });
        }
    }
}

export { ListProfileController };