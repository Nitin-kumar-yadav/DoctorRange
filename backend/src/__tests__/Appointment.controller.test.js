import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

// ── Hoisted mock functions ─────────────────────────────────────────────────────

const {
  mockAppointmentCreate,
  mockPatientFindOne,
  mockPatientCreate,
  mockHospitalFindById,
  mockEmployeeFindById,
} = vi.hoisted(() => ({
  mockAppointmentCreate: vi.fn(),
  mockPatientFindOne: vi.fn(),
  mockPatientCreate: vi.fn(),
  mockHospitalFindById: vi.fn(),
  mockEmployeeFindById: vi.fn(),
}));

// ── Mock modules ───────────────────────────────────────────────────────────────

vi.mock("../models/Appointment.model.js", () => ({
  default: { create: mockAppointmentCreate },
}));

vi.mock("../models/patient.model.js", () => ({
  default: { findOne: mockPatientFindOne, create: mockPatientCreate },
}));

vi.mock("../models/hospital.model.js", () => ({
  default: { findById: mockHospitalFindById },
}));

vi.mock("../models/employees.model.js", () => ({
  default: { findById: mockEmployeeFindById },
}));

// ── Import controller ──────────────────────────────────────────────────────────
import { createAppointment } from "../controllers/Appointment.controller.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

const userId = new mongoose.Types.ObjectId();

const validPatientBody = {
  patientName: "John Doe",
  patientPhone: "9876543210",
  patientEmail: "john@example.com",
  patientAddress: "123 Main St",
  patientGender: "male",
  patientAge: 30,
};

function mockReq(overrides = {}) {
  return {
    user: { _id: userId, role: "hospital" },
    cookies: {},
    body: { ...validPatientBody },
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("Appointment Controller — createAppointment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 401 if no login token is present", async () => {
    const req = mockReq({ user: { _id: undefined, role: "hospital" }, cookies: {} });
    const res = mockRes();
    await createAppointment(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unauthorized" })
    );
  });

  it("should return 403 if role is not hospital, employee, or doctor", async () => {
    const req = mockReq({ user: { _id: userId, role: "patient" } });
    const res = mockRes();
    await createAppointment(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Forbidden") })
    );
  });

  it("should return 401 if neither hospital nor employee is found", async () => {
    mockHospitalFindById.mockResolvedValue(null);
    mockEmployeeFindById.mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    await createAppointment(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("not hospital and employee") })
    );
  });

  it("should return 400 when required patient fields are missing", async () => {
    mockHospitalFindById.mockResolvedValue({ _id: userId });
    mockEmployeeFindById.mockResolvedValue(null);
    const req = mockReq({ body: { patientName: "John" } });
    const res = mockRes();
    await createAppointment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "All fields are required" })
    );
  });

  it("should return 400 if patient already exists", async () => {
    mockHospitalFindById.mockResolvedValue({ _id: userId });
    mockEmployeeFindById.mockResolvedValue(null);
    mockPatientFindOne.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
    const req = mockReq();
    const res = mockRes();
    await createAppointment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Patient already exists" })
    );
  });

  it("should create patient and appointment successfully (200)", async () => {
    const patientId = new mongoose.Types.ObjectId();
    const appointmentId = new mongoose.Types.ObjectId();
    mockHospitalFindById.mockResolvedValue({ _id: userId });
    mockEmployeeFindById.mockResolvedValue(null);
    mockPatientFindOne.mockResolvedValue(null);
    mockPatientCreate.mockResolvedValue({ _id: patientId, ...validPatientBody });
    mockAppointmentCreate.mockResolvedValue({ _id: appointmentId, patientId, hospitalId: userId });
    const req = mockReq();
    const res = mockRes();
    await createAppointment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Appointment created successfully",
        patient: expect.any(Object),
        appointment: expect.any(Object),
      })
    );
  });

  it("should work with employee role when hospital not found but employee is", async () => {
    const patientId = new mongoose.Types.ObjectId();
    mockHospitalFindById.mockResolvedValue(null);
    mockEmployeeFindById.mockResolvedValue({ _id: userId });
    mockPatientFindOne.mockResolvedValue(null);
    mockPatientCreate.mockResolvedValue({ _id: patientId, ...validPatientBody });
    mockAppointmentCreate.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
    const req = mockReq({ user: { _id: userId, role: "employee" } });
    const res = mockRes();
    await createAppointment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should return 500 on unexpected DB errors", async () => {
    mockHospitalFindById.mockRejectedValue(new Error("DB crashed"));
    const req = mockReq();
    const res = mockRes();
    await createAppointment(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Failed to create appointment" })
    );
  });
});
