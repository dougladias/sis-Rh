import prismaClient from "../../prisma";

interface ListUserPermissionParams {
  userId?: string;
  profileId?: string;
  page?: number;
  limit?: number;
}

class ListUserPermissionService {
  async execute({ userId, profileId, page = 1, limit = 10 }: ListUserPermissionParams) {
    // Garantir que page e limit são números positivos
    const currentPage = page > 0 ? page : 1;
    const itemsPerPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * itemsPerPage;

    // Construir filtros
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (profileId) where.profileId = profileId;

    // Buscar permissões de usuário com paginação e filtros
    const userPermissions = await prismaClient.userPermission.findMany({
      where,
      skip,
      take: itemsPerPage,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Contar total de registros para informações de paginação
    const totalUserPermissions = await prismaClient.userPermission.count({ where });
    
    // Calcular total de páginas
    const totalPages = Math.ceil(totalUserPermissions / itemsPerPage);

    return {
      userPermissions,
      pagination: {
        total: totalUserPermissions,
        page: currentPage,
        limit: itemsPerPage,
        totalPages
      }
    };
  }
}

export { ListUserPermissionService };