import { Router } from "express";
import { getAllLawyers, getLawyerById, registerLawyer, updateLawyerProfile, deleteLawyer, updateLawyerVerification, verifyDigiLocker } from "../controllers/lawyerController.js";
import { getAllClients, registerClient, getClientById, updateClientProfile, deleteClient } from "../controllers/clientController.js";
import { loginUser } from "../controllers/authController.js";

const router = Router();

// Auth routes
router.post("/login", loginUser);

// Lawyer routes
router.get("/lawyers", getAllLawyers);
router.post("/lawyers", registerLawyer);
router.get("/lawyers/:id", getLawyerById);
router.put("/lawyers/:id", updateLawyerProfile);
router.delete("/lawyers/:id", deleteLawyer);

// Client routes
router.get("/clients", getAllClients);
router.post("/clients", registerClient);
router.get("/clients/:id", getClientById);
router.put("/clients/:id", updateClientProfile);
router.delete("/clients/:id", deleteClient);

// Admin routes (lawyer verification update)
router.patch("/lawyers/:id/verify", updateLawyerVerification);

// Mock DigiLocker Route
router.post("/digilocker/verify", verifyDigiLocker);

export default router;
