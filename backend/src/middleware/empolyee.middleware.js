import jwt from "jsonwebtoken"
import Employeesinfo from "../models/employees.model.js";

export const employeeAuthMiddleware = async (req, res, next) => {
    let decodedToken;
    try {
        const token = req?.cookies?.employeeToken || req.header("Authorization").replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                error: "No token provided"
            })
        }
        decodedToken = jwt.verify(token, process.env.JWT_TOKEN)
        const employee = await Employeesinfo.findById(decodedToken?.id).select("-password")
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
                error: "Employee not found"
            })
        }
        req.employee = employee
        next()
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error in employeeAuthMiddleware",
            error: error.message
        })
    }
}