import Employeesinfo from "../models/employees.model.js";
import Hospitalinfo from "../models/hospital.model.js";


export const registerPatient = async (req, res) => {
    try {
        const { hospitalId, patientName, patientAge, patientEmail, patientPhone, patientAddress, patientGender, patientBloodGroup, patientAllergies, patientMedications, patientProfilePicture, patientStatus } = req.body;

        const hospitalEmployeeId = req.user?._id;
        if (!hospitalEmployeeId) {
            return res.status(400).json({ message: "Unauthorized access or you are not authorized to do this." });
        }

        const employeeData = await Employeesinfo.findById(hospitalEmployeeId);

        if (!employeeData) {
            return res.status(400).json({ message: "Employee not found" });
        }

        const isPatientExist = await Patientinfo.findOne({ patientPhone: patientPhone });

        if (isPatientExist) {
            return res.status(400).json({ message: "Patient already exists" });
        }

        const isHospitalExist = await Hospitalinfo.findById(hospitalId);

        if (!isHospitalExist) {
            return res.status(400).json({ message: "Hospital not found" });
        }

        // Verify employee belongs to this hospital
        if (employeeData.hospitalId?.toString() !== hospitalId) {
            return res.status(403).json({ message: "You are not authorized to register patients for this hospital" });
        }


        const patient = new Patientinfo({
            hospitalId: isHospitalExist._id,
            hospitalEmployeeId: employeeData._id,
            patientName: patientName,
            patientAge: patientAge,
            patientEmail: patientEmail,
            patientPhone: patientPhone,
            patientAddress: patientAddress,
            patientGender: patientGender,
            patientBloodGroup: patientBloodGroup,
            patientAllergies: patientAllergies,
            patientMedications: patientMedications,
            patientProfilePicture: patientProfilePicture,
            patientStatus: patientStatus,
        });
        if (patient.patientStatus === "admitted") {
            patient.patientAdmittedAt = Date.now();
        }
        await patient.save();
        return res.status(201).json({ message: "Patient registered successfully", patient });

    } catch (error) {
        console.error("Patient registration error:", error);
        res.status(500).json({ message: "An error occurred while registering the patient" });
    }
}