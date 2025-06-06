import { Router } from "express";
import { CreateInvoiceController } from "../../controllers/invoice/CreateInvoice.controller";
import { ListInvoiceController } from "../../controllers/invoice/ListInvoice.controller";
import { GetInvoiceByIdController } from "../../controllers/invoice/IdInvoice.controller";
import { UpdateInvoiceController } from "../../controllers/invoice/UpdateInvoice.controller";
import { DeleteInvoiceController } from "../../controllers/invoice/DeleteInvoice.controller";
import { ViewInvoiceAttachmentController } from "../../controllers/invoice/ViewInvoiceAttachment.controller";
import { AddInvoiceAttachmentController } from "../../controllers/invoice/AddInvoiceAttachment.controller";
import { DeleteInvoiceAttachmentController } from "../../controllers/invoice/DeleteInvoiceAttachment.controller";
import { uploadMiddleware } from "../../middlewares/upload.middleware";

const invoiceRouter = Router();

// Rotas para faturas/notas fiscais
invoiceRouter.post("/", new CreateInvoiceController().handle);
invoiceRouter.get("/", new ListInvoiceController().handle);
invoiceRouter.get("/:id", new GetInvoiceByIdController().handle);
invoiceRouter.put("/:id", new UpdateInvoiceController().handle);
invoiceRouter.delete("/:id", new DeleteInvoiceController().handle);

// Rotas para anexos de faturas
invoiceRouter.post("/:invoiceId/attachments", uploadMiddleware, new AddInvoiceAttachmentController().handle);
invoiceRouter.get("/:invoiceId/attachments/:attachmentId/view", new ViewInvoiceAttachmentController().handle);
invoiceRouter.delete("/:invoiceId/attachments/:attachmentId", new DeleteInvoiceAttachmentController().handle);

export { invoiceRouter };