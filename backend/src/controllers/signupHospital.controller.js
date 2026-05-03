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
        const hospitalExist = await Hospitalinfo.findOne({ hospitalEmail })
        if(hospitalExist){
            return res.status(400).json({
                success: false,
                message: "Hospital already exists",
                error: "Hospital already exists"
            })
        }

        const password = await bcryptjs.hash(hospitalPassword, 10)
        
        const hospitalSignup = await Hospitalinfo.create({ hospitalName, hospitalAddress, hospitalPhone, hospitalEmail, hospitalLogo, password }).select("-password")

        return res.status(201).json({
            success: true,
            message: "Hospital signup successful",
            hospitalSignup
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Hospital Signup failed",
            error: error.message
        })
    }
}