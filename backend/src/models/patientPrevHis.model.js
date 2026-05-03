import mongoose from "mongoose";

const patientPrevHisSchema = new mongoose.Schema({
    patientDiseaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PatientDisease",
        required: true,
        index: true
    },
    previousMedicalHistory: {
        type: [],
        of: String,
        default: []
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

const PatientPrevHis = mongoose.model("PatientPrevHis", patientPrevHisSchema);
export default PatientPrevHis;