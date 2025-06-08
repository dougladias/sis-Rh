import { Router } from "express";
import { ListUserController } from '../../controllers/user/ListUser.controller';
import { CreateUserController } from "../../controllers/user/CreateUser.controller";
import { UpdateUserController } from '../../controllers/user/UpdateUser.controller';
import { DeleteUserController } from '../../controllers/user/DeleteUser.controller';
import { DetailUserController } from '../../controllers/user/DetailUser.controller';
import { isAuthenticated } from "../../middlewares/isAuthenticated.middleware";

const userRouter = Router();

// Rotas para o usuário
userRouter.get('/', isAuthenticated, new ListUserController().handle);
userRouter.post('/', new CreateUserController().handle);
userRouter.put('/:id', isAuthenticated, new UpdateUserController().handle);
userRouter.delete('/:id', isAuthenticated, new DeleteUserController().handle);
userRouter.get('/me', isAuthenticated, new DetailUserController().handle);


export { userRouter };