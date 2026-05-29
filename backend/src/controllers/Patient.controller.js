import Employeesinfo from "../models/employees.model.js";
import Hospitalinfo from "../models/hospital.model.js";
import Patientinfo from "../models/patient.model.js";
import PatientDisease from "../models/patientDisease.model.js";
import PatientPrevHis from "../models/patientPrevHis.model.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


export const registerPatient = async (req, res) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
        const { hospitalId, patientName, patientAge, patientEmail, patientPhone, patientAddress, patientGender, patientBloodGroup, patientAllergies, patientMedications, patientStatus } = req.body || {};


        const hospitalEmployeeId = req.user?._id;
        if (!hospitalEmployeeId) {
            return res.status(401).json({
                message: "Unauthorized access",
                success: false,
                error: "You are not authorized to perform this action"
            });
        }


        if (!hospitalId || !patientName || !patientAge || !patientPhone || !patientAddress || !patientGender) {
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

        if (employeeData.hospitalId?.toString() !== hospitalId) {
            if (req.file?.path) fs.unlinkSync(req.file.path);
            return res.status(403).json({
                message: "You are not authorized to register patients for this hospital",
                success: false,
                error: "Employee does not belong to this hospital"
            });
        }

        let patientProfilePicture = "";
        let cloudinaryPublicId = null;
        if (req.file) {
            const cloudinaryUpload = await cloudinary.uploader.upload(req.file.path, {
                folder: "DoctorsRange",
                resource_type: "auto",
            });
            fs.unlinkSync(req.file.path);
            patientProfilePicture = cloudinaryUpload.secure_url;
            cloudinaryPublicId = cloudinaryUpload.public_id;
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
        try {
            await patient.save();
        } catch (saveError) {
            if (cloudinaryPublicId) {
                await cloudinary.uploader.destroy(cloudinaryPublicId).catch(() => { });
            }
            throw saveError;
        }

        return res.status(201).json({
            message: "Patient registered successfully",
            success: true,
            patient
        });

    } catch (error) {
        if (req.file?.path) {
            try { fs.unlinkSync(req.file.path); } catch (_) { }
        }
        console.error("Patient registration error:", error);
        return res.status(500).json({
            message: "An error occurred while registering the patient",
            success: false,
            error: "Internal server error"
        });
    }
}

export const patientDisease = async (req, res) => {
    try {
        const { diseaseName, diagnosisMedicines, patientId } = req.body || {};
        const employeeId = req.user?._id;

        const isInvalid = (val) => !val || (Array.isArray(val) && val.length === 0);

        if (isInvalid(diseaseName) || isInvalid(diagnosisMedicines) || !patientId) {
            let errorDetail = "Required fields are missing";
            if (isInvalid(diseaseName)) errorDetail = "diseaseName is required";
            else if (isInvalid(diagnosisMedicines)) errorDetail = "diagnosisMedicines is required";
            else if (!patientId) errorDetail = "patientId is required";

            return res.status(400).json({
                message: "Required fields are missing",
                success: false,
                error: errorDetail
            });
        }

        const employeeData = await Employeesinfo.findById(employeeId);
        if (!employeeData) {
            return res.status(404).json({
                message: "Employee not found",
                success: false,
                error: "Employee not found"
            });
        }

        const patientData = await Patientinfo.findById(patientId);
        if (!patientData) {
            return res.status(404).json({
                message: "Patient not found",
                success: false,
                error: "Patient not found"
            });
        }

        const disease = await PatientDisease.create({
            patientId: patientData._id,
            diseaseName: Array.isArray(diseaseName) ? diseaseName : [diseaseName],
            diagnosisMedicines: Array.isArray(diagnosisMedicines) ? diagnosisMedicines : [diagnosisMedicines],
        });

        await PatientPrevHis.create({
            patientDiseaseId: disease._id,
            hospitalId: employeeData.hospitalId,
        });
        return res.status(201).json({
            message: "Patient disease updated successfully",
            success: true,
            disease
        });

    } catch (error) {
        console.error("Patient disease error:", error);
        return res.status(500).json({
            message: "An error occurred while updating patient disease",
            success: false,
            error: "Internal server error"
        });
    }
};

export const updatePatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { patientName, patientAge, patientAddress, patientGender, patientBloodGroup, patientAllergies, patientMedications, patientStatus } = req.body || {};

        const employeeData = await Employeesinfo.findById(req.user?._id);
        if (!employeeData) {
            return res.status(404).json({
                message: "Employee not found",
                success: false,
                error: "Employee not found"
            });
        }

        const isInvalid = (val) => !val || (Array.isArray(val) && val.length === 0);

        if (isInvalid(patientId)) {
            return res.status(400).json({
                message: "Required fields are missing",
                success: false,
                error: "patientId is required"
            });
        }

        const patientData = await Patientinfo.findById(patientId);
        if (!patientData) {
            return res.status(404).json({
                message: "Patient not found",
                success: false,
                error: "Patient not found"
            });
        }

        if (patientName) patientData.patientName = patientName;
        if (patientAge) patientData.patientAge = patientAge;
        if (patientAddress) patientData.patientAddress = patientAddress;
        if (patientGender) patientData.patientGender = patientGender;
        if (patientBloodGroup) patientData.patientBloodGroup = patientBloodGroup;
        if (patientAllergies) patientData.patientAllergies = patientAllergies;
        if (patientMedications) patientData.patientMedications = patientMedications;
        if (patientStatus) patientData.patientStatus = patientStatus;
        if (patientStatus === "admitted" && patientData.patientStatus !== "admitted") {
            patientData.patientAdmittedAt = Date.now();
        }
        if (patientStatus === "Discharged" && patientData.patientStatus !== "Discharged") {
            patientData.patientDischargedAt = Date.now();
        }

        await patientData.save();
        return res.status(200).json({
            message: "Patient updated successfully",
            success: true,
            patient: patientData
        });

    } catch (error) {
        console.error("Patient update error:", error);
        return res.status(500).json({
            message: "An error occurred while updating patient",
            success: false,
            error: "Internal server error"
        });
    }
};


export const deletePatient = async (req, res) => {
    try {
        const { patientId } = req.params
        const employeeData = await Employeesinfo.findById(req.user?._id);

        if (!employeeData) {
            return res.status(404).json({
                message: "Employee not found",
                success: false,
                error: "Employee not found"
            });
        }

        const isInvalid = (val) => !val || (Array.isArray(val) && val.length === 0);

        if (isInvalid(patientId)) {
            return res.status(400).json({
                message: "Required fields are missing",
                success: false,
                error: "patientId is required"
            });
        }

        const patientData = await Patientinfo.findById(patientId);
        if (!patientData) {
            return res.status(404).json({
                message: "Patient not found",
                success: false,
                error: "Patient not found"
            });
        }

        if (patientData.hospitalId.toString() !== employeeData.hospitalId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to delete this patient",
                success: false,
                error: "Unauthorized"
            })
        }

        await patientData.deleteOne()

        await PatientDisease.deleteMany({ patientId: patientId })
        await PatientPrevHis.deleteMany({ patientId: patientId })

        return res.status(200).json({
            message: "Patient deleted successfully",
            success: true,
            patient: patientData
        })
    } catch (error) {
        console.error("Patient delete error:", error);
        return res.status(500).json({
            message: "An error occurred while deleting patient",
            success: false,
            error: "Internal server error"
        });
    }
}

export const getAllPatient = async (req, res) => {
    try {
        const employeeData = await Employeesinfo.findById(req.user?._id);
        if (!employeeData) {
            return res.status(404).json({
                message: "Employee not found",
                success: false,
                error: "Employee not found"
            });
        }

        const patientData = await Patientinfo.find({ hospitalId: employeeData.hospitalId });
        if (!patientData) {
            return res.status(404).json({
                message: "Patient not found",
                success: false,
                error: "Patient not found"
            });
        }

        return res.status(200).json({
            message: "Patient data fetched successfully",
            success: true,
            patient: patientData
        });
    }
    catch (error) {
        console.error("Patient get all error:", error);
        return res.status(500).json({
            message: "An error occurred while getting all patients",
            success: false,
            error: "Internal server error"
        });
    }
}