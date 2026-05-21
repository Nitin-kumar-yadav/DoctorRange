import express from "express";
import {
  employeeLogin,
  employeeSignup,
} from "../controllers/Employee.controller.js";
import upload from "../lib/upload.js";
import { upDateEmployeeProfile } from "../controllers/EmployeeEdit.controller.js";
import { employeeAuthMiddleware } from "../middleware/empolyee.middleware.js";

const routerEmployee = express.Router();

//TODO: Employee Signup and Login routes
routerEmployee.post(
  "/signup",
  upload.single("employeeProfilePicture"),
  employeeSignup
);
routerEmployee.post("/login", employeeLogin);

//TODO: Empolyee edit profile route
routerEmployee.put(
  "/edit-profile",
  upload.single("employeeProfilePicture"),
  employeeAuthMiddleware,
  upDateEmployeeProfile
);

export default routerEmployee;
