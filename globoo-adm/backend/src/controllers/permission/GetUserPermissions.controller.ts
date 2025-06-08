import { Request, Response } from "express";
import prisma from "../../prisma";

export class GetUserPermissionsController {
  async handle(req: Request, res: Response) {
    try {   
      // Verificar se o usuário está autenticado
      if (!(req as any).user || !(req as any).user.id) {       
        return res.status(400).json({ 
          success: false, 
          message: "Usuário não autenticado ou ID do usuário ausente" 
        });
      }
      
      const userId = (req as any).user.id;
      
      // Verificar se o usuário tem role MANAGER ou ADMIN (permissões totais)
      const userRole = (req as any).user.role?.toUpperCase();
      if (userRole === 'MANAGER') {
        // Retornar todas as permissões possíveis para esse tipo de usuário
        const allPermissions = [
          "dashboard:read",
          "backoffice:access",
          "workers:read", "workers:write", "workers:delete",
          "beneficits:read", "benefits:write", "benefits:delete",
          "documents:read", "documents:write", "documents:delete",
          "templates:read", "templates:write", "templates:delete",
          "timesheet:read", "timesheet:write", "timesheet:delete",
          "payroll:read", "payroll:write", "payroll:delete",
          "payslips:read", "payslips:write", "payslips:delete",
          "invoices:read", "invoices:write", "invoices:delete",
          "visitors:read", "visitors:write", "visitors:delete",
          "providers:read", "providers:write", "providers:delete",
          "tasks:read", "tasks:write", "tasks:delete"
        ];
        
        return res.json({ 
          success: true, 
          permissions: allPermissions 
        });
      }
      
      // Para outros usuários, buscar permissões específicas do banco de dados
      const userPermissions = await prisma.userPermission.findMany({
        where: { userId },
        include: { profile: true }
      });
      
      // Extrair e combinar permissões dos perfis
      let permissions: string[] = [];
      for (const userPerm of userPermissions) {
        if (userPerm.profile && userPerm.profile.permissions) {
          permissions = [...permissions, ...userPerm.profile.permissions];
        }
        if (userPerm.permissions) {
          permissions = [...permissions, ...userPerm.permissions];
        }
      }
      
      // Remover duplicatas
      permissions = [...new Set(permissions)];    
      return res.json({ 
        success: true, 
        permissions 
      });
    } catch (error) {
      console.error("Erro ao buscar permissões:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar permissões do usuário" 
      });
    }
  }
}