import { expect } from "chai";
import sinon from "sinon";
import * as helpers from "../srv/utils/helpers";

describe("Helper - generateUniqueEmail", () => {
  beforeEach(() => {
    (global as any).SELECT = {
      one: {
        from: () => ({
          where: sinon.stub().resolves(undefined),
        }),
      },
    };
  });

  afterEach(() => {
    delete (global as any).SELECT;
    sinon.restore();
  });

  it("should return base email if no conflict", async () => {
    const email = await helpers.generateUniqueEmail("John", "Doe", "Employees");
    expect(email).to.equal("john.doe@sap.com");
  });

  it("should append number if email conflict exists", async () => {
    const whereStub = sinon.stub();
    whereStub.onFirstCall().resolves({ ID: "E001" });
    whereStub.onSecondCall().resolves(undefined);

    (global as any).SELECT = {
      one: {
        from: () => ({
          where: whereStub,
        }),
      },
    };

    const email = await helpers.generateUniqueEmail("John", "Doe", "Employees");
    expect(email).to.equal("john.doe1@sap.com");
  });
});