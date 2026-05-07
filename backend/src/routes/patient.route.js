import express from "express";
import { registerPatient } from "../controllers/Patient.controller.js";
import upload from "../lib/upload.js";

const patientRouter = express.Router();

patientRouter.post("/register", upload.single("profilePicture"), registerPatient)




export default patientRouter;
