import cds from "@sap/cds";
import { registerEmployeeHooks } from "./handlers/employee";
import { registerRatingHooks } from "./handlers/rating";
import { registerLearningHooks } from "./handlers/learning";
import { registerProjectHooks } from "./handlers/project";
import { registerProjectmasterHooks } from "./handlers/projectmasterdata";
import { registerLearningmasterHooks } from "./handlers/learningmasterdata";
export default cds.service.impl(async function () {
  const { Employees, Ratings, Learnings, LearningsMasterData, Projects, ProjectsMasterData} = this.entities;

  registerEmployeeHooks(this, Employees, Learnings, LearningsMasterData );
  // registerRatingHooks(this, Ratings);
  // registerLearningHooks(this, Learnings);
  // registerProjectHooks(this, Projects, ProjectsMasterData);
  registerProjectmasterHooks(this, Projects, ProjectsMasterData);
  registerLearningmasterHooks(this, Learnings, LearningsMasterData);

  return this;
});