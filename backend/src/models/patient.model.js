import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true,
        index: true
    },
    patientBloodGroup: {
        type: String,
    },
    patientAllergies: {
        type: [String],
        default: []
    },
    patientMedications: {
        type: [String],
        default: []
    },
    patientProfilePicture: {
        type: String,
    },
    patientAdmittedAt: {
        type: Date,
        default: null
    },
    patientDischargedAt: {
        type: Date,
        default: null
    },
    patientStatus: {
        type: String,
        enum: ["registered", "admitted", "discharged"],
        default: "registered"
    },
    patientAdmittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employeesinfo",
        index: true,
    }

}, { timestamps: true })

const Patientinfo = mongoose.model("Patientinfo", patientSchema);
export default Patientinfo;