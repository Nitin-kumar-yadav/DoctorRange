import express from "express";
import { deletePatient, getAllPatient, patientDisease, registerPatient, updatePatient } from "../controllers/Patient.controller.js";
import upload from "../lib/upload.js";
import { employeeAuthMiddleware } from "../middleware/empolyee.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const patientRouter = express.Router();

//TODO: Arcjet protection for all patient routes
patientRouter.use(arcjetProtection)

//TODO: Patient registration and disease routes
patientRouter.get('/', employeeAuthMiddleware, getAllPatient)
// patientRouter.post("/register", employeeAuthMiddleware, upload.single("patientProfilePicture"), registerPatient)
patientRouter.post('/disease', employeeAuthMiddleware, patientDisease)
patientRouter.patch('/update/:patientId', employeeAuthMiddleware, upload.single("patientProfilePicture"), updatePatient)
patientRouter.delete('/delete/:patientId', employeeAuthMiddleware, deletePatient)

export default patientRouter;
