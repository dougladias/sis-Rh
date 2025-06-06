import prismaClient from "../../prisma";

// Interface para definir os dados necessários para criar um perfil
interface ProfileRequest {
    name: string;
    description?: string;
    permissions: string[];
    isActive?: boolean;
}

class CreateProfileService {
    async execute({ name, description, permissions, isActive = true }: ProfileRequest) {
        // Verifica se o nome foi enviado
        if (!name) {
            throw new Error("Nome do perfil é obrigatório");
        }

        // Verifica se as permissões foram enviadas
        if (!permissions || permissions.length === 0) {
            throw new Error("É necessário informar pelo menos uma permissão");
        }

        // Verifica se o perfil já existe com esse nome
        const profileExists = await prismaClient.profile.findFirst({
            where: {
                name: name
            }
        });

        if (profileExists) {
            throw new Error("Já existe um perfil com este nome");
        }

        // Cria o perfil no banco
        const profile = await prismaClient.profile.create({
            data: {
                name,
                description,
                permissions,
                isActive,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        return profile;
    }
}

export { CreateProfileService };