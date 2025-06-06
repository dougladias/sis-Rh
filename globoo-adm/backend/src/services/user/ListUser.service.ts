import prismaClient from "../../prisma";
import { Role } from "@prisma/client";

interface ListUserParams {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    isActive?: boolean;
}

class ListUserService {
    async execute({ page = 1, limit = 10, search, role, isActive }: ListUserParams) {
        // Garantir que page e limit são números positivos
        const currentPage = page > 0 ? page : 1;
        const itemsPerPage = limit > 0 ? limit : 10;
        const skip = (currentPage - 1) * itemsPerPage;

        // Construir filtros
        const where: any = {};
        
        // Filtro de busca por nome ou email
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        // Filtro por função/cargo
        if (role) {
            where.role = role;
        }
        
        // Filtro por status (ativo/inativo)
        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // Buscar usuários com paginação e filtros
        const users = await prismaClient.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true
            },
            skip,
            take: itemsPerPage,
            orderBy: {
                name: 'asc'
            }
        });

        // Contar total de registros para informações de paginação
        const totalUsers = await prismaClient.user.count({ where });
        
        // Calcular total de páginas
        const totalPages = Math.ceil(totalUsers / itemsPerPage);

        return {
            users,
            pagination: {
                total: totalUsers,
                page: currentPage,
                limit: itemsPerPage,
                totalPages
            }
        };
    }
}

export { ListUserService };