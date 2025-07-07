export async function beforeDeleteLearningMaster(req: any, Learnings: any) {
  if (!req.user?.is("Admin")) {
    return req.reject(403, "You don't have access to delete learning master data.");
  }

  const ID = req.data.ID;
  const referenced = await SELECT.one.from(Learnings).where({ learning_ID: ID });
  if (referenced) {
    return req.reject(400, "Cannot delete: This learning is still assigned to an employee.");
  }
}

export async function beforeCreateOrUpdateLearningMaster(req: any) {
  if (!req.user?.is("Admin")) {
    return req.reject(403, "You don't have access to create or update learning master data.");
  }
}

export function registerLearningmasterHooks(service: any, Learnings: any, LearningsMasterData: any) {
  service.before("DELETE", LearningsMasterData, (req: any) =>
    beforeDeleteLearningMaster(req, Learnings)
  );

  service.before(["CREATE", "UPDATE"], LearningsMasterData, (req: any) =>
    beforeCreateOrUpdateLearningMaster(req)
  );
}