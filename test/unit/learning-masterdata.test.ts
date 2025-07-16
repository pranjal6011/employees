import { expect } from "chai";
import sinon from "sinon";
import { describe, beforeEach, afterEach, it } from "mocha";
import { LearningMasterHandler } from "../../srv/handlers/learningmasterdata";
import cds from "@sap/cds";

let req: any;
let handler: LearningMasterHandler;
let cdsRunStub: sinon.SinonStub;

describe("LearningMasterHandler Tests", () => {
  beforeEach(() => {
    cdsRunStub = sinon.stub(cds, "run");
    req = {
      data: { ID: "L001" },
      user: { is: (role: string) => role === "Admin" },
      reject: sinon.stub(),
    };

    handler = new LearningMasterHandler("Learnings", "LearningsMasterData");
  });

  afterEach(() => {
    sinon.restore();
  });

  const getHookFromRegister = (hookType: string, target: string) => {
    const hookMap: Record<string, any> = {};
    const mockService = {
      before: (events: any, entity: any, fn: any) => {
        const key = `${events}_${entity}`;
        hookMap[key] = fn;
      },
    };
    handler.register(mockService);
    return hookMap[`${hookType}_${target}`];
  };

  it("should reject DELETE if learning is still referenced", async () => {
    cdsRunStub.resolves({ ID: "L001" });

    const deleteHook = getHookFromRegister("DELETE", "LearningsMasterData");
    await deleteHook(req);

    expect(req.reject.calledWith(400, sinon.match("still assigned"))).to.be.true;
  });

  it("should allow DELETE if learning is not referenced", async () => {
    cdsRunStub.resolves(null);

    const deleteHook = getHookFromRegister("DELETE", "LearningsMasterData");
    await deleteHook(req);

    expect(req.reject.called).to.be.false;
  });

  it("should reject DELETE if user is not admin", async () => {
    req.user.is = () => false;
    const deleteHook = getHookFromRegister("DELETE", "LearningsMasterData");
    await deleteHook(req);

    expect(req.reject.calledWith(403, sinon.match("access"))).to.be.true;
  });

  it("should reject CREATE/UPDATE if user is not admin", async () => {
    req.user.is = () => false;
    const createOrUpdateHook = getHookFromRegister("CREATE,UPDATE", "LearningsMasterData")
      || getHookFromRegister("CREATE", "LearningsMasterData");

    await createOrUpdateHook(req);
    expect(req.reject.calledWith(403, sinon.match("access"))).to.be.true;
  });

});
