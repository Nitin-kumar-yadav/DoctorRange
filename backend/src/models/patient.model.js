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
        ref: "Employeeinfo",
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
        type: [],
        of: String
    },
    patientMedications: {
        type: [],
        of: String
    },
    patientProfilePicture: {
        type: String,
    },
    patientAdmittedAt: {
        type: Date,
        default: Date.now
    },
    patientDischargedAt: {
        type: Date,
        default: Date.now
    },
    patientStatus: {
        type: String,
        enum: ["admitted", "discharged"],
        default: "admitted"
    },
    patientAdmittedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employeeinfo",
        index: true,
        required: true
    }
    
})

const Patientinfo = mongoose.model("Patientinfo", patientSchema);
export default Patientinfo;