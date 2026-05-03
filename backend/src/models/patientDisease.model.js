import mongoose from "mongoose";

const patientDisease = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patientinfo",
        required: true,
        index: true
    },
    diseaseName: {
        type: [],
        of: String,
        required: true
    },
    diagnosisMedicines: {
        type: [],
        of: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const PatientDisease = mongoose.model("PatientDisease", patientDisease);
export default PatientDisease;