import { Router } from "express";
import { CreateProviderController } from "../../controllers/provider/CreateProvider.controller";
import { ListProviderController } from "../../controllers/provider/ListProvider.controller";
import { GetProviderByIdController } from "../../controllers/provider/IdProvider.controller";
import { UpdateProviderController } from "../../controllers/provider/UpdateProvider.controller";
import { DeleteProviderController } from "../../controllers/provider/DeleteProvider.controller";
import { ViewProviderPhotoController } from "../../controllers/provider/ViewProviderPhoto.controller";
import { AddProviderPhotoController } from "../../controllers/provider/AddProviderPhoto.controller";
import { DeleteProviderPhotoController } from "../../controllers/provider/DeleteProviderPhoto.controller";
import { uploadMiddleware } from "../../middlewares/upload.middleware";

const providerRouter = Router();

// Rotas para prestadores
providerRouter.post("/", new CreateProviderController().handle);
providerRouter.get("/", new ListProviderController().handle);
providerRouter.get("/:id", new GetProviderByIdController().handle);
providerRouter.put("/:id", new UpdateProviderController().handle);
providerRouter.delete("/:id", new DeleteProviderController().handle);

// Rotas para foto do prestador usando uploadMiddleware
providerRouter.post("/:id/photo", uploadMiddleware, new AddProviderPhotoController().handle);
providerRouter.get("/:id/photo", new ViewProviderPhotoController().handle);
providerRouter.delete("/:id/photo", new DeleteProviderPhotoController().handle);

export { providerRouter };