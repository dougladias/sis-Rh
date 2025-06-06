import prismaClient from "../../prisma";

interface ListProfileParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
}

class ListProfileService {
    async execute({ page = 1, limit = 10, search, isActive }: ListProfileParams) {
        // Garantir que page e limit são números positivos
        const currentPage = page > 0 ? page : 1;
        const itemsPerPage = limit > 0 ? limit : 10;
        const skip = (currentPage - 1) * itemsPerPage;

        // Construir filtros
        const where: any = {};
        
        // Filtro de busca por nome ou descrição
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        // Filtro por status (ativo/inativo)
        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // Buscar perfis com paginação e filtros
        const profiles = await prismaClient.profile.findMany({
            where,
            skip,
            take: itemsPerPage,
            orderBy: {
                name: 'asc'
            }
        });

        // Contar total de registros para informações de paginação
        const totalProfiles = await prismaClient.profile.count({ where });
        
        // Calcular total de páginas
        const totalPages = Math.ceil(totalProfiles / itemsPerPage);

        return {
            profiles,
            pagination: {
                total: totalProfiles,
                page: currentPage,
                limit: itemsPerPage,
                totalPages
            }
        };
    }
}

export { ListProfileService };