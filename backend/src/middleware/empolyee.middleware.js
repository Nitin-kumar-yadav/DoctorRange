import jwt from "jsonwebtoken"
import Employeesinfo from "../models/employees.model.js";

export const employeeAuthMiddleware = async (req, res, next) => {
    try {
        const token = req?.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                error: "No token provided"
            })
        }
        const decodedToken = jwt.verify(token, process.env.JWT_TOKEN)
        const employee = await Employeesinfo.findById(decodedToken?.id).select("-password")
        if (!employee) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                error: "Invalid token - employee not found"
            })
        }
        req.user = employee
        next()
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                error: "Invalid or expired token"
            })
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error in employeeAuthMiddleware",
            error: error.message
        })
    }
}