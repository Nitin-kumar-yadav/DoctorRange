import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

// ── Hoisted mock functions ─────────────────────────────────────────────────────

const {
  mockEmployeeFindById,
  mockJwtVerify,
} = vi.hoisted(() => ({
  mockEmployeeFindById: vi.fn(),
  mockJwtVerify: vi.fn(),
}));

// ── Mock modules ───────────────────────────────────────────────────────────────

vi.mock("../models/employees.model.js", () => ({
  default: { findById: mockEmployeeFindById },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: (...args) => mockJwtVerify(...args),
    sign: vi.fn(),
  },
}));

// ── Import middleware ──────────────────────────────────────────────────────────
import { employeeAuthMiddleware } from "../middleware/empolyee.middleware.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

const employeeId = new mongoose.Types.ObjectId();

function mockReq(overrides = {}) {
  return {
    cookies: {},
    header: vi.fn().mockReturnValue(undefined),
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

describe("Employee Auth Middleware", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 401 when no token is provided", async () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    await employeeAuthMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unauthorized" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token is invalid (JsonWebTokenError)", async () => {
    const error = new Error("invalid token");
    error.name = "JsonWebTokenError";
    mockJwtVerify.mockImplementation(() => { throw error; });
    const req = mockReq({ cookies: { token: "invalid-token" } });
    const res = mockRes();
    const next = vi.fn();
    await employeeAuthMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Invalid or expired token" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token is expired (TokenExpiredError)", async () => {
    const error = new Error("jwt expired");
    error.name = "TokenExpiredError";
    mockJwtVerify.mockImplementation(() => { throw error; });
    const req = mockReq({ cookies: { token: "expired-token" } });
    const res = mockRes();
    const next = vi.fn();
    await employeeAuthMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when employee is not found for decoded token", async () => {
    const selectMock = vi.fn().mockResolvedValue(null);
    mockJwtVerify.mockReturnValue({ id: employeeId });
    mockEmployeeFindById.mockReturnValue({ select: selectMock });
    const req = mockReq({ cookies: { token: "valid-token" } });
    const res = mockRes();
    const next = vi.fn();
    await employeeAuthMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Invalid token - employee not found" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should set req.user and call next() when token and employee are valid", async () => {
    const employee = { _id: employeeId, fullName: "Dr. Smith", role: "doctor" };
    const selectMock = vi.fn().mockResolvedValue(employee);
    mockJwtVerify.mockReturnValue({ id: employeeId });
    mockEmployeeFindById.mockReturnValue({ select: selectMock });
    const req = mockReq({ cookies: { token: "valid-token" } });
    const res = mockRes();
    const next = vi.fn();
    await employeeAuthMiddleware(req, res, next);
    expect(req.user).toEqual(employee);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should extract token from Authorization header when cookie is missing", async () => {
    const employee = { _id: employeeId, fullName: "Dr. Smith" };
    const selectMock = vi.fn().mockResolvedValue(employee);
    mockJwtVerify.mockReturnValue({ id: employeeId });
    mockEmployeeFindById.mockReturnValue({ select: selectMock });
    const req = mockReq({
      cookies: {},
      header: vi.fn().mockImplementation((name) =>
        name === "Authorization" ? "Bearer valid-token" : undefined
      ),
    });
    const res = mockRes();
    const next = vi.fn();
    await employeeAuthMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual(employee);
  });

  it("should return 500 on unexpected internal errors", async () => {
    const error = new Error("Something unexpected");
    error.name = "SomeOtherError";
    mockJwtVerify.mockImplementation(() => { throw error; });
    const req = mockReq({ cookies: { token: "valid-token" } });
    const res = mockRes();
    const next = vi.fn();
    await employeeAuthMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Internal server error in employeeAuthMiddleware" })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
