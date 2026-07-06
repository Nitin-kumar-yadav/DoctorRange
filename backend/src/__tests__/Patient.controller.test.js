import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

// ── Hoisted mock functions ─────────────────────────────────────────────────────

const {
  mockEmployeeFindById,
  mockPatientFindById,
  mockPatientFindOne,
  mockPatientFind,
  mockPatientSave,
  mockPatientDeleteOne,
  mockHospitalFindById,
  mockPatientDiseaseCreate,
  mockPatientDiseaseDeleteMany,
  mockPatientPrevHisCreate,
  mockPatientPrevHisDeleteMany,
  mockCloudinaryUpload,
  mockCloudinaryDestroy,
} = vi.hoisted(() => ({
  mockEmployeeFindById: vi.fn(),
  mockPatientFindById: vi.fn(),
  mockPatientFindOne: vi.fn(),
  mockPatientFind: vi.fn(),
  mockPatientSave: vi.fn(),
  mockPatientDeleteOne: vi.fn(),
  mockHospitalFindById: vi.fn(),
  mockPatientDiseaseCreate: vi.fn(),
  mockPatientDiseaseDeleteMany: vi.fn(),
  mockPatientPrevHisCreate: vi.fn(),
  mockPatientPrevHisDeleteMany: vi.fn(),
  mockCloudinaryUpload: vi.fn(),
  mockCloudinaryDestroy: vi.fn(),
}));

// ── Mock modules ───────────────────────────────────────────────────────────────

vi.mock("../models/employees.model.js", () => ({
  default: { findById: mockEmployeeFindById },
}));

vi.mock("../models/patient.model.js", () => {
  function PatientModel(data) {
    Object.assign(this, data);
    this._id = new mongoose.Types.ObjectId();
    this.save = mockPatientSave;
  }
  PatientModel.findById = mockPatientFindById;
  PatientModel.findOne = mockPatientFindOne;
  PatientModel.find = mockPatientFind;
  return { default: PatientModel };
});

vi.mock("../models/hospital.model.js", () => ({
  default: { findById: mockHospitalFindById },
}));

vi.mock("../models/patientDisease.model.js", () => ({
  default: { create: mockPatientDiseaseCreate, deleteMany: mockPatientDiseaseDeleteMany },
}));

vi.mock("../models/patientPrevHis.model.js", () => ({
  default: { create: mockPatientPrevHisCreate, deleteMany: mockPatientPrevHisDeleteMany },
}));

vi.mock("../models/Appointment.model.js", () => ({
  default: {},
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: (...args) => mockCloudinaryUpload(...args),
      destroy: (...args) => mockCloudinaryDestroy(...args),
    },
  },
}));

vi.mock("fs", () => ({
  default: { unlinkSync: vi.fn(), existsSync: vi.fn().mockReturnValue(false) },
  unlinkSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(false),
}));

// ── Import controllers ─────────────────────────────────────────────────────────
import {
  patientDisease,
  updatePatient,
  deletePatient,
  getAllPatient,
} from "../controllers/Patient.controller.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

const employeeId = new mongoose.Types.ObjectId();
const hospitalId = new mongoose.Types.ObjectId();
const patientId = new mongoose.Types.ObjectId();

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

// ── patientDisease ─────────────────────────────────────────────────────────────

describe("Patient Controller — patientDisease", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when required fields are missing", async () => {
    const req = { user: { _id: employeeId }, body: {} };
    const res = mockRes();
    await patientDisease(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 when diseaseName is empty", async () => {
    const req = {
      user: { _id: employeeId },
      body: { diseaseName: "", diagnosisMedicines: ["med1"], patientId: patientId.toString() },
    };
    const res = mockRes();
    await patientDisease(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 404 when employee is not found", async () => {
    mockEmployeeFindById.mockResolvedValue(null);
    const req = {
      user: { _id: employeeId },
      body: { diseaseName: "Flu", diagnosisMedicines: ["Paracetamol"], patientId: patientId.toString() },
    };
    const res = mockRes();
    await patientDisease(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Employee not found" })
    );
  });

  it("should return 404 when patient is not found", async () => {
    mockEmployeeFindById.mockResolvedValue({ _id: employeeId, hospitalId });
    mockPatientFindById.mockResolvedValue(null);
    const req = {
      user: { _id: employeeId },
      body: { diseaseName: "Flu", diagnosisMedicines: ["Paracetamol"], patientId: patientId.toString() },
    };
    const res = mockRes();
    await patientDisease(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Patient not found" })
    );
  });

  it("should return 201 on successful disease creation", async () => {
    const diseaseId = new mongoose.Types.ObjectId();
    mockEmployeeFindById.mockResolvedValue({ _id: employeeId, hospitalId });
    mockPatientFindById.mockResolvedValue({ _id: patientId });
    mockPatientDiseaseCreate.mockResolvedValue({ _id: diseaseId, patientId, diseaseName: ["Flu"] });
    mockPatientPrevHisCreate.mockResolvedValue({});
    const req = {
      user: { _id: employeeId },
      body: { diseaseName: "Flu", diagnosisMedicines: "Paracetamol", patientId: patientId.toString() },
    };
    const res = mockRes();
    await patientDisease(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Patient disease updated successfully" })
    );
  });

  it("should handle array inputs for disease and medicines", async () => {
    mockEmployeeFindById.mockResolvedValue({ _id: employeeId, hospitalId });
    mockPatientFindById.mockResolvedValue({ _id: patientId });
    mockPatientDiseaseCreate.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
    mockPatientPrevHisCreate.mockResolvedValue({});
    const req = {
      user: { _id: employeeId },
      body: { diseaseName: ["Flu", "Cold"], diagnosisMedicines: ["Paracetamol", "Ibuprofen"], patientId: patientId.toString() },
    };
    const res = mockRes();
    await patientDisease(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// ── updatePatient ──────────────────────────────────────────────────────────────

describe("Patient Controller — updatePatient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 404 when employee is not found", async () => {
    mockEmployeeFindById.mockResolvedValue(null);
    const req = { user: { _id: employeeId }, params: { patientId: patientId.toString() }, body: { patientName: "New Name" } };
    const res = mockRes();
    await updatePatient(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 400 when patientId param is missing", async () => {
    mockEmployeeFindById.mockResolvedValue({ _id: employeeId });
    const req = { user: { _id: employeeId }, params: {}, body: { patientName: "New Name" } };
    const res = mockRes();
    await updatePatient(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 404 when patient is not found", async () => {
    mockEmployeeFindById.mockResolvedValue({ _id: employeeId });
    mockPatientFindById.mockResolvedValue(null);
    const req = { user: { _id: employeeId }, params: { patientId: patientId.toString() }, body: { patientName: "New" } };
    const res = mockRes();
    await updatePatient(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 200 on successful update", async () => {
    const patientDoc = { _id: patientId, patientName: "Old", patientStatus: "registered", save: mockPatientSave };
    mockEmployeeFindById.mockResolvedValue({ _id: employeeId });
    mockPatientFindById.mockResolvedValue(patientDoc);
    mockPatientSave.mockResolvedValue(undefined);
    const req = { user: { _id: employeeId }, params: { patientId: patientId.toString() }, body: { patientName: "Updated Name", patientAge: 35 } };
    const res = mockRes();
    await updatePatient(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Patient updated successfully" })
    );
    expect(patientDoc.patientName).toBe("Updated Name");
  });

  it("should set patientAdmittedAt when status changes to admitted", async () => {
    const patientDoc = { _id: patientId, patientStatus: "registered", save: mockPatientSave };
    mockEmployeeFindById.mockResolvedValue({ _id: employeeId });
    mockPatientFindById.mockResolvedValue(patientDoc);
    mockPatientSave.mockResolvedValue(undefined);
    const req = { user: { _id: employeeId }, params: { patientId: patientId.toString() }, body: { patientStatus: "admitted" } };
    const res = mockRes();
    await updatePatient(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── deletePatient ──────────────────────────────────────────────────────────────

describe("Patient Controller — deletePatient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 404 when employee is not found", async () => {
    mockEmployeeFindById.mockResolvedValue(null);
    const req = { user: { _id: employeeId }, params: { patientId: patientId.toString() } };
    const res = mockRes();
    await deletePatient(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 403 when employee is from a different hospital", async () => {
    const differentHospital = new mongoose.Types.ObjectId();
    mockEmployeeFindById.mockResolvedValue({ _id: employeeId, hospitalId });
    mockPatientFindById.mockResolvedValue({ _id: patientId, hospitalId: differentHospital, deleteOne: mockPatientDeleteOne });
    const req = { user: { _id: employeeId }, params: { patientId: patientId.toString() } };
    const res = mockRes();
    await deletePatient(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should return 200 on successful delete and clean up related records", async () => {
    mockEmployeeFindById.mockResolvedValue({ _id: employeeId, hospitalId });
    mockPatientFindById.mockResolvedValue({ _id: patientId, hospitalId, deleteOne: mockPatientDeleteOne });
    mockPatientDeleteOne.mockResolvedValue(undefined);
    mockPatientDiseaseDeleteMany.mockResolvedValue(undefined);
    mockPatientPrevHisDeleteMany.mockResolvedValue(undefined);
    const req = { user: { _id: employeeId }, params: { patientId: patientId.toString() } };
    const res = mockRes();
    await deletePatient(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockPatientDeleteOne).toHaveBeenCalled();
    expect(mockPatientDiseaseDeleteMany).toHaveBeenCalled();
    expect(mockPatientPrevHisDeleteMany).toHaveBeenCalled();
  });
});

// ── getAllPatient ───────────────────────────────────────────────────────────────

describe("Patient Controller — getAllPatient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 404 when employee is not found", async () => {
    mockEmployeeFindById.mockResolvedValue(null);
    const req = { user: { _id: employeeId } };
    const res = mockRes();
    await getAllPatient(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 200 with patient list", async () => {
    mockEmployeeFindById.mockResolvedValue({ _id: employeeId, hospitalId });
    mockPatientFind.mockResolvedValue([
      { _id: patientId, patientName: "Patient A" },
      { _id: new mongoose.Types.ObjectId(), patientName: "Patient B" },
    ]);
    const req = { user: { _id: employeeId } };
    const res = mockRes();
    await getAllPatient(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, patient: expect.arrayContaining([expect.objectContaining({ patientName: "Patient A" })]) })
    );
  });

  it("should return 500 on unexpected error", async () => {
    mockEmployeeFindById.mockRejectedValue(new Error("DB failed"));
    const req = { user: { _id: employeeId } };
    const res = mockRes();
    await getAllPatient(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
