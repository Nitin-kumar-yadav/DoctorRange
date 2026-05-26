import { generateTokenAndSetCookie } from "../lib/uitls.js"
import Hospitalinfo from "../models/hospital.model.js"
import bcryptjs from "bcryptjs"
import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"
import dotenv from "dotenv"
dotenv.config()


export const signupHospital = async (req, res) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    try {

        const { hospitalName, hospitalAddress, hospitalPhone, hospitalEmail, hospitalPassword } = req.body || {}
        const hospitalLogo = req.file

        const requiredFields = { hospitalName, hospitalAddress, hospitalPhone, hospitalEmail, hospitalPassword }
        const missingFields = Object.keys(requiredFields).filter(field => !requiredFields[field])
        if (!hospitalLogo) missingFields.push("hospitalLogo")

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `All fields are required. Missing fields: ${missingFields.join(", ")}`,
                error: `Missing fields: ${missingFields.join(", ")}`
            })
        }
        if (!/^\d{10}$/.test(hospitalPhone)) {
            return res.status(400).json({
                success: false,
                message: "Phone number must be 10 digits",
                error: "Phone number must be 10 digits"
            })
        }
        if (hospitalPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
                error: "Password must be at least 6 characters long"
            })
        }
        if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(hospitalEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address",
                error: "Invalid email address"
            })
        }
        const hospitalExist = await Hospitalinfo.findOne({ hospitalEmail })
        if (hospitalExist) {
            return res.status(400).json({
                success: false,
                message: "Hospital already exists",
                error: "Hospital already exists"
            })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(hospitalPassword, salt)
        const result = await cloudinary.uploader.upload(hospitalLogo.path, {
            folder: "DoctorsRange",
            resource_type: "auto",
        })

        // Remove the temp file from local uploads folder
        fs.unlinkSync(hospitalLogo.path)

        await Hospitalinfo.create({ hospitalName, hospitalAddress, hospitalPhone, hospitalEmail, hospitalLogo: result.secure_url, hospitalPassword: hashedPassword })

        return res.status(201).json({
            success: true,
            message: "Hospital signup successful",
        })

    } catch (error) {
        console.error("Error in signupHospital:", error);
        return res.status(500).json({
            success: false,
            message: "Hospital Signup failed",
            error: error.message
        })
    }
}

export const loginHospital = async (req, res) => {
    try {
        const { hospitalEmail, hospitalPassword } = req.body || {}

        if (!hospitalEmail || !hospitalPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
                error: "Email and password are required"
            })
        }

        const hospitalExist = await Hospitalinfo.findOne({ hospitalEmail })
        if (!hospitalExist) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
                error: "Invalid email or password"
            })
        }
        const passwordMatch = await bcryptjs.compare(hospitalPassword, hospitalExist.hospitalPassword)
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
                error: "Invalid email or password"
            })
        }
        const token = generateTokenAndSetCookie(hospitalExist._id, res);
        if (!token) {
            return res.status(500).json({
                message: "Error while generating token",
                success: false,
                error: "Error while generating token",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Hospital login successful",
            hospital: {
                id: hospitalExist._id,
                hospitalName: hospitalExist.hospitalName,
                hospitalAddress: hospitalExist.hospitalAddress,
                hospitalPhone: hospitalExist.hospitalPhone,
                hospitalEmail: hospitalExist.hospitalEmail,
                hospitalLogo: hospitalExist.hospitalLogo,
            }
        })
    } catch (error) {
        console.error("Error in loginHospital:", error);
        return res.status(500).json({
            success: false,
            message: "Hospital Login failed",
            error: error.message
        })
    }
}

export const updateHospital = async (req, res) => {
    try {
        const { hospitalName, hospitalAddress, hospitalPhone } = req.body || {};
        const id = req.user?._id;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Hospital ID is required",
                error: "Hospital not found"
            });
        }

        const updateFields = {};
        if (hospitalName) updateFields.hospitalName = hospitalName;
        if (hospitalAddress) updateFields.hospitalAddress = hospitalAddress;
        if (hospitalPhone) {
            if (!/^\d{10}$/.test(hospitalPhone)) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number must be 10 digits",
                    error: "Phone number must be 10 digits"
                });
            }
            updateFields.hospitalPhone = hospitalPhone;
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields to update",
                error: "Provide at least one field to update: hospitalName, hospitalAddress, or hospitalPhone"
            });
        }

        const updatedHospital = await Hospitalinfo.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select("-hospitalPassword");

        if (!updatedHospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital not found",
                error: "No hospital found with the given ID"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Hospital updated successfully",
            hospital: updatedHospital
        });

    } catch (error) {
        console.error("Error in updateHospital:", error);
        return res.status(500).json({
            success: false,
            message: "Hospital update failed",
            error: error.message
        });
    }
}