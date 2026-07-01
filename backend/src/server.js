import express from "express";
import dotenv from "dotenv";
import connectionDB from "./connection/db.js";
import routerHospital from "./routes/Hospital.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import routerEmployee from "./routes/Employee.route.js";
import patientRouter from "./routes/patient.route.js";
import routerPayment from "./routes/Payment.route.js";
import routerAppointment from "./routes/Appointment.route.js";
dotenv.config({ path: "./.env" });
const app = express();


if (!process.env.PORT) {
    console.error("PORT is not defined");
    process.exit(1);
}

app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigin = process.env.CORS_ORIGIN;
        if (!origin) return callback(null, true);
        if (allowedOrigin && origin === allowedOrigin) return callback(null, true);
        return callback(new Error(`CORS: Origin '${origin}' not allowed`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 200,
}))
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

//TODO: Test API
app.get("/api/v1/test", (req, res) => {
    res.status(200).json({ message: "Welcome to DoctorRange API, Developed by Nitin Kumar Yadav" });
});

//TODO: Health check API
app.get("/api/v1/health-check", (req, res) => {
    res.status(200).json({ message: "Health check passed" });
});

//TODO: Hospital route
app.use("/api/v1/hospital", routerHospital);

//TODO: Employee route
app.use("/api/v1/employee", routerEmployee);

//TODO: Patient route
app.use("/api/v1/patient", patientRouter);

//TODO: Payment route
app.use("/api/v1/payment", routerPayment);

//TODO: Appointment route
app.use("/api/v1/appointment", routerAppointment);

//TODO: Database connection & Server start
const startServer = async () => {
    try {
        await connectionDB();
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();