import { Router } from 'express';
import { AuthController } from '../../controllers/auth/Auth.controller';
import { DetailUserController } from '../../controllers/user/DetailUser.controller';

const authRoutes = Router();

// Rota para login 
authRoutes.post('/', new AuthController().handle);

// Rota para obter dados do usuário logado 
authRoutes.get('/', new DetailUserController().handle);

export { authRoutes };