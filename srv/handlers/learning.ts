// handlers/learnings.ts
export function registerLearningHooks(service: any, Learnings: any) {
  service.before("CREATE", Learnings, async (req: any) => {
    const { employee_ID, learning_ID } = req.data;

    const exists = await SELECT.one.from(Learnings).where({
      employee_ID,
      learning_ID,
    });

    if (exists) {
      req.reject(400, "This learning is already assigned to the employee.");
    }
  });
}