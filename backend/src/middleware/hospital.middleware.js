import jwt from "jsonwebtoken"
import Hospitalinfo from "../models/hospital.model.js"

export const hospitalAuthMiddleware = async (req, res, next) => {
    let decodedToken;
    try {
        const token = req?.cookies?.hospitalToken || req.header("Authorization").replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                error: "No token provided"
            })
        }
        decodedToken = jwt.verify(token, process.env.JWT_TOKEN)
        const hospital = await Hospitalinfo.findById(decodedToken?.id).select("-password")
        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital not found",
                error: "Hospital not found"
            })
        }
        req.hospital = hospital
        next()
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error in hospitalAuthMiddleware",
            error: error.message
        })
    }
}