import cds from "@sap/cds";
// This handler manages access control for project master data operations
export class ProjectMasterHandler {

  // Constructor to initialize the handler with necessary services
  constructor(
    private readonly Projects: any,
    private readonly ProjectsMasterData: any
  ) {}

  // Method to handle access control for project master data creation or update
  private beforeCreateOrUpdateProjectMaster = async (req: any) => {
    if (!req.user?.is("Admin")) {
      return req.reject(403, "You don't have access to create or update project master data.");
    }
  };

  // Method to check if project master data can be deleted
  private beforeDeleteProjectMaster = async (req: any) => {
    if (!req.user?.is("Admin")) {
      return req.reject(403, "You don't have access to delete project master data.");
    }

    const ID = req.data.ID;
    const referenced = await cds.run(SELECT.one.from(this.Projects).where({ project_ID: ID }));
    if (referenced) {
      return req.reject(400, "Cannot delete: This project is still assigned to an employee.");
    }
  };

  // Method to register the service with the handler
  public register(service: any) {
    service.before("DELETE", this.ProjectsMasterData, this.beforeDeleteProjectMaster);
    service.before(["CREATE", "UPDATE"], this.ProjectsMasterData, this.beforeCreateOrUpdateProjectMaster);
  }
}