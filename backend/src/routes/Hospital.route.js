import express from "express";
import { signupHospital } from "../controllers/signupHospital.controller.js";

const routerHospital = express.Router();


routerHospital.post("/signup", signupHospital);

export default routerHospital;