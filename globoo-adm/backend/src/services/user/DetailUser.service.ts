import prismaClient from '../../prisma';

class DetailUserService {
  async execute(user_id: string) {
    // Busca o usuário pelo ID, incluindo seu perfil e permissões
    const user = await prismaClient.user.findUnique({
      where: {
        id: user_id
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true, 
        role: true,    
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Se o usuário não estiver ativo, não permite o acesso
    if (!user.isActive) {
      throw new Error("Usuário inativo");
    }

    return user;
  }
}

export { DetailUserService };