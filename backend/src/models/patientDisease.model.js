import mongoose from "mongoose";

const patientDisease = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patientinfo",
        required: true,
        index: true
    },
    diseaseName: {
        type: [String],
        required: true
    },
    diagnosisMedicines: {
        type: [String],
        required: true
    },
}, { timestamps: true });

const PatientDisease = mongoose.model("PatientDisease", patientDisease);
export default PatientDisease;