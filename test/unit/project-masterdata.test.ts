import { expect } from "chai";
import sinon from "sinon";
import { describe, beforeEach, afterEach, it } from "mocha";
import { ProjectMasterHandler } from "../../srv/handlers/projectmasterdata";
import cds from "@sap/cds";

let req: any;
let handler: ProjectMasterHandler;
let cdsRunStub: sinon.SinonStub;

describe("ProjectMasterHandler Tests", () => {
  beforeEach(() => {
    cdsRunStub = sinon.stub(cds, "run");
    req = {
      data: { ID: "P001" },
      user: { is: (role: string) => role === "Admin" },
      reject: sinon.stub(),
    };

    handler = new ProjectMasterHandler("Projects", "ProjectsMasterData");
  });

  afterEach(() => {
    sinon.restore();
  });

  const getHookFromRegister = (hookType: string, target: string) => {
    const hookMap: Record<string, any> = {};
    const mockService = {
      before: (events: any, entity: any, fn: any) => {
        const key = `${Array.isArray(events) ? events.join(",") : events}_${entity}`;
        hookMap[key] = fn;
      },
    };
    handler.register(mockService);
    return hookMap[`${hookType}_${target}`];
  };

  it("should reject DELETE if project is still assigned to employee", async () => {
    cdsRunStub.resolves({ ID: "P001" }); // Simulate project is referenced
    const deleteHook = getHookFromRegister("DELETE", "ProjectsMasterData");
    await deleteHook(req);
    expect(req.reject.calledWith(400, sinon.match("still assigned"))).to.be.true;
  });

  it("should allow DELETE if project is not referenced", async () => {
      cdsRunStub.resolves(null);
  
      const deleteHook = getHookFromRegister("DELETE", "ProjectsMasterData");
      await deleteHook(req);
  
      expect(req.reject.called).to.be.false;
    });

  it("should reject DELETE if user is not admin", async () => {
    req.user.is = () => false;
    const deleteHook = getHookFromRegister("DELETE", "ProjectsMasterData");
    await deleteHook(req);
    expect(req.reject.calledWith(403)).to.be.true;
  });

  it("should reject CREATE or UPDATE if user is not admin", async () => {
    req.user.is = () => false;
    const createOrUpdateHook = getHookFromRegister("CREATE,UPDATE", "ProjectsMasterData");
    await createOrUpdateHook(req);
    expect(req.reject.calledWith(403)).to.be.true;
  });
});
