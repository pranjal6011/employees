import cds from "@sap/cds";
import { EmployeeHandler } from "./handlers/employee";
import { ProjectMasterHandler } from "./handlers/projectmasterdata";
import { LearningMasterHandler  } from "./handlers/learningmasterdata";

export default cds.service.impl(async function () {
  const { Employees, Learnings, LearningsMasterData, Projects, ProjectsMasterData } = this.entities;

  new EmployeeHandler(Employees, ProjectsMasterData, LearningsMasterData).register(this);
  new ProjectMasterHandler(Projects, ProjectsMasterData).register(this);
  new LearningMasterHandler(Learnings, LearningsMasterData).register(this);
});