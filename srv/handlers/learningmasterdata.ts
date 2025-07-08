export class LearningMasterHandler {
  constructor(
    private readonly Learnings: any,
    private readonly LearningsMasterData: any
  ) {}

  public register(service: any) {
    service.before("DELETE", this.LearningsMasterData, this.beforeDeleteLearningMaster);
    service.before(["CREATE", "UPDATE"], this.LearningsMasterData, this.beforeCreateOrUpdateLearningMaster);
  }

  private beforeCreateOrUpdateLearningMaster = async (req: any) => {
    if (!req.user?.is("Admin")) {
      return req.reject(403, "You don't have access to create or update learning master data.");
    }
  };

  private beforeDeleteLearningMaster = async (req: any) => {
    if (!req.user?.is("Admin")) {
      return req.reject(403, "You don't have access to delete learning master data.");
    }

    const ID = req.data.ID;
    const referenced = await SELECT.one.from(this.Learnings).where({ learning_ID: ID });
    if (referenced) {
      return req.reject(400, "Cannot delete: This learning is still assigned to an employee.");
    }
  };
}