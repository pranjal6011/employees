using my.employee as db from '../db/schema';

service AdminService @(requires: 'authenticated-user'){
    entity Employees           as projection on db.Employees
        actions {
            action setEmployeeInactive()       returns Employees;
            action deleteEmployeePermanently() returns Employees;
        };

    entity Projects            as projection on db.Projects;

    entity Ratings             as projection on db.Ratings;

    entity Learnings           as projection on db.Learnings;

    @odata.draft.enabled
    entity LearningsMasterData as projection on db.LearningsMasterData;

    @odata.draft.enabled
    entity ProjectsMasterData  as projection on db.ProjectsMasterData;
}


annotate AdminService.Employees with @odata.draft.enabled;

// service CustomerService @(requires: 'authenticated-user') {

annotate AdminService.Employees with @(restrict: [
    {
        grant: ['READ'],
        to   : 'User'
    },
    {
        grant: ['*'],
        to   : 'Admin'
    }
]);

annotate AdminService.Projects with @(restrict: [
    {
        grant: ['READ'],
        to   : 'User'
    },
    {
        grant: ['*'],
        to   : 'Admin'
    }
]);

annotate AdminService.Ratings with @(restrict: [
    {
        grant: ['READ'],
        to   : 'User'
    },
    {
        grant: ['*'],
        to   : 'Admin'
    }
]);

annotate AdminService.Learnings with @(restrict: [
    {
        grant: ['READ'],
        to   : 'User'
    },
    {
        grant: ['*'],
        to   : 'Admin'
    }
]);

annotate AdminService.ProjectsMasterData with @(restrict: [
    {
        grant: ['READ'],
        to   : 'User'
    },
    {
        grant: ['*'],
        to   : 'Admin'
    }
]);

annotate AdminService.LearningsMasterData with @(restrict: [
    {
        grant: ['READ'],
        to   : 'User'
    },
    {
        grant: ['*'],
        to   : 'Admin'
    }
]);

// }

annotate AdminService.Employees actions {
    setEmployeeInactive       @(
        requires: 'Admin',
        Core.OperationAvailable: {$edmJson: {$Eq: [
            {$Path: 'in/status'},
            'Active'
        ]}},
        Common.SideEffects     : {
            SourceEntities  : ['/Employees'],
            TargetProperties: ['in/status'],
        }
    );

    deleteEmployeePermanently @(
        requires: 'Admin',
        Core.OperationAvailable: {$edmJson: {$Eq: [
            {$Path: 'in/status'},
            'Inactive'
        ]}},
        
        Common.SideEffects     : {
            SourceEntities: ['/Employees'],
            TargetEntities: ['/Employees'],
        },

    );
};