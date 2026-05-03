import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema({
    hospitalName: {
        type: String,
        required: true
    },
    hospitalAddress: {
        type: String,
        required: true
    },
    hospitalPhone: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    hospitalEmail: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    hospitalLogo: {
        type: String,
        required: true
    },
    hospitalPassword: {
        type: String,
        required: true
    },

}, { timestamps: true });



const Hospitalinfo = mongoose.model("Hospitalinfo", hospitalSchema);
export default Hospitalinfo;