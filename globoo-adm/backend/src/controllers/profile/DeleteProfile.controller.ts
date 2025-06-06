import { Request, Response } from "express";
import { DeleteProfileService } from "../../services/profile/DeleteProfile.service";

class DeleteProfileController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instancia o serviço
            const deleteProfileService = new DeleteProfileService();

            // Executa o serviço
            await deleteProfileService.execute(id);

            return res.status(200).json({
                success: true,
                message: "Perfil excluído com sucesso"
            });
        } catch (error) {
              return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Ocorreu um erro inesperado"
            });
        }
    }
}

export { DeleteProfileController };