import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

// ── Hoisted mock functions ─────────────────────────────────────────────────────

const {
  mockHospitalFindOne,
  mockHospitalCreate,
  mockHospitalFindByIdAndUpdate,
  mockBcryptGenSalt,
  mockBcryptHash,
  mockBcryptCompare,
  mockGenerateToken,
  mockCloudinaryUpload,
} = vi.hoisted(() => ({
  mockHospitalFindOne: vi.fn(),
  mockHospitalCreate: vi.fn(),
  mockHospitalFindByIdAndUpdate: vi.fn(),
  mockBcryptGenSalt: vi.fn(),
  mockBcryptHash: vi.fn(),
  mockBcryptCompare: vi.fn(),
  mockGenerateToken: vi.fn(),
  mockCloudinaryUpload: vi.fn(),
}));

// ── Mock modules ───────────────────────────────────────────────────────────────

vi.mock("../models/hospital.model.js", () => ({
  default: {
    findOne: mockHospitalFindOne,
    create: mockHospitalCreate,
    findByIdAndUpdate: mockHospitalFindByIdAndUpdate,
  },
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

vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
}));

// ── Import controllers ─────────────────────────────────────────────────────────
import {
  signupHospital,
  loginHospital,
  updateHospital,
} from "../controllers/Hospital.controller.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

const hospitalId = new mongoose.Types.ObjectId();

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  return res;
}

// ── signupHospital ─────────────────────────────────────────────────────────────

describe("Hospital Controller — signupHospital", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when required fields are missing", async () => {
    const req = { body: { hospitalName: "Test" }, file: null };
    const res = mockRes();
    await signupHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Missing fields") })
    );
  });

  it("should return 400 when hospital logo is missing", async () => {
    const req = {
      body: { hospitalName: "Test", hospitalAddress: "Addr", hospitalPhone: "1234567890", hospitalEmail: "h@test.com", hospitalPassword: "password123" },
      file: null,
    };
    const res = mockRes();
    await signupHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 for invalid phone number", async () => {
    const req = {
      body: { hospitalName: "Test", hospitalAddress: "Addr", hospitalPhone: "123", hospitalEmail: "h@test.com", hospitalPassword: "password123" },
      file: { path: "/tmp/logo.png" },
    };
    const res = mockRes();
    await signupHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Phone number must be 10 digits" })
    );
  });

  it("should return 400 for password shorter than 6 characters", async () => {
    const req = {
      body: { hospitalName: "Test", hospitalAddress: "Addr", hospitalPhone: "1234567890", hospitalEmail: "h@test.com", hospitalPassword: "12345" },
      file: { path: "/tmp/logo.png" },
    };
    const res = mockRes();
    await signupHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("6 characters") })
    );
  });

  it("should return 400 for invalid email format", async () => {
    const req = {
      body: { hospitalName: "Test", hospitalAddress: "Addr", hospitalPhone: "1234567890", hospitalEmail: "invalid-email", hospitalPassword: "password123" },
      file: { path: "/tmp/logo.png" },
    };
    const res = mockRes();
    await signupHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid email address" })
    );
  });

  it("should return 400 if hospital already exists", async () => {
    mockHospitalFindOne.mockResolvedValue({ _id: hospitalId });
    const req = {
      body: { hospitalName: "Test", hospitalAddress: "Addr", hospitalPhone: "1234567890", hospitalEmail: "h@test.com", hospitalPassword: "password123" },
      file: { path: "/tmp/logo.png" },
    };
    const res = mockRes();
    await signupHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Hospital already exists" })
    );
  });

  it("should return 201 on successful signup", async () => {
    mockHospitalFindOne.mockResolvedValue(null);
    mockBcryptGenSalt.mockResolvedValue("salt");
    mockBcryptHash.mockResolvedValue("hashedpass");
    mockCloudinaryUpload.mockResolvedValue({ secure_url: "https://cloud.example.com/logo.png" });
    mockHospitalCreate.mockResolvedValue({});
    const req = {
      body: { hospitalName: "Test Hospital", hospitalAddress: "Addr", hospitalPhone: "1234567890", hospitalEmail: "h@test.com", hospitalPassword: "password123" },
      file: { path: "/tmp/logo.png" },
    };
    const res = mockRes();
    await signupHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Hospital signup successful" })
    );
  });
});

// ── loginHospital ──────────────────────────────────────────────────────────────

describe("Hospital Controller — loginHospital", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when email or password is missing", async () => {
    const req = { body: {} };
    const res = mockRes();
    await loginHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 401 for non-existent hospital email", async () => {
    mockHospitalFindOne.mockResolvedValue(null);
    const req = { body: { hospitalEmail: "nope@test.com", hospitalPassword: "pass123" } };
    const res = mockRes();
    await loginHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid credentials" })
    );
  });

  it("should return 401 for wrong password", async () => {
    mockHospitalFindOne.mockResolvedValue({ _id: hospitalId, hospitalPassword: "hashedpass" });
    mockBcryptCompare.mockResolvedValue(false);
    const req = { body: { hospitalEmail: "h@test.com", hospitalPassword: "wrongpass" } };
    const res = mockRes();
    await loginHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 200 on successful login", async () => {
    mockHospitalFindOne.mockResolvedValue({
      _id: hospitalId, hospitalPassword: "hashedpass", hospitalName: "Test Hospital",
      hospitalAddress: "Addr", hospitalPhone: "1234567890", hospitalEmail: "h@test.com", hospitalLogo: "logo.png",
    });
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateToken.mockReturnValue("jwt-token-value");
    const req = { body: { hospitalEmail: "h@test.com", hospitalPassword: "password123" } };
    const res = mockRes();
    await loginHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Hospital login successful" })
    );
  });

  it("should return 500 when token generation fails", async () => {
    mockHospitalFindOne.mockResolvedValue({
      _id: hospitalId, hospitalPassword: "hashedpass", hospitalName: "Test",
      hospitalAddress: "Addr", hospitalPhone: "1234567890", hospitalEmail: "h@test.com", hospitalLogo: "logo.png",
    });
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateToken.mockReturnValue(null);
    const req = { body: { hospitalEmail: "h@test.com", hospitalPassword: "password123" } };
    const res = mockRes();
    await loginHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── updateHospital ─────────────────────────────────────────────────────────────

describe("Hospital Controller — updateHospital", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when user ID is missing", async () => {
    const req = { user: {}, body: { hospitalName: "New" } };
    const res = mockRes();
    await updateHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 when no fields to update", async () => {
    const req = { user: { _id: hospitalId }, body: {} };
    const res = mockRes();
    await updateHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "No fields to update" })
    );
  });

  it("should return 400 for invalid phone in update", async () => {
    const req = { user: { _id: hospitalId }, body: { hospitalPhone: "123" } };
    const res = mockRes();
    await updateHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 404 when hospital not found during update", async () => {
    const selectMock = vi.fn().mockResolvedValue(null);
    mockHospitalFindByIdAndUpdate.mockReturnValue({ select: selectMock });
    const req = { user: { _id: hospitalId }, body: { hospitalName: "Updated" } };
    const res = mockRes();
    await updateHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 200 on successful update", async () => {
    const updatedDoc = { _id: hospitalId, hospitalName: "Updated Hospital" };
    const selectMock = vi.fn().mockResolvedValue(updatedDoc);
    mockHospitalFindByIdAndUpdate.mockReturnValue({ select: selectMock });
    const req = { user: { _id: hospitalId }, body: { hospitalName: "Updated Hospital" } };
    const res = mockRes();
    await updateHospital(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Hospital updated successfully" })
    );
  });
});
