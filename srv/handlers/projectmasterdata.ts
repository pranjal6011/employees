export class ProjectMasterHandler {
  constructor(
    private readonly Projects: any,
    private readonly ProjectsMasterData: any
  ) {}

  public register(service: any) {
    service.before("DELETE", this.ProjectsMasterData, this.beforeDeleteProjectMaster);
    service.before(["CREATE", "UPDATE"], this.ProjectsMasterData, this.beforeCreateOrUpdateProjectMaster);
  }

  private beforeCreateOrUpdateProjectMaster = async (req: any) => {
    if (!req.user?.is("Admin")) {
      return req.reject(403, "You don't have access to create or update project master data.");
    }
  };

  private beforeDeleteProjectMaster = async (req: any) => {
    if (!req.user?.is("Admin")) {
      return req.reject(403, "You don't have access to delete project master data.");
    }

    const ID = req.data.ID;
    const referenced = await SELECT.one.from(this.Projects).where({ project_ID: ID });
    if (referenced) {
      return req.reject(400, "Cannot delete: This project is still assigned to an employee.");
    }
  };
}