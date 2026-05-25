import express from "express";
import { loginHospital, signupHospital, updateHospital } from "../controllers/Hospital.controller.js";
import upload from "../lib/upload.js";
import { hospitalAuthMiddleware } from "../middleware/hospital.middleware.js";
import { arcjetProtection } from "../middleware/archjet.middleware.js";

const routerHospital = express.Router();

//TODO: Arcjet protection for all hospital routes
routerHospital.use(arcjetProtection)

//TODO: Create Hospital route
routerHospital.post("/signup", upload.single("hospitalLogo"), signupHospital);
routerHospital.post("/login", loginHospital);

//TODO: Update Hospital route
routerHospital.patch("/update/:id", hospitalAuthMiddleware, updateHospital);

export default routerHospital;
