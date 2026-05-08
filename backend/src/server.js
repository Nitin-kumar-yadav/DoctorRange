import express from "express";
import dotenv from "dotenv";
import connectionDB from "./connection/db.js";
import routerHospital from "./routes/Hospital.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import routerEmployee from "./routes/Employee.route.js";
import patientRouter from "./routes/patient.route.js";
dotenv.config({ path: "./.env" });
const app = express();


if (!process.env.PORT) {
    console.error("PORT is not defined");
    process.exit(1);
}

app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
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
    res.status(200).json({ message: "Welcome to DoctorRange API" });
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