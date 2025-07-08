import { expect } from "chai";
import sinon from "sinon";
import { describe, beforeEach, afterEach, it } from "mocha";
import { LearningMasterHandler } from "../srv/handlers/learningmasterdata";

let req: any;
let handler: LearningMasterHandler;

describe("LearningMasterHandler Tests", () => {
  beforeEach(() => {
    req = {
      data: { ID: "L001" },
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
    handler = new LearningMasterHandler("Learnings", "LearningsMasterData");

  });

  afterEach(() => {
    delete (global as any).SELECT;
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
    const mockSelect = sinon.stub().resolves({ ID: "L001" });
    (global as any).SELECT.one.from = () => ({ where: mockSelect });

    const deleteHook = getHookFromRegister("DELETE", "LearningsMasterData");
    await deleteHook(req);
    expect(req.reject.calledWith(400, sinon.match("still assigned"))).to.be.true;
  });

  it("should reject DELETE if user is not admin", async () => {
    req.user.is = () => false;
    const deleteHook = getHookFromRegister("DELETE", "LearningsMasterData");
    await deleteHook(req);
    expect(req.reject.calledWith(403, sinon.match("access"))).to.be.true;
  });

  it("should reject CREATE/UPDATE if user is not admin", async () => {
    req.user.is = () => false;
    const createOrUpdateHook = getHookFromRegister("CREATE,UPDATE", "LearningsMasterData") || getHookFromRegister("CREATE", "LearningsMasterData");
    await createOrUpdateHook(req);
    expect(req.reject.calledWith(403, sinon.match("access"))).to.be.true;
  });
});