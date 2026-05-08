import express from "express";
import { employeeLogin, employeeSignup } from "../controllers/Employee.controller.js";
import upload from "../lib/upload.js";

const routerEmployee = express.Router();

routerEmployee.post("/signup", upload.single("profilePicture"), employeeSignup);

routerEmployee.post("/login", upload.none(), employeeLogin);

export default routerEmployee;