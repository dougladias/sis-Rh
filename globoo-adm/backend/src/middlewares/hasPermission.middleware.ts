import { NextFunction, Request, Response } from "express";
import prisma from "../prisma";

/**
 * Middleware para verificar se o usuário tem as permissões necessárias
 */
export function hasPermission(requiredPermissions: string[]) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const user = request.user;
      
      if (!user || !user.id) {
        return response.status(401).json({
          success: false,
          message: "Usuário não autenticado"
        });
      }

      // Buscar usuário completo com role
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, isActive: true }
      });

      if (!fullUser || !fullUser.isActive) {
        return response.status(401).json({
          success: false,
          message: "Usuário inativo ou não encontrado"
        });
      }

      // MANAGER tem acesso total
      if (fullUser.role === 'MANAGER') {
        return next();
      }

      // Buscar permissões do usuário
      const userPermissions = await getUserPermissions(user.id);
      
      // Verificar se tem todas as permissões necessárias
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return response.status(403).json({
          success: false,
          message: "Acesso negado. Permissões insuficientes",
          required: requiredPermissions,
          current: userPermissions
        });
      }

      next();
    } catch (error) {
      console.error("Erro na verificação de permissões:", error);
      return response.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  };
}

/**
 * Middleware para verificar se o usuário tem pelo menos uma das permissões
 */
export function hasAnyPermission(permissions: string[]) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const user = request.user;
      
      if (!user || !user.id) {
        return response.status(401).json({
          success: false,
          message: "Usuário não autenticado"
        });
      }

      // Buscar usuário completo
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, isActive: true }
      });

      if (!fullUser || !fullUser.isActive) {
        return response.status(401).json({
          success: false,
          message: "Usuário inativo"
        });
      }

      // MANAGER tem acesso total
      if (fullUser.role === 'MANAGER') {
        return next();
      }

      // Buscar permissões do usuário
      const userPermissions = await getUserPermissions(user.id);
      
      // Verificar se tem pelo menos uma permissão
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return response.status(403).json({
          success: false,
          message: "Acesso negado"
        });
      }

      next();
    } catch (error) {
      console.error("Erro na verificação de permissões:", error);
      return response.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  };
}

/**
 * Função auxiliar para buscar permissões do usuário
 */
async function getUserPermissions(userId: string): Promise<string[]> {
  const userPermissions = await prisma.userPermission.findMany({
    where: { userId },
    include: { profile: true }
  });

  const permissions = new Set<string>();
  
  // Adicionar permissões dos perfis
  userPermissions.forEach(up => {
    if (up.profile && up.profile.permissions) {
      up.profile.permissions.forEach(perm => permissions.add(perm));
    }
    if (up.permissions) {
      up.permissions.forEach(perm => permissions.add(perm));
    }
  });

  return Array.from(permissions);
}