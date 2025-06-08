import { Request, Response } from 'express';
import prismaClient from "../../prisma";

class DetailUserController {
  async handle(req: Request, res: Response) {
    try {    
      
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: "Token inválido ou expirado"
        });
      }

      // Buscar usuário com suas permissões
      const user = await prismaClient.user.findUnique({
        where: { id: user_id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          userPermissions: {
            select: {
              permissions: true,
              profile: {
                select: {
                  id: true,
                  name: true,
                  permissions: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }

      // Extrair permissões do perfil e permissões diretas do usuário
      const permissions = new Set<string>();
      
      // Adicionar permissões dos perfis
      user.userPermissions.forEach(up => {
        if (up.profile && up.profile.permissions) {
          up.profile.permissions.forEach(perm => permissions.add(perm));
        }
        if (up.permissions) {
          up.permissions.forEach(perm => permissions.add(perm));
        }
      });

      // Se for MANAGER, adicionar todas as permissões
      if (user.role === 'MANAGER') {
        const allPermissions = [
          "dashboard:read",
          "backoffice:access",
          'users:read', 'users:create', 'users:edit', 'users:delete',
          'profiles:read', 'profiles:create', 'profiles:edit', 'profiles:delete',
          'workers:read', 'workers:create', 'workers:edit', 'workers:delete',
          'benefits:read', 'benefits:create', 'benefits:edit', 'benefits:delete',
          'documents:read', 'documents:create', 'documents:edit', 'documents:delete',
          'timesheets:read', 'timesheets:edit', 
          'payrolls:read', 'payrolls:edit', 'payrolls:delete',
          'payslips:read', 'payslips:edit', 'payslips:delete',
          'templates:read', 'templates:edit', 'templates:create', 'templates:delete',
          'invoices:read', 'invoices:create', 'invoices:edit', 'invoices:delete',
          'visitors:read', 'visitors:create', 'visitors:edit', 'visitors:delete',
          'providers:read', 'providers:create', 'providers:edit', 'providers:delete'
          
        ];
        allPermissions.forEach(perm => permissions.add(perm));
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        },
        permissions: Array.from(permissions)
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }
}

export { DetailUserController };