import express from "express";
import { loginHospital, signupHospital, updateHospital } from "../controllers/Hospital.controller.js";
import upload from "../lib/upload.js";
// import { authMiddleware } from "../middlewares/auth.js";

const routerHospital = express.Router();

//TODO: Create Hospital route
routerHospital.post("/signup", upload.single("hospitalLogo"), signupHospital);
routerHospital.post("/login", loginHospital);

//TODO: Update Hospital route

routerHospital.patch("/update/:id", updateHospital);

export default routerHospital;