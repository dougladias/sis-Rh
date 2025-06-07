import prismaClient from "../../prisma";

class DeleteUserPermissionService {
  async execute(id: string) {
    // Verificar se a permissão existe
    const permissionExists = await prismaClient.userPermission.findUnique({
      where: { id }
    });

    if (!permissionExists) {
      throw new Error("Permissão não encontrada");
    }

    // Excluir a permissão
    await prismaClient.userPermission.delete({
      where: { id }
    });

    return { success: true };
  }
}

export { DeleteUserPermissionService };