import express from "express";
import { loginHospital, signupHospital } from "../controllers/Hospital.controller.js";
import multer from "multer";
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
})
const upload = multer({ storage });
const routerHospital = express.Router();


routerHospital.post("/signup", upload.single("hospitalLogo"), signupHospital);
routerHospital.post("/login", loginHospital);

export default routerHospital;