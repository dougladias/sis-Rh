import prismaClient from "../../prisma";

class DeleteProfileService {
    async execute(id: string) {
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

        try {
            // Exclui o perfil do banco de dados
            await prismaClient.profile.delete({
                where: {
                    id: id
                }
            });

            return { success: true };
        } catch (error) {
            throw new Error(`Erro ao excluir perfil: ${(error as Error).message}`);
        }
    }
}

export { DeleteProfileService };