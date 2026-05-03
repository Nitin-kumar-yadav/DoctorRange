import Hospitalinfo from "../models/hospital.model.js"
import bcryptjs from "bcryptjs"

export const signupHospital = async(req, res) => {
    try {

        const {hospitalName, hospitalAddress, hospitalPhone, hospitalEmail, hospitalLogo, hospitalPassword,} = req.body
        if(!hospitalName || !hospitalAddress || !hospitalPhone || !hospitalEmail || !hospitalLogo || !hospitalPassword){
            return res.status(400).json({
                success: false,
                message: "All fields are required",
                error: "All fields are required"
            })
        }
        if(hospitalPhone.length !== 10){
            return res.status(400).json({
                success: false,
                message: "Phone number must be 10 digits",
                error: "Phone number must be 10 digits"
            })
        }
        if(hospitalPassword.length < 6){
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
                error: "Password must be at least 6 characters long"
            })
        }
        if(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(hospitalEmail)){
            return res.status(400).json({
                success: false,
                message: "Invalid email address",
                error: "Invalid email address"
            })
        }

        const hospitalExist = await Hospitalinfo.findOne({ hospitalEmail })
        if(hospitalExist){
            return res.status(400).json({
                success: false,
                message: "Hospital already exists",
                error: "Hospital already exists"
            })
        }

        const salt = bcryptjs.genSalt(10)
        const password = await bcryptjs.hash(hospitalPassword, salt)
        
        const hospitalSignup = await Hospitalinfo.create({ hospitalName, hospitalAddress, hospitalPhone, hospitalEmail, hospitalLogo, password }).select("-password")

        return res.status(201).json({
            success: true,
            message: "Hospital signup successful",
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Hospital Signup failed",
            error: error.message
        })
    }
}