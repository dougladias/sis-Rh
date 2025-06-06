import { Router } from "express";
import { CreateDocumentController } from "../../controllers/document/CreateDocument.controller";
import { ListDocumentController } from "../../controllers/document/ListDocument.controller";
import { GetDocumentByIdController } from "../../controllers/document/IdDocument.controller";
import { UpdateDocumentController } from "../../controllers/document/UpdateDocument.controller";
import { DeleteDocumentController } from "../../controllers/document/DeleteDocument.controller";
import { ViewDocumentController } from "../../controllers/document/ViewDocument.controller";
import { uploadMiddleware } from "../../middlewares/upload.middleware";

const documentRouter = Router();

// Rotas para documentos
documentRouter.post("/", uploadMiddleware, new CreateDocumentController().handle);
documentRouter.get("/", new ListDocumentController().handle);
documentRouter.get("/:id", new GetDocumentByIdController().handle);
documentRouter.get("/:id/view", new ViewDocumentController().handle);
documentRouter.put("/:id", new UpdateDocumentController().handle);
documentRouter.delete("/:id", new DeleteDocumentController().handle);

export { documentRouter };