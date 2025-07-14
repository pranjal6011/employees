import { expect } from "chai";
import sinon from "sinon";
import { describe, it, beforeEach, afterEach } from "mocha";
import { EmployeeHandler } from "../srv/handlers/employee";
import cds from "@sap/cds";

describe("Employee Handler Tests", () => {
  let req: any;
  let handler: EmployeeHandler;
  let cdsRunStub: sinon.SinonStub;

  beforeEach(() => {
    cdsRunStub = sinon.stub(cds, "run");
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
    handler = new EmployeeHandler("Employees", "ProjectsMasterData", "LearningsMasterData");
    sinon.stub(handler as any, "generateUniqueEmail").resolves("john.doe@sap.com");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should generate a unique email for new employee on CREATE", async () => {
    cdsRunStub.onFirstCall().resolves([]);  // bank account check
    cdsRunStub.onSecondCall().resolves([]); // existing emails
    cdsRunStub.onThirdCall().resolves([]);  // initial learnings
    await handler.beforeCreate(req);
    expect(req.data.emailId).to.equal("john.doe@sap.com");
  });

  it("should generate a different email if base email already exists", async () => {
    sinon.restore();
    cdsRunStub = sinon.stub(cds, "run");
    handler = new EmployeeHandler("Employees", "ProjectsMasterData", "LearningsMasterData");
    sinon.stub(handler as any, "generateUniqueEmail").resolves("john.doe1@sap.com");
    cdsRunStub.onFirstCall().resolves([]);  // bank account
    cdsRunStub.onSecondCall().resolves([{ emailId: "john.doe@sap.com" }]); // existing emails
    cdsRunStub.onThirdCall().resolves([]);  // initial learnings
    await handler.beforeCreate(req);
    expect(req.data.emailId).to.equal("john.doe1@sap.com");
  });

  it("should regenerate email if firstName or lastName changed on UPDATE", async () => {
    sinon.restore();
    cdsRunStub = sinon.stub(cds, "run");
    handler = new EmployeeHandler("Employees", "ProjectsMasterData", "LearningsMasterData");
    sinon.stub(handler as any, "generateUniqueEmail").resolves("jane.doe@sap.com");
    req.data.firstName = "Jane";
    cdsRunStub.onFirstCall().resolves({
      ID: "E001",
      firstName: "John",
      lastName: "Doe",
      bankAccountNumber: "12345678",
    });
    cdsRunStub.onSecondCall().resolves([]); // bank account check
    await handler.beforeUpdate(req);
    expect(req.data.emailId).to.equal("jane.doe@sap.com");
  });

  it("should reject CREATE with invalid phone number (not 10 digits)", async () => {
    req.data.phoneNumber = "12345";
    cdsRunStub.onFirstCall().resolves([]);
    cdsRunStub.onSecondCall().resolves([]);
    cdsRunStub.onThirdCall().resolves([]);
    await handler.beforeCreate(req);
    expect(req.reject.calledWith(400, sinon.match("Phone number must be exactly 10 digits"))).to.be.true;
  });

  it("should reject CREATE with invalid phone number (non-digit)", async () => {
    req.data.phoneNumber = "abc123";
    cdsRunStub.onFirstCall().resolves([]);
    cdsRunStub.onSecondCall().resolves([]);
    cdsRunStub.onThirdCall().resolves([]);
    await handler.beforeCreate(req);
    expect(req.reject.calledWith(400, sinon.match("Phone number must be exactly 10 digits"))).to.be.true;
  });

  it("should reject CREATE with invalid bank account number", async () => {
    req.data.bankAccountNumber = "abcd123";
    cdsRunStub.onFirstCall().resolves([]);
    cdsRunStub.onSecondCall().resolves([]);
    cdsRunStub.onThirdCall().resolves([]);
    await handler.beforeCreate(req);
    expect(req.reject.calledWith(400, sinon.match("Bank Account Number must contain digits only"))).to.be.true;
  });

  it("should reject CREATE if bank account already exists", async () => {
    cdsRunStub.onFirstCall().resolves({ ID: "E001" });
    cdsRunStub.onSecondCall().resolves([]);
    cdsRunStub.onThirdCall().resolves([]);
    await handler.beforeCreate(req);
    expect(req.reject.calledWith(400, sinon.match("Bank Account Number already exists"))).to.be.true;
  });

  it("should reject UPDATE if employee not found", async () => {
    cdsRunStub.resolves(null);
    await handler.beforeUpdate(req);
    expect(req.reject.calledWith(404, sinon.match("Employee not found"))).to.be.true;
  });

  it("should reject UPDATE with invalid phone number", async () => {
    req.data.phoneNumber = "99999";
    cdsRunStub.onFirstCall().resolves({
      ID: "E001",
      firstName: "John",
      lastName: "Doe",
      bankAccountNumber: "12345678",
    });
    await handler.beforeUpdate(req);
    expect(req.reject.calledWith(400, sinon.match("Phone number must be exactly 10 digits"))).to.be.true;
  });

  it("should reject setEmployeeInactive if already inactive", async () => {
    cdsRunStub.resolves({ status_code: "I" });
    await handler.onSetEmployeeInactive(req);
    expect(req.reject.calledWith(400, sinon.match("Already inactive"))).to.be.true;
  });

  it("should reject any action if user is not Admin", async () => {
    req.user.is = () => false;
    cdsRunStub.onFirstCall().resolves([]);
    cdsRunStub.onSecondCall().resolves([]);
    cdsRunStub.onThirdCall().resolves([]);
    await handler.beforeCreate(req);
    expect(req.reject.calledWith(403)).to.be.true;
  });

  it("should reject UPDATE if ratings have duplicate years", async () => {
    req.data.ratings = [
      { year: "2023", ratings: 4 },
      { year: "2023", ratings: 5 },
    ];
    cdsRunStub.resolves({
      ID: "E001",
      firstName: "John",
      lastName: "Doe",
      bankAccountNumber: "12345678",
    });
    await handler.beforeUpdate(req);
    expect(req.reject.calledWith(400, sinon.match("Duplicate rating"))).to.be.true;
  });

  it("should reject UPDATE if rating is out of range", async () => {
    req.data.ratings = [{ year: "2023", ratings: 6 }];
    cdsRunStub.resolves({
      ID: "E001",
      firstName: "John",
      lastName: "Doe",
      bankAccountNumber: "12345678",
    });
    await handler.beforeUpdate(req);
    expect(req.reject.calledWith(400, sinon.match("must be between 1 and 5"))).to.be.true;
  });

  it("should reject UPDATE if same project is assigned twice", async () => {
    req.data.projects = [
      { project_ID: "P001" },
      { project_ID: "P001" },
    ];
    cdsRunStub.resolves({
      ID: "E001",
      firstName: "John",
      lastName: "Doe",
      bankAccountNumber: "12345678",
    });
    await handler.beforeUpdate(req);
    expect(req.reject.calledWith(400, sinon.match("Project already assigned"))).to.be.true;
  });

  it("should reject UPDATE if same learning is assigned twice", async () => {
    req.data.learnings = [
      { learning_ID: "L001", status_code: "IP" },
      { learning_ID: "L001", status_code: "IP" },
    ];
    cdsRunStub.onFirstCall().resolves({
      ID: "E001",
      firstName: "John",
      lastName: "Doe",
      bankAccountNumber: "12345678",
    });
    cdsRunStub.onSecondCall().resolves([]); // fetch initial learnings
    await handler.beforeUpdate(req);
    expect(req.reject.calledWith(400, sinon.match("Learning already assigned"))).to.be.true;
  });
});
