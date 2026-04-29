import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const connectionDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI is not defined");
        process.exit(1);
    }
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Connected to DB: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Error connecting to database:", error);
        process.exit(1);
    }
};

export default connectionDB;