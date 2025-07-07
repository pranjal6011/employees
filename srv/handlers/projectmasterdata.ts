export async function beforeDeleteProjectMaster(req: any, Projects: any) {
  if (!req.user?.is("Admin")) {
    return req.reject(403, "You don't have access to delete project master data.");
  }

  const ID = req.data.ID;
  const referenced = await SELECT.one.from(Projects).where({ project_ID: ID });
  if (referenced) {
    return req.reject(400, "Cannot delete: This project is still assigned to an employee.");
  }
}

export async function beforeCreateOrUpdateProjectMaster(req: any) {
  if (!req.user?.is("Admin")) {
    return req.reject(403, "You don't have access to create or update project master data.");
  }
}

export function registerProjectmasterHooks(service: any, Projects: any, ProjectsMasterData: any) {
  service.before("DELETE", ProjectsMasterData, (req: any) =>
    beforeDeleteProjectMaster(req, Projects)
  );

  service.before(["CREATE", "UPDATE"], ProjectsMasterData, (req: any) =>
    beforeCreateOrUpdateProjectMaster(req)
  );
}