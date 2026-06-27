import { Router } from "express";
import { getAllLawyers, getLawyerById, registerLawyer, deleteLawyer } from "../controllers/lawyerController.js";
import { registerClient, getClientById, deleteClient } from "../controllers/clientController.js";
import { loginUser } from "../controllers/authController.js";

const router = Router();

// Auth routes
router.post("/login", loginUser);

// Lawyer routes
router.get("/lawyers", getAllLawyers);
router.post("/lawyers", registerLawyer);
router.get("/lawyers/:id", getLawyerById);
router.delete("/lawyers/:id", deleteLawyer);

// Client routes
router.post("/clients", registerClient);
router.get("/clients/:id", getClientById);
router.delete("/clients/:id", deleteClient);

export default router;
