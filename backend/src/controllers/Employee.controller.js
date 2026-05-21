import bcrypt from "bcryptjs";
import fs from "fs";
import Employeesinfo from "../models/employees.model.js";
import { generateTokenAndSetCookie } from "../lib/uitls.js";
import Hospitalinfo from "../models/hospital.model.js";
import { v2 as cloudinary } from "cloudinary";

export const employeeSignup = async (req, res) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
        const { fullName, phoneNumber, qualification, status, email, password, role, hospitalId } = req.body || {};

        if (!fullName || !phoneNumber || !qualification || !status || !email || !password || !role || !hospitalId) {
            return res.status(400).json({
                message: "All fields are required",
                success: false,
                error: "All fields are required",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Profile picture is required",
                success: false,
                error: "Profile picture is required",
            });
        }

        const checkHospital = await Hospitalinfo.findById(hospitalId);
        if (!checkHospital) {
            // Clean up uploaded file since we won't need it
            if (req.file?.path) fs.unlinkSync(req.file.path);
            return res.status(404).json({
                message: "Hospital not found",
                success: false,
                error: "Hospital not found",
            });
        }

        let employee = await Employeesinfo.findOne({ email });
        if (employee) {
            // Clean up uploaded file since we won't need it
            if (req.file?.path) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                message: "Employee already exists",
                success: false,
                error: "Employee already exists",
            });
        }

        // Upload to cloudinary first, before creating DB record
        const cloudinaryUpload = await cloudinary.uploader.upload(req.file.path, {
            folder: "DoctorsRange",
            resource_type: "auto",
        })

        // Remove the temp file from local uploads folder
        fs.unlinkSync(req.file.path)

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        employee = await Employeesinfo.create({
            fullName,
            phoneNumber,
            qualification,
            employeeProfilePicture: cloudinaryUpload.secure_url,
            status,
            email,
            password: hashPassword,
            role,
            hospitalId
        });
        if (!employee) {
            return res.status(400).json({
                message: "Error while employeeSignup",
                success: false,
                error: "Error while employeeSignup",
            });
        }

        const token = generateTokenAndSetCookie(employee._id, res);
        if (!token) {
            return res.status(500).json({
                message: "Error while generating token",
                success: false,
                error: "Error while generating token",
            });
        }

        checkHospital.employees.push(employee._id);
        await checkHospital.save();

        return res.status(201).json({
            message: "Employee created successfully",
            success: true,
            employee: {
                id: employee._id,
                fullName: employee.fullName,
                phoneNumber: employee.phoneNumber,
                qualification: employee.qualification,
                employeeProfilePicture: employee.employeeProfilePicture,
                status: employee.status,
                email: employee.email,
                role: employee.role,
                hospitalId: employee.hospitalId,
            }
        });

    } catch (error) {
        // Clean up uploaded file on any error
        if (req.file?.path) {
            try { fs.unlinkSync(req.file.path); } catch (_) { /* file may already be deleted */ }
        }
        console.error("Error in employeeSignup:", error);
        return res.status(500).json({
            message: "Error while employeeSignup",
            success: false,
            error: error.message,
        });
    }
}

export const employeeLogin = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required",
                success: false,
                error: "Email and password are required",
            });
        }

        const employee = await Employeesinfo.findOne({ email });

        if (!employee) {
            return res.status(401).json({
                message: "Invalid credentials",
                success: false,
                error: "Invalid email",
            });
        }

        const passwordMatch = await bcrypt.compare(password, employee.password);
        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid credentials",
                success: false,
                error: "Invalid password",
            });
        }

        const token = generateTokenAndSetCookie(employee._id, res);
        if (!token) {
            return res.status(500).json({
                message: "Error while generating token",
                success: false,
                error: "Error while generating token",
            });
        }

        return res.status(200).json({
            message: "Employee login successful",
            success: true,
            employee: {
                id: employee._id,
                fullName: employee.fullName,
                phoneNumber: employee.phoneNumber,
                qualification: employee.qualification,
                employeeProfilePicture: employee.employeeProfilePicture,
                status: employee.status,
                email: employee.email,
                role: employee.role,
                hospitalId: employee.hospitalId,
            }
        });
    } catch (error) {
        console.error("Error in employeeLogin:", error);
        return res.status(500).json({
            message: "Error while employeeLogin",
            success: false,
            error: error.message,
        });
    }
}