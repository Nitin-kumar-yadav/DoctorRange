import mongoose from "mongoose";

const patientPrevHisSchema = new mongoose.Schema({
    patientDiseaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PatientDisease",
        required: true,
        index: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospitalinfo",
        required: true,
        index: true
    },
}, { timestamps: true })

const PatientPrevHis = mongoose.model("PatientPrevHis", patientPrevHisSchema);
export default PatientPrevHis;