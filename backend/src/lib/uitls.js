import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

export const generateTokenAndSetCookie = (id, res) => {
    try {
        const token = jwt.sign({ id }, process.env.JWT_TOKEN, { expiresIn: "1d" });
        if (!token) {
            return null;
        }
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: "strict"
        });
        return token;
    } catch (error) {
        console.error("Error generating token:", error.message);
        return null;
    }
}
