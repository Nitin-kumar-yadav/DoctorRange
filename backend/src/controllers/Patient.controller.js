import Employeesinfo from "../models/employees.model.js";
import Hospitalinfo from "../models/hospital.model.js";
import Patientinfo from "../models/patient.model.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


export const registerPatient = async (req, res) => {

    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error while connecting to cloudinary",
            success: false,
            error: error.message,
        });
    }

    try {
        const { hospitalId, patientName, patientAge, patientEmail, patientPhone, patientAddress, patientGender, patientBloodGroup, patientAllergies, patientMedications, patientStatus } = req.body || {};

        // req.user is set by employeeAuthMiddleware
        const hospitalEmployeeId = req.user?._id;
        if (!hospitalEmployeeId) {
            return res.status(401).json({
                message: "Unauthorized access",
                success: false,
                error: "You are not authorized to perform this action"
            });
        }

        // Validate required fields
        if (!hospitalId || !patientName || !patientAge || !patientPhone || !patientAddress || !patientGender) {
            // Clean up uploaded file
            if (req.file?.path) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                message: "Required fields are missing",
                success: false,
                error: "hospitalId, patientName, patientAge, patientPhone, patientAddress, and patientGender are required"
            });
        }

        const employeeData = await Employeesinfo.findById(hospitalEmployeeId);

        if (!employeeData) {
            if (req.file?.path) fs.unlinkSync(req.file.path);
            return res.status(404).json({
                message: "Employee not found",
                success: false,
                error: "Employee not found"
            });
        }

        const isPatientExist = await Patientinfo.findOne({ patientPhone });

        if (isPatientExist) {
            if (req.file?.path) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                message: "Patient already exists",
                success: false,
                error: "A patient with this phone number already exists"
            });
        }

        const isHospitalExist = await Hospitalinfo.findById(hospitalId);

        if (!isHospitalExist) {
            if (req.file?.path) fs.unlinkSync(req.file.path);
            return res.status(404).json({
                message: "Hospital not found",
                success: false,
                error: "Hospital not found"
            });
        }

        // Verify employee belongs to this hospital
        if (employeeData.hospitalId?.toString() !== hospitalId) {
            if (req.file?.path) fs.unlinkSync(req.file.path);
            return res.status(403).json({
                message: "You are not authorized to register patients for this hospital",
                success: false,
                error: "Employee does not belong to this hospital"
            });
        }

        // Handle profile picture upload
        let patientProfilePicture = "";
        if (req.file) {
            const cloudinaryUpload = await cloudinary.uploader.upload(req.file.path, {
                folder: "DoctorsRange",
                resource_type: "auto",
            });
            fs.unlinkSync(req.file.path);
            patientProfilePicture = cloudinaryUpload.secure_url;
        }

        const patient = new Patientinfo({
            hospitalId: isHospitalExist._id,
            hospitalEmployeeId: employeeData._id,
            patientName,
            patientAge,
            patientEmail,
            patientPhone,
            patientAddress,
            patientGender,
            patientBloodGroup,
            patientAllergies,
            patientMedications,
            patientProfilePicture,
            patientStatus,
            patientAdmittedBy: employeeData._id,
        });
        if (patient.patientStatus === "admitted") {
            patient.patientAdmittedAt = Date.now();
        }
        await patient.save();

        return res.status(201).json({
            message: "Patient registered successfully",
            success: true,
            patient
        });

    } catch (error) {
        // Clean up uploaded file on any error
        if (req.file?.path) {
            try { fs.unlinkSync(req.file.path); } catch (_) { /* file may already be deleted */ }
        }
        console.error("Patient registration error:", error);
        return res.status(500).json({
            message: "An error occurred while registering the patient",
            success: false,
            error: error.message
        });
    }
}