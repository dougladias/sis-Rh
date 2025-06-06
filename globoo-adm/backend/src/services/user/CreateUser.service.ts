import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { Role } from "@prisma/client";

// Interface para definir os dados necessários para criar um usuário
interface UserRequest {
    name: string;
    email: string;
    password: string;
    role: Role;
    isActive?: boolean;
}

class CreateUserService {
    async execute({ name, email, password, role, isActive = true }: UserRequest) {
        // Verifica se email foi enviado
        if (!email) {
            throw new Error("Email é obrigatório");
        }

        // Verifica se o nome foi enviado
        if (!name) {
            throw new Error("Nome é obrigatório");
        }

        // Verifica se a senha foi enviada
        if (!password) {
            throw new Error("Senha é obrigatória");
        }

        // Verifica se o role foi enviado e é válido
        if (!Object.values(Role).includes(role as Role)) {
            throw new Error("Função/cargo inválido");
        }

        // Verifica se o email já existe
        const userAlreadyExists = await prismaClient.user.findFirst({
            where: {
                email: email
            }
        });

        if (userAlreadyExists) {
            throw new Error("Este email já está cadastrado");
        }

        // Criptografa a senha
        const passwordHash = await hash(password, 8);

        // Cria o usuário no banco
        const user = await prismaClient.user.create({
            data: {
                name,
                email,
                password: passwordHash,
                role,
                isActive,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        return user;
    }
}

export { CreateUserService };