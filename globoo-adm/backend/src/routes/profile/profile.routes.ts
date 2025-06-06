import { Router } from "express";
import { CreateProfileController } from "../../controllers/profile/CreateProfile.controller";
import { ListProfileController } from "../../controllers/profile/ListProfile.controller";
import { UpdateProfileController } from "../../controllers/profile/UpdateProfile.controller";
import { DeleteProfileController } from "../../controllers/profile/DeleteProfile.controller";

const profileRouter = Router();

// Rotas para perfis
profileRouter.post("/", new CreateProfileController().handle);
profileRouter.get("/", new ListProfileController().handle);
profileRouter.put("/:id", new UpdateProfileController().handle);
profileRouter.delete("/:id", new DeleteProfileController().handle);

export { profileRouter };