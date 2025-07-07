import cds from "@sap/cds";
import { registerEmployeeHooks } from "./handlers/employee";
import { registerProjectmasterHooks } from "./handlers/projectmasterdata";
import { registerLearningmasterHooks } from "./handlers/learningmasterdata";
export default cds.service.impl(async function () {
  const { Employees, Ratings, Learnings, LearningsMasterData, Projects, ProjectsMasterData} = this.entities;

  registerEmployeeHooks(this, Employees, ProjectsMasterData);
  registerProjectmasterHooks(this, Projects, ProjectsMasterData);
  registerLearningmasterHooks(this, Learnings, LearningsMasterData);

  return this;
});