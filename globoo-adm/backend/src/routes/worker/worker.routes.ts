import { Router } from "express";
import { CreateWorkerController } from "../../controllers/worker/CreateWorker.controller";
import { ListWorkerController } from "../../controllers/worker/ListWorker.controller";
import { GetWorkerController } from "../../controllers/worker/IdWorker.controller";
import { UpdateWorkerController } from "../../controllers/worker/UpdateWorker.controller";
import { DeleteWorkerController } from "../../controllers/worker/DeleteWorker.controller";

const workerRouter = Router();

// Rotas para Workers
workerRouter.post("/", new CreateWorkerController().handle);
workerRouter.get("/", new ListWorkerController().handle);
workerRouter.get("/:id", new GetWorkerController().handle);
workerRouter.put("/:id", new UpdateWorkerController().handle);
workerRouter.delete("/:id", new DeleteWorkerController().handle);

export { workerRouter };