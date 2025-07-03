sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'learningmasterdata/test/integration/FirstJourney',
		'learningmasterdata/test/integration/pages/LearningsMasterDataList',
		'learningmasterdata/test/integration/pages/LearningsMasterDataObjectPage'
    ],
    function(JourneyRunner, opaJourney, LearningsMasterDataList, LearningsMasterDataObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('learningmasterdata') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheLearningsMasterDataList: LearningsMasterDataList,
					onTheLearningsMasterDataObjectPage: LearningsMasterDataObjectPage
                }
            },
            opaJourney.run
        );
    }
);