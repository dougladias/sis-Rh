import { Router } from "express";
import { CreateTemplateController } from "../../controllers/template/CreateTemplate.controller";
import { ListTemplateController } from "../../controllers/template/ListTemplate.controller";
import { GetTemplateByIdController } from "../../controllers/template/IdTemplate.controller";
import { UpdateTemplateController } from "../../controllers/template/UpdateTemplate.controller";
import { DeleteTemplateController } from "../../controllers/template/DeleteTemplate.controller";
import { ViewTemplateController } from "../../controllers/template/ViewTemplate.controller";
import { uploadMiddleware } from "../../middlewares/upload.middleware";

const templateRouter = Router();

// Rotas para templates
templateRouter.post("/", uploadMiddleware, new CreateTemplateController().handle);
templateRouter.get("/", new ListTemplateController().handle);
templateRouter.get("/:id", new GetTemplateByIdController().handle);
templateRouter.get("/:id/view", new ViewTemplateController().handle);
templateRouter.put("/:id", uploadMiddleware, new UpdateTemplateController().handle);
templateRouter.delete("/:id", new DeleteTemplateController().handle);

export { templateRouter };