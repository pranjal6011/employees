using AdminService as service from '../../srv/admin-service';
annotate service.ProjectsMasterData with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : projectName,
            Label : '{i18n>Projectname}',
        },
        {
            $Type : 'UI.DataField',
            Value : projectDescription,
            Label : '{i18n>Projectdescription}',
        },
    ],
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'General Information',
            ID : 'GeneralInformation',
            Target : '@UI.FieldGroup#GeneralInformation',
        },
    ],
    UI.FieldGroup #GeneralInformation : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : ID,
                Label : 'ID',
            },
            {
                $Type : 'UI.DataField',
                Value : projectName,
                Label : '{i18n>Projectname}',
            },
            {
                $Type : 'UI.DataField',
                Value : projectDescription,
                Label : '{i18n>Projectdescription}',
            },
        ],
    },
    UI.HeaderInfo : {
        Title : {
            $Type : 'UI.DataField',
            Value : ID,
        },
        TypeName : '',
        TypeNamePlural : '',
    },
);

annotate service.ProjectsMasterData with {
    projectName @Common.FieldControl : #Mandatory
};

annotate service.ProjectsMasterData with {
    projectDescription @Common.FieldControl : #Mandatory
};

