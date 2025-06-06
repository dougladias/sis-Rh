import { Router } from "express";
import { CreatePayrollController } from "../../controllers/payroll/CreatePayroll.controller";
import { ListPayrollController } from "../../controllers/payroll/ListPayroll.controller";
import { GetPayrollController } from "../../controllers/payroll/IdPayroll.controller";
import { UpdatePayrollController } from "../../controllers/payroll/UpdatePayroll.controller";
import { DeletePayrollController } from "../../controllers/payroll/DeletePayroll.controller";
import { ProcessPayrollController } from "../../controllers/payroll/ProcessPayroll.controller";

const payrollRouter = Router();

// Rotas para folha de pagamento
payrollRouter.post("/", new CreatePayrollController().handle);
payrollRouter.get("/", new ListPayrollController().handle);
payrollRouter.get("/:id", new GetPayrollController().handle);
payrollRouter.put("/:id", new UpdatePayrollController().handle);
payrollRouter.delete("/:id", new DeletePayrollController().handle);

// Rota de processamento
payrollRouter.post("/:id/process", new ProcessPayrollController().handle);

export { payrollRouter };