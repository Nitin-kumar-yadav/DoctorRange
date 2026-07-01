import Appointment from "../models/Appointment.model.js";
import Patientinfo from "../models/patient.model.js";
import Hospitalinfo from "../models/hospital.model.js"; // Added missing import
import Employeesinfo from "../models/employees.model.js";

export const createAppointment = async (req, res) => {
    try {
        const loginToken = req.user?._id || req?.cookies?._id;

        if (!loginToken) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (req.user?.role === "hospital" || req.user?.role === "employee" || req.user?.role === "doctor") {

            const hospital = await Hospitalinfo.findById(loginToken);
            const employee = await Employeesinfo.findById(loginToken);

            if (!hospital && !employee) {
                return res.status(401).json({ message: "Unauthorized: You are not hospital and employee" });
            }

            const { patientName, patientPhone, patientEmail, patientAddress, patientGender, patientAge } = req.body;

            if (!patientName || !patientPhone || !patientEmail || !patientAddress || !patientGender || !patientAge) {
                return res.status(400).json({ message: "All fields are required" });
            }

            let patient = await Patientinfo.findOne({ patientPhone });
            if (patient) {
                return res.status(400).json({ message: "Patient already exists" });
            }

            patient = await Patientinfo.create({
                patientName,
                patientPhone,
                patientEmail,
                patientAddress,
                patientGender,
                patientAge,
                hospitalId: hospital?._id,
                date: Date.now()
            });

            const appointment = await Appointment.create({
                patientId: patient._id,
                hospitalId: loginToken,
                date: Date.now()
            });

            return res.status(200).json({ message: "Appointment created successfully", patient, appointment });
        } else {
            return res.status(403).json({ message: "Forbidden: Only hospitals can create appointments this way" });
        }

    } catch (error) {
        console.error("Create Appointment Error:", error);
        res.status(500).json({ message: "Failed to create appointment", error: error.message });
    }
}