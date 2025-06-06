import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { Role } from "@prisma/client";

// Interface para definir os dados que podem ser atualizados
interface UpdateUserRequest {
    id: string;
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    isActive?: boolean;
}

class UpdateUserService {
    async execute({ id, name, email, password, role, isActive }: UpdateUserRequest) {
        // Verifica se o ID foi enviado
        if (!id) {
            throw new Error("ID do usuário é obrigatório");
        }

        // Verifica se o usuário existe
        const userExists = await prismaClient.user.findUnique({
            where: {
                id: id
            }
        });

        if (!userExists) {
            throw new Error("Usuário não encontrado");
        }

        // Se for atualizar o email, verifica se já não existe outro usuário com este email
        if (email && email !== userExists.email) {
            const emailExists = await prismaClient.user.findFirst({
                where: {
                    email: email,
                    NOT: {
                        id: id
                    }
                }
            });

            if (emailExists) {
                throw new Error("Este email já está sendo utilizado por outro usuário");
            }
        }

        // Preparar dados para atualização
        const updateData: any = {};
        
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        
        // Se a senha foi fornecida, faz o hash dela
        if (password) {
            updateData.password = await hash(password, 8);
        }

        // Atualiza a data de atualização
        updateData.updatedAt = new Date();

        // Atualiza o usuário no banco
        const updatedUser = await prismaClient.user.update({
            where: {
                id: id
            },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                updatedAt: true,
                createdAt: true
            }
        });

        return updatedUser;
    }
}

export { UpdateUserService };