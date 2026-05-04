import express from "express";
import { loginHospital, signupHospital } from "../controllers/Hospital.controller.js";

const routerHospital = express.Router();


routerHospital.post("/signup", signupHospital);
routerHospital.post("/login", loginHospital);

export default routerHospital;