using my.employee as db from '../db/schema';

service AdminService {
  // @requires: 'Admin'
  @odata.draft.enabled
  entity Employees as projection on db.Employees actions {
        action setEmployeeInactive() returns Employees;
        action deleteEmployeePermanently();
    };

  // @requires: 'Admin'
  entity Projects            as projection on db.Projects;

  // @requires: 'Admin'
  entity Ratings             as projection on db.Ratings;

  // @requires: 'Admin'
  entity Learnings           as projection on db.Learnings;

  // @requires: 'Admin'
  @odata.draft.enabled
  entity LearningsMasterData as projection on db.LearningsMasterData;

  // @requires: 'Admin'
  @odata.draft.enabled
  entity ProjectsMasterData  as projection on db.ProjectsMasterData;
}


annotate AdminService.Employees actions {
  setEmployeeInactive @(
    Core.OperationAvailable: {
      $edmJson: {
        $Eq: [ { $Path: 'in/status' }, 'Active' ]
      }
    }
  );

  deleteEmployeePermanently @(
    Core.OperationAvailable: {
      $edmJson: {
        $Eq: [ { $Path: 'in/status' }, 'Inactive' ]
      }
    }
  );
};
annotate AdminService.Employees with @odata.draft.enabled;
