using {
  managed
} from '@sap/cds/common';

namespace my.employee;

type StatusEnum : String enum {
  Active = 'Active';
  Inactive = 'Inactive';
}

entity Employees : managed {
      key ID              : UUID @Core.Computed;
      firstName           : String(100);
      lastName            : String(100);
      emailId             : String(100) @unique;
      address             : String(255);
      phoneNumber         : String(15);
      status              : StatusEnum default 'Active';
      bankName            : String(100);
      bankAccountNumber   : String(50)  @unique;
      bankCode            : String(20);
      annualLeavesGranted : Integer default 20;
      annualLeavesUsed    : Integer default 0;
      remainingLeaves     : Integer @cds.virtual;
      deleteHidden        : Boolean @cds.virtual;


      projects            : Composition of many Projects
                              on projects.employee = $self;
      learnings           : Composition of many Learnings
                              on learnings.employee = $self;
      ratings             : Composition of many Ratings
                              on ratings.employee = $self;
}

entity Projects : managed {
  key ID: UUID @Core.Computed;
  employee           : Association to Employees;
  project            : Association to ProjectsMasterData;
  projectDescription : String(255);
}

entity Ratings : managed {
  key ID: UUID @Core.Computed;
  employee   : Association to Employees;
  year       : String(4);
  ratings    : Integer;
  reviewer : Association to Employees ;
}

type LearningStatusEnum : String enum {
  NotYetStarted = 'Not Yet Started';
  InProgress    = 'In Progress';
  Completed     = 'Completed';
}


entity Learnings : managed {
  key ID: UUID @Core.Computed;
  employee : Association to Employees;
  learning : Association to LearningsMasterData;
  status   : LearningStatusEnum default 'Not Yet Started';
}

entity LearningsMasterData : managed {
  key ID: UUID @Core.Computed;
  courseDescription : String(255);
  availability      : Boolean;
  initial           : Boolean;
  courseContact     : String(100);
}

entity ProjectsMasterData : managed {
  key ID: UUID @Core.Computed;
  projectName        : String(150);
  projectDescription : String(255);
}
