import express from "express";
import dotenv from "dotenv";
import connectionDB from "./connection/db.js";
import routerHospital from "./routes/Hospital.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import routerEmployee from "./routes/Employee.route.js";
dotenv.config({ path: "./.env" });
const app = express();

if (!process.env.PORT) {
    console.error("PORT is not defined");
    process.exit(1);
}

app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

//TODO: Database connection

app.listen(process.env.PORT, () => {
    connectionDB();
    console.log(`Server is running on port ${process.env.PORT}`);
});