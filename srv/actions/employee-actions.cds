using AdminService from '../admin-service';

// here we define the actions for the AdminService
annotate AdminService.Employees actions {
  setEmployeeInactive @(
    requires: 'Admin',
    Core.OperationAvailable: {
      $edmJson: {
        $Eq: [ { $Path: 'in/status_code' }, 'A' ]
      }
    },
    Common.SideEffects: {
      SourceEntities: ['/Employees'],
      TargetProperties: ['in/status_code']
    }
  );
};