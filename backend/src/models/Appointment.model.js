import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
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
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
}, { timestamps: true });

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;