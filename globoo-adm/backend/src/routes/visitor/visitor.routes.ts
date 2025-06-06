import { Router } from "express";
import { CreateVisitorController } from "../../controllers/visitor/CreateVisitor.controller";
import { ListVisitorController } from "../../controllers/visitor/ListVisitor.controller";
import { GetVisitorByIdController } from "../../controllers/visitor/IdVisitor.controller";
import { UpdateVisitorController } from "../../controllers/visitor/UpdateVisitor.controller";
import { DeleteVisitorController } from "../../controllers/visitor/DeleteVisitor.controller";
import { ViewVisitorPhotoController } from "../../controllers/visitor/ViewVisitorPhoto.controller";
import { AddVisitorPhotoController } from "../../controllers/visitor/AddVisitorPhoto.controller";
import { DeleteVisitorPhotoController } from "../../controllers/visitor/DeleteVisitorPhoto.controller";
import { uploadMiddleware } from "../../middlewares/upload.middleware";


const visitorRouter = Router();

// Rotas para visitantes
visitorRouter.post("/", new CreateVisitorController().handle);
visitorRouter.get("/", new ListVisitorController().handle);
visitorRouter.get("/:id", new GetVisitorByIdController().handle);
visitorRouter.put("/:id", new UpdateVisitorController().handle);
visitorRouter.delete("/:id", new DeleteVisitorController().handle);

// Rotas para foto do visitante usando uploadMiddleware
visitorRouter.post("/:id/photo", uploadMiddleware, new AddVisitorPhotoController().handle);
visitorRouter.get("/:id/photo", new ViewVisitorPhotoController().handle);
visitorRouter.delete("/:id/photo", new DeleteVisitorPhotoController().handle);

export { visitorRouter };