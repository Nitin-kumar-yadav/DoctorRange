import express from "express";
import { loginHospital, signupHospital } from "../controllers/Hospital.controller.js";
import upload from "../lib/upload.js";

const routerHospital = express.Router();

routerHospital.post("/signup", upload.single("hospitalLogo"), signupHospital);
routerHospital.post("/login", loginHospital);

export default routerHospital;