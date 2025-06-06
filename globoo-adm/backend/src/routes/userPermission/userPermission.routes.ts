import { Router } from "express";
import { CreateUserPermissionController } from "../../controllers/userPermission/CreateUserPermission.controller";
import { ListUserPermissionController } from "../../controllers/userPermission/ListUserPermission.controller";
import { UpdateUserPermissionController } from "../../controllers/userPermission/UpdateUserPermission.controller";
import { DeleteUserPermissionController } from "../../controllers/userPermission/DeleteUserPermission.controller";

const userPermissionRouter = Router();

// Rotas para permissões de usuário
userPermissionRouter.post("/", new CreateUserPermissionController().handle);
userPermissionRouter.get("/", new ListUserPermissionController().handle);
userPermissionRouter.put("/:id", new UpdateUserPermissionController().handle);
userPermissionRouter.delete("/:id", new DeleteUserPermissionController().handle);

export { userPermissionRouter };