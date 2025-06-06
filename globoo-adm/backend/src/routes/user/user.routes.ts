import { Router } from "express";
import { ListUserController } from '../../controllers/user/ListUser.controller';
import { CreateUserController } from "../../controllers/user/CreateUser.controller";
import { UpdateUserController } from '../../controllers/user/UpdateUser.controller';
import { DeleteUserController } from '../../controllers/user/DeleteUser.controller';


const userRouter = Router();

// Rotas para o usuário
userRouter.get('/', new ListUserController().handle);
userRouter.post('/', new CreateUserController().handle);
userRouter.put('/:id', new UpdateUserController().handle);
userRouter.delete('/:id', new DeleteUserController().handle);


export { userRouter };