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

  it("should reject CREATE with invalid phone number(not exactly 10 digit)", async () => {
    req.data.phoneNumber = "98765432";
    await employeeHooks.beforeCreate(req, "Employees", "LearningsMasterData");
    expect(req.reject.calledWith(400, sinon.match("Phone number must be exactly 10 digits and numeric only"))).to.be.true;
  });
  it("should reject CREATE with invalid phone number(Containing non-digit value)", async () => {
    req.data.phoneNumber = "abc123";
    await employeeHooks.beforeCreate(req, "Employees", "LearningsMasterData");
    expect(req.reject.calledWith(400, sinon.match("Phone number must be exactly 10 digits and numeric only"))).to.be.true;
  });

  it("should reject CREATE with invalid bank account number(Contining non-digit value)", async () => {
    req.data.bankAccountNumber = "abcd123";
    await employeeHooks.beforeCreate(req, "Employees", "LearningsMasterData");
    expect(req.reject.calledWith(400, sinon.match("Bank Account Number must contain digits only"))).to.be.true;
  });

  it("should reject CREATE if bank account already exists", async () => {
    (global as any).SELECT.one.from = () => ({
      where: async () => ({ ID: "E001" }),
    });
    await employeeHooks.beforeCreate(req, "Employees", "LearningsMasterData");
    expect(req.reject.calledWith(400, sinon.match("Bank Account Number already exists"))).to.be.true;
  });

  it("should reject UPDATE if employee not found", async () => {
    (global as any).SELECT.one.from = () => ({
      where: async () => undefined,
    });
    await employeeHooks.beforeUpdate(req, "Employees", "ProjectsMasterData");
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
    await employeeHooks.beforeUpdate(req, "Employees", "ProjectsMasterData");
    expect(req.reject.calledWith(400, sinon.match("Phone number must be exactly 10 digits and numeric only"))).to.be.true;
  });

  it("should reject setEmployeeInactive if already inactive", async () => {
    (global as any).SELECT.one.from = () => ({
      where: async () => ({ status: "Inactive" }),
    });
    await employeeHooks.onSetEmployeeInactive(req, "Employees");
    expect(req.reject.calledWith(400, sinon.match("Employee is already inactive"))).to.be.true;
  });

  it("should reject any action if user is not Admin", async () => {
    req.user.is = () => false;
    await employeeHooks.beforeCreate(req, "Employees", "LearningsMasterData");
    expect(req.reject.calledWith(403, sinon.match("You don't have access"))).to.be.true;
  });

  it("should reject UPDATE if ratings have duplicate years", async () => {
    req.data.ratings = [
      { year: "2023", ratings: 4 },
      { year: "2023", ratings: 5 },
    ];

    (global as any).SELECT.one.from = () => ({
      where: async () => ({
        ID: "E001",
        firstName: "John",
        lastName: "Doe",
        bankAccountNumber: "12345678",
      }),
    });

    await employeeHooks.beforeUpdate(req, "Employees", "ProjectsMasterData");
    expect(req.reject.calledWith(400, sinon.match("Duplicate rating entry"))).to.be.true;
  });

  it("should reject UPDATE if rating is out of range", async () => {
    req.data.ratings = [
      { year: "2023", ratings: 6 },
    ];

    (global as any).SELECT.one.from = () => ({
      where: async () => ({
        ID: "E001",
        firstName: "John",
        lastName: "Doe",
        bankAccountNumber: "12345678",
      }),
    });

    await employeeHooks.beforeUpdate(req, "Employees", "ProjectsMasterData");
    expect(req.reject.calledWith(400, sinon.match("must be between 1 and 5"))).to.be.true;
  });

  it("should reject UPDATE if same project is assigned twice", async () => {
    req.data.projects = [
      { project_ID: "P001" },
      { project_ID: "P001" },
    ];

    const Employees = "Employees";
    const ProjectsMasterData = "ProjectsMasterData";

    const selectStub = sinon.stub();

    // Stub for existing employee lookup
    selectStub.withArgs(Employees).returns({
      where: async () => ({
        ID: "E001",
        firstName: "John",
        lastName: "Doe",
        bankAccountNumber: "12345678",
      }),
    });

    // Stub for project master data
    selectStub.withArgs(ProjectsMasterData).returns({
      where: async () => ({
        projectDescription: "Project Alpha",
      }),
    });

    (global as any).SELECT = {
      one: { from: selectStub },
    };

    await employeeHooks.beforeUpdate(req, Employees, ProjectsMasterData);
    expect(req.reject.calledWith(400, sinon.match("already assigned"))).to.be.true;
  });



  it("should reject UPDATE if same learning is assigned twice", async () => {
    req.data.learnings = [
      { learning_ID: "L001" },
      { learning_ID: "L001" },
    ];

    (global as any).SELECT.one.from = () => ({
      where: async () => ({
        ID: "E001",
        firstName: "John",
        lastName: "Doe",
        bankAccountNumber: "12345678",
      }),
    });

    await employeeHooks.beforeUpdate(req, "Employees", "ProjectsMasterData");
    expect(req.reject.calledWith(400, sinon.match("Learning is already assigned"))).to.be.true;

  });

});
