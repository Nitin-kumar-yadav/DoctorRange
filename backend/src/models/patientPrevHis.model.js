import mongoose from "mongoose";

const patientPrevHisSchema = new mongoose.Schema({
    patientDiseaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PatientDisease",
        required: true,
        index: true
    },
    previousMedicalHistory: {
        type: [String],
        default: []
    },
}, { timestamps: true })

const PatientPrevHis = mongoose.model("PatientPrevHis", patientPrevHisSchema);
export default PatientPrevHis;