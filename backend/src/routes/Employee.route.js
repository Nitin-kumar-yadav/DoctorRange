import express from "express";
import {
  employeeLogin,
  employeeSignup,
} from "../controllers/Employee.controller.js";
import upload from "../lib/upload.js";
import { upDateEmployeeProfile } from "../controllers/EmployeeEdit.controller.js";
import { employeeAuthMiddleware } from "../middleware/empolyee.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const routerEmployee = express.Router();


routerEmployee.post("/login", employeeLogin);

//TODO: Arcjet protection for all employee routes
routerEmployee.use(arcjetProtection)

//TODO: Employee Signup and Login routes
routerEmployee.post(
  "/signup",
  upload.single("employeeProfilePicture"),
  employeeSignup
);


//TODO: Empolyee edit profile route
routerEmployee.put(
  "/edit-profile",
  upload.single("employeeProfilePicture"),
  employeeAuthMiddleware,
  upDateEmployeeProfile
);

export default routerEmployee;
