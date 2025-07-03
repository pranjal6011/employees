export function registerProjectHooks(service: any, Projects: any) {
  service.before("CREATE", Projects, async (req: any) => {
    const { employee_ID, project_ID } = req.data;

    const exists = await SELECT.one.from(Projects).where({
      employee_ID,
      project_ID
    });

    if (exists) {
      req.reject(400, "This project is already assigned to the employee.");
    }
  });
}