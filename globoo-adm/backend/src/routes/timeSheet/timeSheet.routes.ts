import { Router } from "express";
import { CreateTimeSheetController } from "../../controllers/timeSheet/CreateTimeSheet.controller";
import { ListTimeSheetController } from "../../controllers/timeSheet/ListTimeSheet.controller";
import { GetTimeSheetController } from "../../controllers/timeSheet/IdTimeSheet.controller";
import { UpdateTimeSheetController } from "../../controllers/timeSheet/UpdateTimeSheet.controller";
import { DeleteTimeSheetController } from "../../controllers/timeSheet/DeleteTimeSheet.controller";

const timeSheetRouter = Router();

// Rotas para registros de ponto 
timeSheetRouter.post("/", new CreateTimeSheetController().handle);
timeSheetRouter.get("/", new ListTimeSheetController().handle);
timeSheetRouter.get("/:id", new GetTimeSheetController().handle);
timeSheetRouter.put("/:id", new UpdateTimeSheetController().handle);
timeSheetRouter.delete("/:id", new DeleteTimeSheetController().handle);

export { timeSheetRouter };