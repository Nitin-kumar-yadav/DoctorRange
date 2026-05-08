import jwt from "jsonwebtoken"
import Hospitalinfo from "../models/hospital.model.js"

export const hospitalAuthMiddleware = async (req, res, next) => {
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
        const hospital = await Hospitalinfo.findById(decodedToken?.id).select("-hospitalPassword")
        if (!hospital) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                error: "Invalid token - hospital not found"
            })
        }
        req.user = hospital
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
            message: "Internal server error in hospitalAuthMiddleware",
            error: error.message
        })
    }
}