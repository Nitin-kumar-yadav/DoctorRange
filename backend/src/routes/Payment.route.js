import express from "express"
import { createPayment } from "../controllers/Payment.controller.js"
import { employeeAuthMiddleware } from "../middleware/empolyee.middleware.js"

const routerPayment = express.Router()

routerPayment.post('/create-payment', employeeAuthMiddleware, createPayment)

export default routerPayment