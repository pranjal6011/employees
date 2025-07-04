export function registerRatingHooks(service: any, Ratings: any) {
  // CREATE or UPDATE rating
  service.before(["CREATE", "UPDATE"], Ratings, async (req: any) => {
    try {
      const { ratings: value, year, ID } = req.data;

      // Validate range
      if (value < 1 || value > 5) {
        return req.reject(400, "Rating must be between 1 and 5.");
      }

      // Extract employee_ID
      let employee_ID = req.data.employee_ID;
      if (!employee_ID && req.data.employee?.ID) {
        employee_ID = req.data.employee.ID;
      }

      if (!employee_ID || !year) {
        return req.reject(400, "Both employee ID and year are required.");
      }

      // Check for existing rating with same employee and year
      const conflict = await SELECT.one.from(Ratings).where({
        employee_ID,
        year,
        ...(req.event === 'UPDATE' ? { ID: { '!=': ID } } : {})
      });

      if (conflict) {
        return req.reject(400, `Rating for year ${year} already exists for this employee.`);
      }

    } catch (error) {
      console.error("Rating validation error:", error);
      return req.reject(500, "Internal error while validating rating.");
    }
  });

  // DELETE rating
  service.on("DELETE", Ratings, async (req: any) => {
    try {
      const result = await DELETE.from(Ratings).where({ ID: req.data.ID });
      if (!result) req.reject(404, "Rating not found.");
    } catch (error) {
      console.error("Error deleting rating:", error);
      req.reject(500, "Internal error while deleting rating.");
    }
  });
}
