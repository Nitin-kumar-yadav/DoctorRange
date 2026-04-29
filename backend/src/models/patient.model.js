import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospitalinfo",
        index: true
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
    
})

const Patientinfo = mongoose.model("Patientinfo", patientSchema);
export default Patientinfo;