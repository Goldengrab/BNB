import { Router } from "express";
import { getAllLawyers, registerLawyer } from "../controllers/lawyerController.js";
import { registerClient } from "../controllers/clientController.js";

const router = Router();

// Lawyer routes
router.get("/lawyers", getAllLawyers);
router.post("/lawyers", registerLawyer);

// Client routes
router.post("/clients", registerClient);

export default router;
