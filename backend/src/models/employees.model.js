import mongoose from "mongoose";

const employeesSchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospitalinfo",
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ["manager", "staff", "doctor"],
        default: "staff",
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    qualification: {
        type: String,
        required: false
    },
    profilePicture: {
        type: String,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
        required: true
    },
    workshift: {
        type: String,
        enum: ["morning", "evening", "night"],
        default: "morning",
        required: true
    },
    //TODO: Employee Login Credentials
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
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

const Employeesinfo = mongoose.model("Employeesinfo", employeesSchema);
export default Employeesinfo;