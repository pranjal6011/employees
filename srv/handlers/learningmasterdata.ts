export function registerLearningmasterHooks(service: any, Learnings: any, LearningsMasterData: any) {
  // Prevent deletion of learning master data if referenced
  service.before("DELETE", LearningsMasterData, async (req: any) => {
    const ID = req.data.ID;

    const referenced = await SELECT.one.from(Learnings).where({ learning_ID: ID });
    if (referenced) {
      return req.reject(400, "Cannot delete: This learning is still assigned to an employee.");
    }
  });

  // Existing logic for duplicate validation, full update enforcement etc...
}
