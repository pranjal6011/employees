using AdminService from '../admin-service';

annotate AdminService.Employees actions {
  setEmployeeInactive @(
    requires: 'Admin',
    Core.OperationAvailable: {
      $edmJson: {
        $Eq: [ { $Path: 'in/status' }, 'Active' ]
      }
    },
    Common.SideEffects: {
      SourceEntities: ['/Employees'],
      TargetProperties: ['in/status']
    }
  );
};