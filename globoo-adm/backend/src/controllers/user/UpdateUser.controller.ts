import { Request, Response } from "express";
import { UpdateUserService } from "../../services/user/UpdateUser.service";
import { Role } from "@prisma/client";

class UpdateUserController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, email, password, role, isActive } = req.body;

            // Verifica se pelo menos um campo para atualização foi fornecido
            if (!name && !email && !password && role === undefined && isActive === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Nenhum dado fornecido para atualização"
                });
            }

            // Instancia o serviço
            const updateUserService = new UpdateUserService();

            // Executa o serviço
            const user = await updateUserService.execute({
                id,
                name,
                email,
                password,
                role: role as Role,
                isActive
            });

            return res.status(200).json({
                success: true,
                message: "Usuário atualizado com sucesso",
                user
            });
        } catch (error) {
            let errorMessage = "Ocorreu um erro desconhecido";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return res.status(400).json({
                success: false,
                message: errorMessage
            });
        }
    }
}

export { UpdateUserController };