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
            Value : 'Learning Details',
        },
        TypeName : '',
        TypeNamePlural : '',
    },
    UI.SelectionFields : [
        courseDescription,
        courseContact,
        initial,
        availability,
    ],
);

annotate service.LearningsMasterData with {
    courseDescription @(
        Common.FieldControl : #Mandatory,
        Common.Label : '{i18n>Coursedescription}',
    )
};

annotate service.LearningsMasterData with {
    courseContact @Common.FieldControl : #Mandatory
};

annotate service.LearningsMasterData with {
    availability @Common.Label : '{i18n>Availability}'
};

