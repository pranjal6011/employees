import { expect } from "chai";
import sinon from "sinon";
import * as employeeHooks from "../srv/handlers/employee";
import * as helpers from "../srv/utils/helpers";
import { describe, beforeEach, afterEach, it } from "mocha";

let req: any;

describe("Employee Hook Tests", () => {
  beforeEach(() => {
    req = {
      data: {
        ID: "E001",
        phoneNumber: "1234567890",
        bankAccountNumber: "12345678",
        firstName: "John",
        lastName: "Doe",
      },
      user: { is: (role: string) => role === "Admin" },
      reject: sinon.stub(),
      params: [{ ID: "E001" }],
    };

    // Override CAP global SELECT/UPDATE/DELETE in test context
    (global as any).SELECT = {
      one: {
        from: () => ({
          where: async () => null,
        }),
      },
    };

    (global as any).UPDATE = () => ({
      set: () => ({
        where: async () => undefined,
      }),
    });

    (global as any).DELETE = {
      from: () => ({
        where: async () => undefined,
      }),
    };

    sinon.stub(helpers, "generateUniqueEmail").resolves("john.doe@sap.com");
  });

  afterEach(() => {
    delete (global as any).SELECT;
    delete (global as any).UPDATE;
    delete (global as any).DELETE;
    sinon.restore();
  });

  it("should reject CREATE with invalid phone number", async () => {
    req.data.phoneNumber = "abc123";
    await employeeHooks.beforeCreate(req, "Employees");
    expect(req.reject.calledWith(400, sinon.match("Phone number"))).to.be.true;
  });

  it("should reject CREATE with invalid bank account number", async () => {
    req.data.bankAccountNumber = "abcd123";
    await employeeHooks.beforeCreate(req, "Employees");
    expect(req.reject.calledWith(400, sinon.match("Bank Account Number"))).to.be.true;
  });

  it("should reject CREATE if bank account already exists", async () => {
    (global as any).SELECT.one.from = () => ({
      where: async () => ({ ID: "E001" }),
    });
    await employeeHooks.beforeCreate(req, "Employees");
    expect(req.reject.calledWith(400, sinon.match("already exists"))).to.be.true;
  });

  it("should reject UPDATE if employee not found", async () => {
    (global as any).SELECT.one.from = () => ({
      where: async () => undefined,
    });
    await employeeHooks.beforeUpdate(req, "Employees");
    expect(req.reject.calledWith(404, sinon.match("not found"))).to.be.true;
  });

  it("should reject UPDATE with invalid phone number", async () => {
    req.data.phoneNumber = "99999";
    (global as any).SELECT.one.from = () => ({
      where: async () => ({
        ID: "E001",
        firstName: "John",
        lastName: "Doe",
        bankAccountNumber: "12345678",
      }),
    });
    await employeeHooks.beforeUpdate(req, "Employees");
    expect(req.reject.calledWith(400, sinon.match("Phone number"))).to.be.true;
  });

  it("should reject setEmployeeInactive if already inactive", async () => {
    (global as any).SELECT.one.from = () => ({
      where: async () => ({ status: "Inactive" }),
    });
    await employeeHooks.onSetEmployeeInactive(req, "Employees");
    expect(req.reject.calledWith(400, sinon.match("already inactive"))).to.be.true;
  });

  it("should reject deleteEmployeePermanently if employee status is not Inactive", async () => {
    (global as any).SELECT.one.from = () => ({
      where: async () => ({ status: "Active" }),
    });
    await employeeHooks.onDeleteEmployeePermanently(req, "Employees");
    expect(req.reject.calledWith(400, sinon.match("Only inactive"))).to.be.true;
  });

  it("should reject any action if user is not Admin", async () => {
    req.user.is = () => false;
    await employeeHooks.beforeCreate(req, "Employees");
    expect(req.reject.calledWith(403, sinon.match("access"))).to.be.true;
  });
});
