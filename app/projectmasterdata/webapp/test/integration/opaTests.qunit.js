sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'projectmasterdata/test/integration/FirstJourney',
		'projectmasterdata/test/integration/pages/ProjectsMasterDataList',
		'projectmasterdata/test/integration/pages/ProjectsMasterDataObjectPage'
    ],
    function(JourneyRunner, opaJourney, ProjectsMasterDataList, ProjectsMasterDataObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('projectmasterdata') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheProjectsMasterDataList: ProjectsMasterDataList,
					onTheProjectsMasterDataObjectPage: ProjectsMasterDataObjectPage
                }
            },
            opaJourney.run
        );
    }
);