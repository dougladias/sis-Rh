import { Router } from "express";

// Controllers para holerites
import { CreatePayslipController } from "../../controllers/payslip/CreatePayslip.controller";
import { ListPayslipController } from "../../controllers/payslip/ListPayslip.controller";
import { GetPayslipController } from "../../controllers/payslip/IdPayslip.controller";
import { UpdatePayslipController } from "../../controllers/payslip/UpdatePayslip.controller";
import { DeletePayslipController } from "../../controllers/payslip/DeletePayslip.controller";

// Controllers para PDF
import { GeneratePayslipPDFController, ViewPayslipPDFController } from "../../controllers/payslip/ViewPayslipPDF.controller";

// Controllers para Deduções
import { AddDeductionController } from "../../controllers/deduction/AddDeduction.controller";
import { ListDeductionController } from "../../controllers/deduction/ListDeduction.controller";
import { GetDeductionController } from "../../controllers/deduction/IdDeduction.controller";
import { UpdateDeductionController } from "../../controllers/deduction/UpdateDeduction.controller";
import { DeleteDeductionController } from "../../controllers/deduction/DeleteDeduction.controller";

// Controllers para Benefícios
import { AddBenefitController } from "../../controllers/benefit/AddBenefit.controller";
import { ListBenefitController } from "../../controllers/benefit/ListBenefit.controller";
import { GetBenefitController } from "../../controllers/benefit/IdBenefit.controller";
import { UpdateBenefitController } from "../../controllers/benefit/UpdateBenefit.controller";
import { DeleteBenefitController } from "../../controllers/benefit/DeleteBenefit.controller";


const payslipRouter = Router();

// Rotas para holerites
payslipRouter.post("/", new CreatePayslipController().handle);
payslipRouter.get("/", new ListPayslipController().handle);
payslipRouter.get("/:id", new GetPayslipController().handle);
payslipRouter.put("/:id", new UpdatePayslipController().handle);
payslipRouter.delete("/:id", new DeletePayslipController().handle);

// Rotas para PDF 
payslipRouter.get("/:id/pdf", new ViewPayslipPDFController().handle);
payslipRouter.get("/:id/download", new GeneratePayslipPDFController().handle);

// Rotas para deduções
payslipRouter.post("/:payslipId/deductions", new AddDeductionController().handle);
payslipRouter.get("/:payslipId/deductions", new ListDeductionController().handle);
payslipRouter.get("/deductions/:id", new GetDeductionController().handle);
payslipRouter.put("/deductions/:id", new UpdateDeductionController().handle);
payslipRouter.delete("/deductions/:id", new DeleteDeductionController().handle);


// Rotas para benefícios
payslipRouter.post("/:payslipId/benefits", new AddBenefitController().handle);
payslipRouter.get("/:payslipId/benefits", new ListBenefitController().handle);
payslipRouter.get("/benefits/:id", new GetBenefitController().handle);
payslipRouter.put("/benefits/:id", new UpdateBenefitController().handle);
payslipRouter.delete("/benefits/:id", new DeleteBenefitController().handle);

export { payslipRouter };