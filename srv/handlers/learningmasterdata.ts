import cds from "@sap/cds";

// This handler manages access control for learning master data operations
export class LearningMasterHandler {

  // Constructor to initialize the handler with necessary services
  constructor(
    private readonly Learnings: any,
    private readonly LearningsMasterData: any
  ) { }

  // Methods to handle access control for learning master data operations
  private beforeCreateOrUpdateLearningMaster = async (req: any) => {
    if (!req.user?.is("Admin")) {
      return req.reject(403, "You don't have access to create or update learning master data.");
    }
  };

  // Method to check if learning master data can be deleted
  private beforeDeleteLearningMaster = async (req: any) => {
    if (!req.user?.is("Admin")) {
      return req.reject(403, "You don't have access to delete learning master data.");
    }

    const ID = req.data.ID;
    const referenced = await cds.run(SELECT.one.from(this.Learnings).where({ learning_ID: ID }));
    if (referenced) {
      return req.reject(400, "Cannot delete: This learning is still assigned to an employee.");
    }
  };

  // Method to register the service with the handler
  public register(service: any) {
    service.before("DELETE", this.LearningsMasterData, this.beforeDeleteLearningMaster);
    service.before(["CREATE", "UPDATE"], this.LearningsMasterData, this.beforeCreateOrUpdateLearningMaster);
  }
}