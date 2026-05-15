import express from "express";
import { patientDisease, registerPatient } from "../controllers/Patient.controller.js";
import upload from "../lib/upload.js";
import { employeeAuthMiddleware } from "../middleware/empolyee.middleware.js";

const patientRouter = express.Router();

patientRouter.post("/register", employeeAuthMiddleware, upload.single("patientProfilePicture"), registerPatient)
patientRouter.post('/disease', employeeAuthMiddleware, patientDisease)

export default patientRouter;
