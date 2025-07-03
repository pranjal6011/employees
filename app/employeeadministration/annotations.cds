using AdminService as service from '../../srv/admin-service';

annotate service.Employees with @(
    UI.LineItem                      : [
        {
            $Type: 'UI.DataField',
            Value: firstName,
            Label: '{i18n>Firstname}',
        },
        {
            $Type: 'UI.DataField',
            Value: lastName,
            Label: '{i18n>Lastname}',
        },
        {
            $Type: 'UI.DataField',
            Value: phoneNumber,
            Label: '{i18n>Phonenumber}',
        },
        {
            $Type: 'UI.DataField',
            Value: emailId,
            Label: '{i18n>Emailid}',
        },
        {
            $Type: 'UI.DataField',
            Value: address,
            Label: '{i18n>Address}',
        },
        {
            $Type: 'UI.DataField',
            Value: status,
            Label: '{i18n>Status}',
        },
        {
            $Type: 'UI.DataField',
            Value: bankName,
            Label: '{i18n>Bankname}',
        },
    ],
    UI.Facets                        : [{
        $Type : 'UI.ReferenceFacet',
        Label : '{i18n>GeneralInformation}',
        ID    : 'GeneralInformation',
        Target: '@UI.FieldGroup#GeneralInformation',
    },
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>Ratings}',
            ID : 'i18nRatings',
            Target : 'ratings/@UI.LineItem#i18nRatings',
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>EmployeeLearnings}',
            ID : 'i18nEmployeeLearnings',
            Target : 'learnings/@UI.LineItem#i18nEmployeeLearnings',
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>EmployeeProjects}',
            ID : 'i18nEmployeeProjects',
            Target : 'projects/@UI.LineItem#i18nEmployeeProjects',
        }, ],
    UI.FieldGroup #GeneralInformation: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: firstName,
                Label: '{i18n>Firstname}',
            },
            {
                $Type: 'UI.DataField',
                Value: lastName,
                Label: '{i18n>Lastname}',
            },
            {
                $Type: 'UI.DataField',
                Value: emailId,
                Label: '{i18n>Emailid}',
            },
            {
                $Type: 'UI.DataField',
                Value: phoneNumber,
                Label: '{i18n>Phonenumber}',
            },
            {
                $Type: 'UI.DataField',
                Value: status,
                Label: '{i18n>Status}',
            },
            {
                $Type: 'UI.DataField',
                Value: address,
                Label: '{i18n>Address}',
            },
            {
                $Type: 'UI.DataField',
                Value: annualLeavesGranted,
                Label: '{i18n>Annualleavesgranted}',
            },
            {
                $Type: 'UI.DataField',
                Value: annualLeavesUsed,
                Label: '{i18n>Annualleavesused}',
            },
            {
                $Type: 'UI.DataField',
                Value: bankName,
                Label: '{i18n>Bankname}',
            },
            {
                $Type: 'UI.DataField',
                Value: bankAccountNumber,
                Label: '{i18n>Bankaccountnumber}',
            },
            {
                $Type: 'UI.DataField',
                Value: bankCode,
                Label: '{i18n>Bankcode}',
            },
        ],
    },
    UI.Identification : [
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'AdminService.setEmployeeInactive',
            Label : '{i18n>MarkInactive}',
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'AdminService.deleteEmployeePermanently',
            Label : '{i18n>PermanentlyDelete}',
            Criticality : #Positive,
        }
    ],

);



annotate service.Employees with {
    firstName @Common.FieldControl: #Mandatory
};

annotate service.Employees with {
    phoneNumber @Common.FieldControl: #Mandatory
};

annotate service.Employees with {
    status @Common.FieldControl: #Mandatory
};

annotate service.Employees with {
    bankAccountNumber @Common.FieldControl: #Mandatory
};
annotate service.Ratings with @(
    UI.LineItem #i18nRatings : [
        {
            $Type : 'UI.DataField',
            Value : year,
            Label : '{i18n>Year}',
        },
        {
            $Type : 'UI.DataField',
            Value : ratings,
            Label : '{i18n>Ratings}',
        },
    ]
);

annotate service.Learnings with @(
    UI.LineItem #i18nEmployeeLearnings : [
    ]
);

annotate service.Projects with @(
    UI.LineItem #i18nEmployeeProjects : [
    ]
);

