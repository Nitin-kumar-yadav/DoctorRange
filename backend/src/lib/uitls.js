import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

export const generateTokenAndSetCookie = (id, res) => {
    try {
        const token = jwt.sign({ id }, process.env.JWT_TOKEN, { expiresIn: "1d" });
        if (!token) {
            return res.status(400).json({
                message: "Error while generating token",
                success: false,
                error: "Error while generating token",
            });
        }
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: "strict"
        });
        return token
    } catch (error) {
        return res.status(500).json({
            message: "Error while tokenGenerator",
            success: false,
            error: error.message,
        });
    }
}
