export function registerProjectHooks(service: any, Projects: any, ProjectsMasterData: any) {
  // Prevent duplicate project assignments
  service.before("CREATE", Projects, async (req: any) => {
    try {
      if (!req.user?.is('Admin')) {
        return req.reject(403, "You don't have access to create a project assignment.");
      }
      const { employee_ID, project_ID } = req.data;

      if (!employee_ID || !project_ID) {
        return req.reject(400, "'employee_ID' and 'project_ID' are required.");
      }

      const exists = await SELECT.one.from(Projects).where({
        employee_ID,
        project_ID
      });

      if (exists) {
        return req.reject(400, "This project is already assigned to the employee.");
      }
    } catch (error) {
      console.error("Error validating project creation:", error);
      return req.reject(500, "Internal error while validating project assignment.");
    }
  });

  // Auto-update projectDescription from ProjectsMasterData
  service.before(["CREATE", "UPDATE"], Projects, async (req: any) => {
    try {
      const { project_ID } = req.data;
      if (!project_ID) return;

      const master = await SELECT.one.from(ProjectsMasterData).where({ ID: project_ID });
      if (master) {
        req.data.projectDescription = master.projectDescription;
      }
    } catch (error) {
      console.error("Error syncing project description from master data:", error);
      return req.reject(500, "Failed to fetch project master description.");
    }
  });
}
