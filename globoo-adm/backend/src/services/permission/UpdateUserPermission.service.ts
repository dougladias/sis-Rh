import prismaClient from "../../prisma";

interface UpdateUserPermissionRequest {
  id: string;
  permissions: string[];
  profileId?: string;
}

class UpdateUserPermissionService {
  async execute({ id, permissions, profileId }: UpdateUserPermissionRequest) {
    // Verificar se a permissão existe
    const permissionExists = await prismaClient.userPermission.findUnique({
      where: { id }
    });

    if (!permissionExists) {
      throw new Error("Permissão não encontrada");
    }

    // Se profileId for fornecido, verificar se o perfil existe
    if (profileId && profileId !== permissionExists.profileId) {
      const profileExists = await prismaClient.profile.findUnique({
        where: { id: profileId }
      });

      if (!profileExists) {
        throw new Error("Perfil não encontrado");
      }

      // Verificar se já existe outra associação entre este usuário e o novo perfil
      const existingPermission = await prismaClient.userPermission.findFirst({
        where: {
          userId: permissionExists.userId,
          profileId,
          id: { not: id }
        }
      });

      if (existingPermission) {
        throw new Error("Este usuário já possui permissões associadas a este perfil");
      }
    }

    // Atualizar a permissão
    const updatedPermission = await prismaClient.userPermission.update({
      where: { id },
      data: {
        permissions,
        profileId,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        profile: true
      }
    });

    return updatedPermission;
  }
}

export { UpdateUserPermissionService };