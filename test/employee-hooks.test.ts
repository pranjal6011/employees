import { expect } from "chai";
import sinon from "sinon";
import { EmployeeHandler } from "../srv/handlers/employee";
import { describe, beforeEach, afterEach, it } from "mocha";

let req: any;
let handler: EmployeeHandler;

describe("Employee Handler Tests", () => {
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

    handler = new EmployeeHandler("Employees", "ProjectsMasterData", "LearningsMasterData");
    sinon.stub(handler as any, "generateUniqueEmail").resolves("john.doe@sap.com");
  });

  afterEach(() => {
    delete (global as any).SELECT;
    delete (global as any).UPDATE;
    delete (global as any).DELETE;
    sinon.restore();
  });

  it("should generate a unique email for new employee on CREATE", async () => {
    const emailWhereStub = sinon.stub().resolves(null);
    const emailFromStub = sinon.stub().returns({ where: emailWhereStub });

    const learningsWhereStub = sinon.stub().resolves([]);
    const learningsFromStub = sinon.stub().returns({ where: learningsWhereStub });

    (global as any).SELECT = {
      one: { from: emailFromStub },
      from: learningsFromStub,
    };

    await handler.beforeCreate(req);
    expect(req.data.emailId).to.equal("john.doe@sap.com");
  });

  it("should generate a different email if base email already exists", async () => {
    sinon.restore(); // use real generateUniqueEmail
    handler = new EmployeeHandler("Employees", "ProjectsMasterData", "LearningsMasterData");

    // Mock SELECT.one.from("Employees").where(...) to simulate email + bank checks
    const employeeWhereStub = sinon.stub().callsFake((condition) => {
      if (condition.emailId === "john.doe@sap.com") return Promise.resolve({ emailId: "john.doe@sap.com" });
      if (condition.emailId === "john.doe1@sap.com") return Promise.resolve(null);
      if (condition.bankAccountNumber === "12345678") return Promise.resolve(null);
      return Promise.resolve(null);
    });

    (global as any).SELECT = {
      one: {
        from: sinon.stub().returns({ where: employeeWhereStub }),
      },
      from: sinon.stub().withArgs("LearningsMasterData").returns({ where: sinon.stub().resolves([]) }),
    };

    await handler.beforeCreate(req);
    expect(req.data.emailId).to.equal("john.doe1@sap.com");
  });


  it("should regenerate email if firstName or lastName changed on UPDATE", async () => {
    sinon.restore();

    req.data.firstName = "Jane";

    const existingEmployee = {
      ID: "E001",
      firstName: "John",
      lastName: "Doe",
      bankAccountNumber: "12345678",
    };

    const employeeStub = sinon.stub().resolves(existingEmployee);

    const whereStub = sinon.stub();
    whereStub.withArgs({ ID: "E001" }).resolves(existingEmployee);
    whereStub.withArgs({ emailId: "jane.doe@sap.com" }).resolves(null);

    const fromStub = sinon.stub().returns({ where: whereStub });
    fromStub.withArgs("ProjectsMasterData").returns({ where: sinon.stub().resolves(null) });

    (global as any).SELECT = {
      one: { from: fromStub },
    };

    await handler.beforeUpdate(req);
    expect(req.data.emailId).to.equal("jane.doe@sap.com");
  });


  it("should reject CREATE with invalid phone number (not 10 digits)", async () => {
    req.data.phoneNumber = "98765432";
    await handler.beforeCreate(req);
    expect(req.reject.calledWith(400, sinon.match("Phone number must be exactly 10 digits"))).to.be.true;
  });

  it("should reject CREATE with invalid phone number (non-digit)", async () => {
    req.data.phoneNumber = "abc123";
    await handler.beforeCreate(req);
    expect(req.reject.calledWith(400, sinon.match("Phone number must be exactly 10 digits"))).to.be.true;
  });

  it("should reject CREATE with invalid bank account number", async () => {
    req.data.bankAccountNumber = "abcd123";
    await handler.beforeCreate(req);
    expect(req.reject.calledWith(400, sinon.match("Bank Account Number must contain digits only"))).to.be.true;
  });

  it("should reject CREATE if bank account already exists", async () => {
    (global as any).SELECT = {
      one: {
        from: sinon.stub().returns({
          where: sinon.stub().resolves({ ID: "E001" }),
        }),
      },
      from: sinon.stub().resolves([]),
    };
    await handler.beforeCreate(req);
    expect(req.reject.calledWith(400, sinon.match("Bank Account Number already exists"))).to.be.true;
  });

  it("should reject UPDATE if employee not found", async () => {
    (global as any).SELECT = {
      one: {
        from: sinon.stub().returns({
          where: sinon.stub().resolves(undefined),
        }),
      },
    };
    await handler.beforeUpdate(req);
    expect(req.reject.calledWith(404, sinon.match("not found"))).to.be.true;
  });

  it("should reject UPDATE with invalid phone number", async () => {
    req.data.phoneNumber = "99999";
    (global as any).SELECT = {
      one: {
        from: sinon.stub().returns({
          where: sinon.stub().resolves({
            ID: "E001",
            firstName: "John",
            lastName: "Doe",
            bankAccountNumber: "12345678",
          }),
        }),
      },
    };
    await handler.beforeUpdate(req);
    expect(req.reject.calledWith(400, sinon.match("Phone number must be exactly 10 digits"))).to.be.true;
  });

  it("should reject setEmployeeInactive if already inactive", async () => {
    (global as any).SELECT = {
      one: {
        from: sinon.stub().returns({
          where: sinon.stub().resolves({ status: "Inactive" }),
        }),
      },
    };
    await handler.onSetEmployeeInactive(req);
    expect(req.reject.calledWith(400, sinon.match("Already inactive"))).to.be.true;
  });

  it("should reject any action if user is not Admin", async () => {
    req.user.is = () => false;
    await handler.beforeCreate(req);
    expect(req.reject.calledWith(403)).to.be.true;
  });

  it("should reject UPDATE if ratings have duplicate years", async () => {
    req.data.ratings = [
      { year: "2023", ratings: 4 },
      { year: "2023", ratings: 5 },
    ];

    (global as any).SELECT = {
      one: {
        from: sinon.stub().returns({
          where: sinon.stub().resolves({
            ID: "E001",
            firstName: "John",
            lastName: "Doe",
            bankAccountNumber: "12345678",
          }),
        }),
      },
    };

    await handler.beforeUpdate(req);
    expect(req.reject.calledWith(400, sinon.match("Duplicate rating"))).to.be.true;
  });

  it("should reject UPDATE if rating is out of range", async () => {
    req.data.ratings = [{ year: "2023", ratings: 6 }];

    (global as any).SELECT = {
      one: {
        from: sinon.stub().returns({
          where: sinon.stub().resolves({
            ID: "E001",
            firstName: "John",
            lastName: "Doe",
            bankAccountNumber: "12345678",
          }),
        }),
      },
    };

    await handler.beforeUpdate(req);
    expect(req.reject.calledWith(400, sinon.match("must be 1-5"))).to.be.true;
  });

  it("should reject UPDATE if same project is assigned twice", async () => {
    req.data.projects = [
      { project_ID: "P001" },
      { project_ID: "P001" },
    ];

    const employeeStub = sinon.stub().resolves({
      ID: "E001",
      firstName: "John",
      lastName: "Doe",
      bankAccountNumber: "12345678",
    });

    const projectStub = sinon.stub().resolves({ projectDescription: "Project Alpha" });

    const fromStub = sinon.stub();
    fromStub.withArgs("Employees").returns({ where: employeeStub });
    fromStub.withArgs("ProjectsMasterData").returns({ where: projectStub });

    (global as any).SELECT = {
      one: { from: fromStub },
    };

    await handler.beforeUpdate(req);
    expect(req.reject.calledWith(400, sinon.match("Project already assigned"))).to.be.true;
  });

  it("should reject UPDATE if same learning is assigned twice", async () => {
    req.data.learnings = [
      { learning_ID: "L001", status: "In Progress" },
      { learning_ID: "L001", status: "In Progress" },
    ];

    const employeeStub = sinon.stub().resolves({
      ID: "E001",
      firstName: "John",
      lastName: "Doe",
      bankAccountNumber: "12345678",
    });

    const fromStub = sinon.stub();
    fromStub.withArgs("Employees").returns({ where: employeeStub });
    fromStub.withArgs("ProjectsMasterData").returns({ where: sinon.stub().resolves(null) });

    (global as any).SELECT = {
      one: { from: fromStub },
    };

    await handler.beforeUpdate(req);
    expect(req.reject.calledWith(400, sinon.match("Learning already assigned"))).to.be.true;
  });

});