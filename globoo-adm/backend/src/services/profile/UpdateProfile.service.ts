import prismaClient from "../../prisma";

// Interface para definir os dados que podem ser atualizados
interface UpdateProfileRequest {
    id: string;
    name?: string;
    description?: string;
    permissions?: string[];
    isActive?: boolean;
}

class UpdateProfileService {
    async execute({ id, name, description, permissions, isActive }: UpdateProfileRequest) {
        // Verifica se o ID foi enviado
        if (!id) {
            throw new Error("ID do perfil é obrigatório");
        }

        // Verifica se o perfil existe
        const profileExists = await prismaClient.profile.findUnique({
            where: {
                id: id
            }
        });

        if (!profileExists) {
            throw new Error("Perfil não encontrado");
        }

        // Se for atualizar o nome, verifica se já não existe outro perfil com este nome
        if (name && name !== profileExists.name) {
            const nameExists = await prismaClient.profile.findFirst({
                where: {
                    name: name,
                    NOT: {
                        id: id
                    }
                }
            });

            if (nameExists) {
                throw new Error("Este nome já está sendo utilizado por outro perfil");
            }
        }

        // Preparar dados para atualização
        const updateData: any = { updatedAt: new Date() };
        
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (permissions && permissions.length > 0) updateData.permissions = permissions;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Atualiza o perfil no banco
        const updatedProfile = await prismaClient.profile.update({
            where: {
                id: id
            },
            data: updateData
        });

        return updatedProfile;
    }
}

export { UpdateProfileService };