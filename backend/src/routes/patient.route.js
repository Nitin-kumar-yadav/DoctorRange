import express from "express";
import { patientDisease, registerPatient } from "../controllers/Patient.controller.js";
import upload from "../lib/upload.js";
import { employeeAuthMiddleware } from "../middleware/empolyee.middleware.js";
import { arcjetProtection } from "../middleware/archjet.middleware.js";

const patientRouter = express.Router();

//TODO: Arcjet protection for all patient routes
patientRouter.use(arcjetProtection)

//TODO: Patient registration and disease routes
patientRouter.post("/register", employeeAuthMiddleware, upload.single("patientProfilePicture"), registerPatient)
patientRouter.post('/disease', employeeAuthMiddleware, patientDisease)

export default patientRouter;
