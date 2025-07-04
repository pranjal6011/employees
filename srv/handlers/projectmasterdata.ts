export function registerProjectHooks(service: any, Projects: any, ProjectsMasterData: any) {
  // Prevent deletion of project master data if referenced
  service.before("DELETE", ProjectsMasterData, async (req: any) => {
    const ID = req.data.ID;

    const referenced = await SELECT.one.from(Projects).where({ project_ID: ID });

    if (referenced) {
      return req.reject(400, "Cannot delete: This project is still assigned to an employee.");
    }
  });
}
