import express from "express";
import { registerPatient } from "../controllers/Patient.controller.js";

const patientRouter = express.Router();

patientRouter.post("/register", registerPatient)




export default patientRouter;
