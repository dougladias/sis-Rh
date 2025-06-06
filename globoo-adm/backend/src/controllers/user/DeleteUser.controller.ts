import { Request, Response } from "express";
import { DeleteUserService } from "../../services/user/DeleteUser.service";

class DeleteUserController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Instancia o serviço
            const deleteUserService = new DeleteUserService();

            // Executa o serviço
            await deleteUserService.execute(id);

            return res.status(200).json({
                success: true,
                message: "Usuário excluído com sucesso"
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Ocorreu um erro inesperado"
            });
        }
    }
}

export { DeleteUserController };