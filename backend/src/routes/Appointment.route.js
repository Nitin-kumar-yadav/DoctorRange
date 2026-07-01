import express from "express"
import { employeeAuthMiddleware } from "../middleware/empolyee.middleware.js"
import { createAppointment } from "../controllers/Appointment.controller.js"
const routerAppointment = express.Router();

//TODO: create appointment route for hospital
routerAppointment.post("/create", employeeAuthMiddleware, createAppointment)

export default routerAppointment
