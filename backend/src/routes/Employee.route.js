import express from "express";
import { employeeLogin, employeeSignup } from "../controllers/Employee.controller.js";

const routerEmployee = express.Router();

routerEmployee.post("/signup", employeeSignup);
routerEmployee.post("/login", employeeLogin);

export default routerEmployee;