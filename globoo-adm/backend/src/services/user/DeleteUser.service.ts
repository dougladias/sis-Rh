import prismaClient from "../../prisma";

class DeleteUserService {
    async execute(id: string) {
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

        try {
            // Exclui o usuário do banco de dados           
            await prismaClient.user.delete({
                where: {
                    id: id
                }
            });

            return { success: true };
        } catch (error) {
            throw new Error(`Erro ao excluir usuário: ${(error as Error).message}`);
        }
    }
}

export { DeleteUserService };