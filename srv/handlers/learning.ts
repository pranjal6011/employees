export function registerLearningHooks(service: any, Learnings: any) {

  // Prevent duplicate assignment on CREATE
  service.before("CREATE", Learnings, async (req: any) => {
    try {
      const { employee_ID, learning_ID } = req.data;

      if (!employee_ID || !learning_ID) {
        return req.reject(400, "Both 'employee_ID' and 'learning_ID' are required.");
      }

      const exists = await SELECT.one.from(Learnings).where({
        employee_ID,
        learning_ID,
      });

      if (exists) {
        return req.reject(400, "This learning is already assigned to the employee.");
      }

    } catch (error) {
      console.error("Error validating learning creation:", error);
      return req.reject(500, "Internal error while validating learning creation.");
    }
  });

  // Enforce full object update on UPDATE
  service.before("UPDATE", Learnings, async (req: any) => {
    try {
      const requiredFields = ["employee_ID", "learning_ID", "status"];
      for (const field of requiredFields) {
        if (!(field in req.data)) {
          return req.reject(400, `Field '${field}' is required for updating learning.`);
        }
      }
    } catch (error) {
      console.error("Error validating learning update:", error);
      return req.reject(500, "Internal error while validating learning update.");
    }
  });
}
