import { Request, Response } from 'express';
import { DetailUserService } from '../../services/user/DetailUser.service';

class DetailUserController {
  async handle(req: Request, res: Response) {
    try {
      const user_id = req.user_id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: "Token inválido ou expirado"
        });
      }

      const detailUserService = new DetailUserService();
      
      const user = await detailUserService.execute(user_id);

      return res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      // Corrigir o tratamento de erro desconhecido
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }
}

export { DetailUserController };