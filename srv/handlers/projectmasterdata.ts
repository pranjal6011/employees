import { log } from "console";

export function registerProjectmasterHooks(service: any, Projects: any, ProjectsMasterData: any) {
    // Prevent deletion of project master data if referenced
    service.before("DELETE", ProjectsMasterData, async (req: any) => {
        const ID = req.data.ID;

        const referenced = await SELECT.one.from(Projects).where({ project_ID: ID });
        console.log("Checking if project master data is referenced:", ID, referenced);
        if (referenced) {
            return req.reject(400, "Cannot delete: This project is still assigned to an employee.");
        }
    });
}
