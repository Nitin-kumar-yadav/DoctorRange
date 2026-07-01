import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patientinfo",
        index: true,
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
        ref: "Employeesinfo"
    },
    date: {
        type: Date,
        required: true
    },
}, { timestamps: true });

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;