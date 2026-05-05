import bcrypt from "bcryptjs";
import Employeesinfo from "../models/employees.model.js";
import { generateTokenAndSetCookie } from "../lib/uitls.js";
import Hospitalinfo from "../models/hospital.model.js";

export const employeeSignup = async (req, res) => {
    try {
        const { fullName, phoneNumber, qualification, profilePicture, status, email, password, role, hospitalId } = req.body;

        if (!fullName || !phoneNumber || !qualification || !status || !email || !password || !role || !hospitalId) {
            return res.status(400).json({
                message: "All fields are required",
                success: false,
                error: "All fields are required",
            });
        }

        const checkHospital = await Hospitalinfo.findById(hospitalId);
        if (!checkHospital) {
            return res.status(404).json({
                message: "Hospital not found",
                success: false,
                error: "Hospital not found",
            });
        }

        let employee = await Employeesinfo.findOne({ email });
        if (employee) {
            return res.status(400).json({
                message: "Employee already exists",
                success: false,
                error: "Employee already exists",
            });
        }
        let salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        employee = await Employeesinfo.create({
            fullName,
            phoneNumber,
            qualification,
            profilePicture,
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
            return res.status(400).json({
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
                profilePicture: employee.profilePicture,
                status: employee.status,
                email: employee.email,
                role: employee.role,
                hospitalId: employee.hospitalId,
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error while employeeSignup",
            success: false,
            error: error.message,
        });
    }
}

export const employeeLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required",
                success: false,
                error: "All fields are required",
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long",
                success: false,
                error: "Password must be at least 6 characters long",
            });
        }
        if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
            return res.status(400).json({
                message: "Invalid email address",
                success: false,
                error: "Invalid email address",
            });
        }
        const employee = await Employeesinfo.findOne({ email });
        if (!employee) {
            return res.status(404).json({
                message: "Employee not found",
                success: false,
                error: "Employee not found",
            });
        }
        const passwordMatch = await bcrypt.compare(password, employee.password);
        if (!passwordMatch) {
            return res.status(400).json({
                message: "Invalid password",
                success: false,
                error: "Invalid password",
            });
        }
        const token = generateTokenAndSetCookie(employee._id, res);
        if (!token) {
            return res.status(400).json({
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
                profilePicture: employee.profilePicture,
                status: employee.status,
                workshift: employee.workshift,
                email: employee.email,
                role: employee.role,
                hospitalId: employee.hospitalId,
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error while employeeLogin",
            success: false,
            error: error.message,
        });
    }
}