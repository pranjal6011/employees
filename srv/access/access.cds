using AdminService from '../admin-service';

// here we define the access control for the AdminService

annotate AdminService.Employees with @(restrict: [
  { grant: ['READ'], to: 'User' },
  { grant: ['*'],    to: 'Admin' }
]);

annotate AdminService.Projects with @(restrict: [
  { grant: ['READ'], to: 'User' },
  { grant: ['*'],    to: 'Admin' }
]);

annotate AdminService.Ratings with @(restrict: [
  { grant: ['READ'], to: 'User' },
  { grant: ['*'],    to: 'Admin' }
]);

annotate AdminService.Learnings with @(restrict: [
  { grant: ['READ'], to: 'User' },
  { grant: ['*'],    to: 'Admin' }
]);

annotate AdminService.ProjectsMasterData with @(restrict: [
  { grant: ['READ'], to: 'User' },
  { grant: ['*'],    to: 'Admin' }
]);

annotate AdminService.LearningsMasterData with @(restrict: [
  { grant: ['READ'], to: 'User' },
  { grant: ['*'],    to: 'Admin' }
]);
