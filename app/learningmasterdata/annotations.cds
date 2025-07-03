using AdminService as service from '../../srv/admin-service';
annotate service.LearningsMasterData with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : courseDescription,
            Label : '{i18n>Coursedescription}',
        },
        {
            $Type : 'UI.DataField',
            Value : courseContact,
            Label : '{i18n>Coursecontact}',
        },
    ],
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>GeneralInformation}',
            ID : 'GeneralInformation',
            Target : '@UI.FieldGroup#GeneralInformation',
        },
    ],
    UI.FieldGroup #GeneralInformation : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : courseDescription,
                Label : 'courseDescription',
            },
            {
                $Type : 'UI.DataField',
                Value : courseContact,
                Label : 'courseContact',
            },
            {
                $Type : 'UI.DataField',
                Value : availability,
                Label : 'availability',
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

annotate service.LearningsMasterData with {
    courseDescription @Common.FieldControl : #Mandatory
};

annotate service.LearningsMasterData with {
    courseContact @Common.FieldControl : #Mandatory
};

