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
        if (patient.patientStatus === "discharged") {
            patient.patientDischargedAt = Date.now();
        }

        if (patient) {
            await patient.save();
            return res.status(200).json({ message: "Patient registered successfully" });
        }
        else {
            return res.status(400).json({ message: "Patient not registered" });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}