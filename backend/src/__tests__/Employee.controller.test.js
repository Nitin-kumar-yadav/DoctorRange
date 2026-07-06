import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

// ── Hoisted mock functions ─────────────────────────────────────────────────────

const {
  mockEmployeeFindOne,
  mockEmployeeCreate,
  mockEmployeeFindById,
  mockHospitalFindById,
  mockHospitalSave,
  mockBcryptGenSalt,
  mockBcryptHash,
  mockBcryptCompare,
  mockGenerateToken,
  mockCloudinaryUpload,
} = vi.hoisted(() => ({
  mockEmployeeFindOne: vi.fn(),
  mockEmployeeCreate: vi.fn(),
  mockEmployeeFindById: vi.fn(),
  mockHospitalFindById: vi.fn(),
  mockHospitalSave: vi.fn(),
  mockBcryptGenSalt: vi.fn(),
  mockBcryptHash: vi.fn(),
  mockBcryptCompare: vi.fn(),
  mockGenerateToken: vi.fn(),
  mockCloudinaryUpload: vi.fn(),
}));

// ── Mock modules ───────────────────────────────────────────────────────────────

vi.mock("../models/employees.model.js", () => ({
  default: {
    findOne: mockEmployeeFindOne,
    create: mockEmployeeCreate,
    findById: mockEmployeeFindById,
  },
}));

vi.mock("../models/hospital.model.js", () => ({
  default: { findById: mockHospitalFindById },
}));

vi.mock("bcryptjs", () => ({
  default: {
    genSalt: (...args) => mockBcryptGenSalt(...args),
    hash: (...args) => mockBcryptHash(...args),
    compare: (...args) => mockBcryptCompare(...args),
  },
}));

vi.mock("../lib/uitls.js", () => ({
  generateTokenAndSetCookie: (...args) => mockGenerateToken(...args),
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: { upload: (...args) => mockCloudinaryUpload(...args) },
  },
}));

vi.mock("fs", () => ({
  default: { unlinkSync: vi.fn() },
  unlinkSync: vi.fn(),
}));

// ── Import controllers ─────────────────────────────────────────────────────────
import { employeeSignup, employeeLogin } from "../controllers/Employee.controller.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

const employeeId = new mongoose.Types.ObjectId();
const hospitalId = new mongoose.Types.ObjectId();

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  return res;
}

const validSignupBody = {
  fullName: "Dr. Smith",
  phoneNumber: "9876543210",
  qualification: "MBBS",
  status: "active",
  email: "smith@hospital.com",
  password: "password123",
  role: "doctor",
  hospitalId: hospitalId.toString(),
};

// ── employeeSignup ─────────────────────────────────────────────────────────────

describe("Employee Controller — employeeSignup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when required fields are missing", async () => {
    const req = { body: { fullName: "Dr. Smith" }, file: { path: "/tmp/pic.jpg" } };
    const res = mockRes();
    await employeeSignup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "All fields are required" })
    );
  });

  it("should return 400 when profile picture file is missing", async () => {
    const req = { body: { ...validSignupBody }, file: undefined };
    const res = mockRes();
    await employeeSignup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Profile picture is required" })
    );
  });

  it("should return 404 when hospital is not found", async () => {
    mockHospitalFindById.mockResolvedValue(null);
    const req = { body: { ...validSignupBody }, file: { path: "/tmp/pic.jpg" } };
    const res = mockRes();
    await employeeSignup(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Hospital not found" })
    );
  });

  it("should return 400 when employee already exists", async () => {
    mockHospitalFindById.mockResolvedValue({ _id: hospitalId });
    mockEmployeeFindOne.mockResolvedValue({ _id: employeeId });
    const req = { body: { ...validSignupBody }, file: { path: "/tmp/pic.jpg" } };
    const res = mockRes();
    await employeeSignup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Employee already exists" })
    );
  });

  it("should return 201 on successful signup", async () => {
    mockHospitalFindById.mockResolvedValue({ _id: hospitalId, employees: [], save: mockHospitalSave });
    mockEmployeeFindOne.mockResolvedValue(null);
    mockCloudinaryUpload.mockResolvedValue({ secure_url: "https://cloud.example.com/pic.jpg" });
    mockBcryptGenSalt.mockResolvedValue("salt");
    mockBcryptHash.mockResolvedValue("hashedpass");
    mockEmployeeCreate.mockResolvedValue({
      _id: employeeId, fullName: "Dr. Smith", phoneNumber: "9876543210",
      qualification: "MBBS", employeeProfilePicture: "https://cloud.example.com/pic.jpg",
      status: "active", email: "smith@hospital.com", role: "doctor", hospitalId,
    });
    mockGenerateToken.mockReturnValue("jwt-token");
    mockHospitalSave.mockResolvedValue(undefined);
    const req = { body: { ...validSignupBody }, file: { path: "/tmp/pic.jpg" } };
    const res = mockRes();
    await employeeSignup(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Employee created successfully", success: true })
    );
  });

  it("should return 500 when token generation fails during signup", async () => {
    mockHospitalFindById.mockResolvedValue({ _id: hospitalId, employees: [], save: mockHospitalSave });
    mockEmployeeFindOne.mockResolvedValue(null);
    mockCloudinaryUpload.mockResolvedValue({ secure_url: "https://cloud.example.com/pic.jpg" });
    mockBcryptGenSalt.mockResolvedValue("salt");
    mockBcryptHash.mockResolvedValue("hashedpass");
    mockEmployeeCreate.mockResolvedValue({ _id: employeeId, fullName: "Dr. Smith" });
    mockGenerateToken.mockReturnValue(null);
    const req = { body: { ...validSignupBody }, file: { path: "/tmp/pic.jpg" } };
    const res = mockRes();
    await employeeSignup(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── employeeLogin ──────────────────────────────────────────────────────────────

describe("Employee Controller — employeeLogin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when email or password is missing", async () => {
    const req = { body: {} };
    const res = mockRes();
    await employeeLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "All fields are required" })
    );
  });

  it("should return 401 when employee email is not found", async () => {
    mockEmployeeFindOne.mockResolvedValue(null);
    const req = { body: { email: "unknown@test.com", password: "pass123" } };
    const res = mockRes();
    await employeeLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid credentials" })
    );
  });

  it("should return 401 when password does not match", async () => {
    mockEmployeeFindOne.mockResolvedValue({ _id: employeeId, password: "hashedpass" });
    mockBcryptCompare.mockResolvedValue(false);
    const req = { body: { email: "smith@hospital.com", password: "wrongpass" } };
    const res = mockRes();
    await employeeLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 200 on successful login", async () => {
    mockEmployeeFindOne.mockResolvedValue({
      _id: employeeId, password: "hashedpass", fullName: "Dr. Smith",
      phoneNumber: "9876543210", qualification: "MBBS", employeeProfilePicture: "pic.jpg",
      status: "active", email: "smith@hospital.com", role: "doctor", hospitalId,
    });
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateToken.mockReturnValue("jwt-token");
    const req = { body: { email: "smith@hospital.com", password: "password123" } };
    const res = mockRes();
    await employeeLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Employee login successful" })
    );
  });

  it("should return 500 on unexpected error", async () => {
    mockEmployeeFindOne.mockRejectedValue(new Error("DB error"));
    const req = { body: { email: "smith@hospital.com", password: "pass123" } };
    const res = mockRes();
    await employeeLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
