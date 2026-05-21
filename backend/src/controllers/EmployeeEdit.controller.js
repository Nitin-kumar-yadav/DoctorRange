import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // Required for fs.unlinkSync
import Employeesinfo from "../models/employees.model.js";

// Best Practice: Configure Cloudinary outside the request handler so it runs once
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const upDateEmployeeProfile = async (req, res) => {
  try {
    const employeeId = req.user?._id || req?.cookies?._id;

    const { role, fullName, phoneNumber, qualification, status } = req.body;

    if (!role || !fullName || !phoneNumber || !qualification || !status) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "All fields are required" });
    }

    const employee = await Employeesinfo.findById(employeeId);
    if (!employee) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Employee not found" });
    }

    let profilePictureUrl = employee.employeeProfilePicture;

    if (req.file) {
      const cloudinaryUpload = await cloudinary.uploader.upload(req.file.path, {
        folder: "DoctorsRange",
        resource_type: "auto",
      });

      profilePictureUrl = cloudinaryUpload.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const updatedEmployee = await Employeesinfo.findByIdAndUpdate(
      employeeId,
      {
        role,
        fullName,
        phoneNumber,
        qualification,
        status,
        employeeProfilePicture: profilePictureUrl,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee profile:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};
