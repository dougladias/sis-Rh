import { Router } from "express";
import { CreateUserPermissionController } from "../../controllers/permission/CreateUserPermission.controller";
import { GetUserPermissionsController } from "../../controllers/permission/GetUserPermissions.controller";
import { ListUserPermissionController } from "../../controllers/permission/ListUserPermission.controller";
import { UpdateUserPermissionController } from "../../controllers/permission/UpdateUserPermission.controller";
import { DeleteUserPermissionController } from "../../controllers/permission/DeleteUserPermission.controller";

const permissionRouter = Router();

// Define as rotas para gerenciar permissões de usuários
permissionRouter.get("/me", new GetUserPermissionsController().handle);
permissionRouter.get("/", new ListUserPermissionController().handle);
permissionRouter.post("/", new CreateUserPermissionController().handle);
permissionRouter.put("/:id", new UpdateUserPermissionController().handle);
permissionRouter.delete("/:id", new DeleteUserPermissionController().handle);

export { permissionRouter };