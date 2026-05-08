import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospitalinfo",
        index: true,
        required: true
    },
    hospitalEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employeesinfo",
        index: true,
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    patientPhone: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    patientEmail: {
        type: String,
    },
    patientAddress: {
        type: String,
        required: true
    },
    patientGender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true
    },
    patientAge: {
        type: Number,
        required: true
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