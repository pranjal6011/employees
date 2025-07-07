import { expect } from "chai";
import sinon from "sinon";
import * as learningHooks from "../srv/handlers/learningmasterdata";


let req: any;

describe("Learning Master Hook Tests", () => {
  beforeEach(() => {
    req = {
      data: {
        ID: "L001",
      },
      user: {
        is: (role: string) => role === "Admin",
      },
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

  it("should reject DELETE if learning is still referenced", async () => {
    (global as any).SELECT = {
      one: {
        from: () => ({
          where: async () => ({ ID: "L001" }),
        }),
      },
    };
    await learningHooks.beforeDeleteLearningMaster(req, "Learnings");
    expect(req.reject.calledWith(400, sinon.match("still assigned"))).to.be.true;
  });

  it("should reject DELETE if user is not admin", async () => {
    req.user.is = () => false;
    await learningHooks.beforeDeleteLearningMaster(req, "Learnings");
    expect(req.reject.calledWith(403, sinon.match("access"))).to.be.true;
  });

  it("should reject CREATE/UPDATE if user is not admin", async () => {
    req.user.is = () => false;
    await learningHooks.beforeCreateOrUpdateLearningMaster(req);
    expect(req.reject.calledWith(403, sinon.match("access"))).to.be.true;
  });
});
