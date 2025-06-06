import { Request, Response } from "express";
import { CreateUserService } from '../../services/user/CreateUser.service';
import { Role } from "@prisma/client";

class CreateUserController {
    async handle(req: Request, res: Response) {
        try {
            const { name, email, password, role, isActive } = req.body;

            // Instancia o serviço
            const createUserService = new CreateUserService();

            // Executa o serviço passando os dados
            const user = await createUserService.execute({
                name,
                email,
                password,
                role: role as Role,
                isActive: isActive !== undefined ? isActive : true
            });

            return res.status(201).json({
                success: true,
                message: "Usuário criado com sucesso",
                user
            });
        } catch (error) {
            // Tratamento de erros
            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });
        }
    }
}

export { CreateUserController };