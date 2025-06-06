import prismaClient from "../../prisma";

interface CreateUserPermissionRequest {
  userId: string;
  profileId?: string;
  permissions: string[];
}

class CreateUserPermissionService {
  async execute({ userId, profileId, permissions }: CreateUserPermissionRequest) {
    // Verificar se o usuário existe
    const userExists = await prismaClient.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      throw new Error("Usuário não encontrado");
    }

    // Se profileId for fornecido, verificar se o perfil existe
    if (profileId) {
      const profileExists = await prismaClient.profile.findUnique({
        where: { id: profileId }
      });

      if (!profileExists) {
        throw new Error("Perfil não encontrado");
      }
    }

    // Verificar se já existe uma associação entre este usuário e perfil
    if (profileId) {
      const existingPermission = await prismaClient.userPermission.findFirst({
        where: {
          userId,
          profileId
        }
      });

      if (existingPermission) {
        throw new Error("Este usuário já possui permissões associadas a este perfil");
      }
    }

    // Criar a permissão do usuário
    const userPermission = await prismaClient.userPermission.create({
      data: {
        userId,
        profileId,
        permissions,
        createdAt: new Date(),
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

    return userPermission;
  }
}

export { CreateUserPermissionService };