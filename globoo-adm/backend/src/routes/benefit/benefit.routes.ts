import { Router } from "express";
import { AddBenefitController } from "../../controllers/benefit/AddBenefit.controller";
import { ListBenefitController } from "../../controllers/benefit/ListBenefit.controller";
import { GetBenefitController } from "../../controllers/benefit/IdBenefit.controller";
import { UpdateBenefitController } from "../../controllers/benefit/UpdateBenefit.controller";
import { DeleteBenefitController } from "../../controllers/benefit/DeleteBenefit.controller";


const benefitRouter = Router();

// Benefit routes
benefitRouter.post("/:payslipId", new AddBenefitController().handle);
benefitRouter.get("/:payslipId", new ListBenefitController().handle);
benefitRouter.get("/detail/:id", new GetBenefitController().handle);
benefitRouter.put("/detail/:id", new UpdateBenefitController().handle);
benefitRouter.delete("/detail/:id", new DeleteBenefitController().handle);

export { benefitRouter };