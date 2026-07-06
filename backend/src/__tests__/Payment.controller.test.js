import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

// ── Hoisted mock functions (available inside vi.mock factories) ─────────────

const {
  mockPaymentCreate,
  mockPaymentSave,
  mockAppointmentFindById,
  mockAppointmentSave,
  mockOrdersCreate,
} = vi.hoisted(() => ({
  mockPaymentCreate: vi.fn(),
  mockPaymentSave: vi.fn(),
  mockAppointmentFindById: vi.fn(),
  mockAppointmentSave: vi.fn(),
  mockOrdersCreate: vi.fn(),
}));

// ── Mock modules ───────────────────────────────────────────────────────────────

vi.mock("../models/payment.model.js", () => {
  function PaymentModel(data) {
    Object.assign(this, data);
    this._id = new mongoose.Types.ObjectId();
    this.save = mockPaymentSave;
  }
  PaymentModel.create = mockPaymentCreate;
  return { default: PaymentModel };
});

vi.mock("../models/Appointment.model.js", () => ({
  default: { findById: mockAppointmentFindById },
}));

vi.mock("razorpay", () => {
  // Must be a real function (not arrow) so it can be used with `new`
  function RazorpayMock() {
    this.orders = { create: mockOrdersCreate };
  }
  return { default: RazorpayMock };
});

// ── Import controller under test ───────────────────────────────────────────────
import { createPayment } from "../controllers/Payment.controller.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

const hospitalId = new mongoose.Types.ObjectId();

function mockReq(overrides = {}) {
  return {
    user: { _id: hospitalId, role: "hospital" },
    cookies: {},
    params: { _id: new mongoose.Types.ObjectId().toString() },
    body: { amount: 500, paymentMethod: "UPI" },
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

describe("Payment Controller — createPayment", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Authorization ─────────────────────────────────────────────────────────

  it("should return 403 if user role is not hospital, employee, or doctor", async () => {
    const req = mockReq({ user: { _id: hospitalId, role: "patient" } });
    const res = mockRes();
    await createPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Forbidden") })
    );
  });

  it("should return 403 when role is undefined", async () => {
    const req = mockReq({ user: { _id: hospitalId, role: undefined } });
    const res = mockRes();
    await createPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  // ── Appointment lookup ────────────────────────────────────────────────────

  it("should return 404 if appointment does not exist", async () => {
    mockAppointmentFindById.mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    await createPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Appointment does not exist in database" })
    );
  });

  it("should return 401 if logged-in user does not own the appointment", async () => {
    const differentHospitalId = new mongoose.Types.ObjectId();
    mockAppointmentFindById.mockResolvedValue({ hospitalId: differentHospitalId });
    const req = mockReq();
    const res = mockRes();
    await createPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unauthorized access to this appointment" })
    );
  });

  // ── Razorpay failure ──────────────────────────────────────────────────────

  it("should return 500 and save pending payment if Razorpay order creation fails", async () => {
    mockAppointmentFindById.mockResolvedValue({ hospitalId, save: mockAppointmentSave });
    mockOrdersCreate.mockResolvedValue(null);
    mockPaymentCreate.mockResolvedValue({});
    const req = mockReq();
    const res = mockRes();
    await createPayment(req, res);
    expect(mockPaymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" })
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Payment failed" })
    );
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it("should create payment and update appointment on success (201)", async () => {
    const fakeAppointment = { hospitalId, payment: null, save: mockAppointmentSave };
    mockAppointmentFindById.mockResolvedValue(fakeAppointment);
    mockOrdersCreate.mockResolvedValue({ id: "order_123" });
    mockPaymentSave.mockResolvedValue(undefined);
    mockAppointmentSave.mockResolvedValue(undefined);
    const req = mockReq();
    const res = mockRes();
    await createPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Payment created successfully" })
    );
    expect(fakeAppointment.payment).toBeDefined();
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(mockAppointmentSave).toHaveBeenCalled();
  });

  it("should default paymentMethod to UPI when not provided", async () => {
    const fakeAppointment = { hospitalId, payment: null, save: mockAppointmentSave };
    mockAppointmentFindById.mockResolvedValue(fakeAppointment);
    mockOrdersCreate.mockResolvedValue({ id: "order_456" });
    mockPaymentSave.mockResolvedValue(undefined);
    mockAppointmentSave.mockResolvedValue(undefined);
    const req = mockReq({ body: { amount: 300 } });
    const res = mockRes();
    await createPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ── Role variations ───────────────────────────────────────────────────────

  it("should allow employee role to create payment", async () => {
    const fakeAppointment = { hospitalId, payment: null, save: mockAppointmentSave };
    mockAppointmentFindById.mockResolvedValue(fakeAppointment);
    mockOrdersCreate.mockResolvedValue({ id: "order_emp" });
    mockPaymentSave.mockResolvedValue(undefined);
    mockAppointmentSave.mockResolvedValue(undefined);
    const req = mockReq({ user: { _id: hospitalId, role: "employee" } });
    const res = mockRes();
    await createPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should allow doctor role to create payment", async () => {
    const fakeAppointment = { hospitalId, payment: null, save: mockAppointmentSave };
    mockAppointmentFindById.mockResolvedValue(fakeAppointment);
    mockOrdersCreate.mockResolvedValue({ id: "order_doc" });
    mockPaymentSave.mockResolvedValue(undefined);
    mockAppointmentSave.mockResolvedValue(undefined);
    const req = mockReq({ user: { _id: hospitalId, role: "doctor" } });
    const res = mockRes();
    await createPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ── Internal server error ─────────────────────────────────────────────────

  it("should return 500 on unexpected errors", async () => {
    mockAppointmentFindById.mockRejectedValue(new Error("DB connection lost"));
    const req = mockReq();
    const res = mockRes();
    await createPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Failed to create payment" })
    );
  });
});
