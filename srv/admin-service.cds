using my.employee as db from '../db/schema';
using from './access/access';
using from './actions/employee-actions';

service AdminService @(requires: 'authenticated-user') {
  @odata.draft.enabled
  entity Employees           as projection on db.Employees
    actions {
      @odata.draft.bypass
      action setEmployeeInactive() returns Employees;
    };

  entity Projects            as projection on db.Projects;
  entity Ratings             as projection on db.Ratings;
  entity Learnings           as projection on db.Learnings;
  @odata.draft.enabled
  entity LearningsMasterData as projection on db.LearningsMasterData;
  @odata.draft.enabled
  entity ProjectsMasterData  as projection on db.ProjectsMasterData;
}
