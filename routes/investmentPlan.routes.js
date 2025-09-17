import express from "express";
import {
  createInvestmentPlan,
  getInvestmentPlans,
  getInvestmentPlanById,
  updateInvestmentPlan,
  deleteInvestmentPlan,
} from "../controllers/investmentPlan.controller.js";
import authenticate from "../utils/authenticate.js";
import authorize from "../utils/authorize.js";

const router = express.Router();

router.post("/", authenticate, authorize("admin"), createInvestmentPlan);
router.get("/", authenticate, getInvestmentPlans);        
router.get("/:id", authenticate, authorize("admin"), getInvestmentPlanById);      
router.put("/:id", authenticate, authorize("admin"), updateInvestmentPlan);
router.delete("/:id", authenticate, authorize("admin"), deleteInvestmentPlan);

export default router;
