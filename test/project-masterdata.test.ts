import { expect } from "chai";
import sinon from "sinon";
import * as projectHooks from "../srv/handlers/projectmasterdata";


describe("Project MasterData Hook Tests", () => {
  let req: any;

  beforeEach(() => {
    req = {
      data: { ID: "P001" },
      user: { is: (role: string) => role === "Admin" },
      reject: sinon.stub(),
    };

    (global as any).SELECT = {
      one: {
        from: () => ({
          where: async () => null,
        }),
      },
    };
  });

  afterEach(() => {
    delete (global as any).SELECT;
    sinon.restore();
  });

  it("should reject DELETE if project is still assigned to employee", async () => {
    (global as any).SELECT = {
      one: {
        from: () => ({
          where: async () => ({ ID: "P001" }),
        }),
      },
    };
    await projectHooks.beforeDeleteProjectMaster(req, "Projects");
    expect(req.reject.calledWith(400, sinon.match("still assigned"))).to.be.true;
  });

  it("should reject DELETE if user is not admin", async () => {
    req.user.is = () => false;
    await projectHooks.beforeDeleteProjectMaster(req, "Projects");
    expect(req.reject.calledWith(403)).to.be.true;
  });

  it("should reject CREATE if user is not admin", async () => {
    req.user.is = () => false;
    await projectHooks.beforeCreateOrUpdateProjectMaster(req);
    expect(req.reject.calledWith(403)).to.be.true;
  });
});
