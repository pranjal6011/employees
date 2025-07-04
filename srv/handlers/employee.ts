import { v4 as uuidv4 } from "uuid";
import { generateUniqueEmail } from "../utils/helpers";
import { error } from "console";

export function registerEmployeeHooks(service: any, Employees: any, Learnings: any, LearningsMasterData: any) {

  service.before('*', '*', (req :any) => {
    console.log('User:', req.user.id);
    console.log('Roles:', req.user.roles);
  });


  // Before Create
  service.before("CREATE", Employees, async (req: any) => {
    try {
      const { firstName, lastName, bankAccountNumber, phoneNumber } = req.data;

      // Validate phone number (must be exactly 10 digits)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return req.reject(400, "Phone number must be exactly 10 digits and numeric only.");
      }

      // Validate bank account number (digits only)
      const bankAccountRegex = /^[0-9]+$/;
      if (!bankAccountRegex.test(bankAccountNumber)) {
        return req.reject(400, "Bank Account Number must contain digits only.");
      }

      // Set derived/default fields
      req.data.emailId = await generateUniqueEmail(firstName, lastName, Employees);
      req.data.status = "Active";
      req.data.annualLeavesGranted = 20;
      req.data.annualLeavesUsed = 0;

      // Check for uniqueness
      const exists = await SELECT.one.from(Employees).where({ bankAccountNumber });
      if (exists) return req.reject(400, "Bank Account Number already exists.");
    } catch (err: any) {
      console.error("Error in before CREATE:", err);
      return req.reject(500, err.message || "An error occurred while creating the employee.");
    }
  });


  // After Create
  service.after("CREATE", Employees, async (data: any) => {
    try {
      const initialCourses = await SELECT.from(LearningsMasterData).where({ initial: true });
      if (!initialCourses.length) return;

      const entries = initialCourses.map((course: any) => ({
        ID: uuidv4(),
        employee_ID: data.ID,
        learning_ID: course.ID,
        createdAt: new Date(),
        createdBy: data.createdBy,
      }));

      await INSERT.into(Learnings).entries(entries);
    } catch (err) {
      console.error("Error assigning initial courses:", err);
      // Silent failure: don't reject the main CREATE due to this
    }
  });




  // Before Update
  service.before("UPDATE", Employees, async (req: any) => {
    try {
      const { ID, learnings, projects, ratings, phoneNumber, bankAccountNumber } = req.data;
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return req.reject(400, "Phone number must be exactly 10 digits and numeric only.");
      }

      // Validate bank account number (digits only)
      const bankAccountRegex = /^[0-9]+$/;
      if (!bankAccountRegex.test(bankAccountNumber)) {
        return req.reject(400, "Bank Account Number must contain digits only.");
      }

      const existing = await SELECT.one.from(Employees).where({ ID });
      if (!existing) return req.reject(404, "Employee not found");

      // ✅ Validate name change → regenerate emailId
      const newFirst = req.data.firstName ?? existing.firstName;
      const newLast = req.data.lastName ?? existing.lastName;

      if (newFirst !== existing.firstName || newLast !== existing.lastName) {
        req.data.emailId = await generateUniqueEmail(newFirst, newLast, Employees);
      }

      // ✅ Unique bank account
      const newBankAcc = req.data.bankAccountNumber;
      if (newBankAcc && newBankAcc !== existing.bankAccountNumber) {
        const conflict = await SELECT.one.from(Employees).where({
          bankAccountNumber: newBankAcc,
          ID: { "!=": ID },
        });
        if (conflict) req.reject(400, "Bank Account Number already exists.");
      }

      // ✅ Learning validation
      if (Array.isArray(learnings)) {
        for (const learning of learnings) {
          const { learning_ID, status } = learning;
          if (!learning_ID || !status) {
            return req.reject(400, "Each learning must have 'learning_ID' and 'status'.");
          }
          const duplicate = await SELECT.one.from('my.employee.Learnings').where({
            employee_ID: ID,
            learning_ID,
            ID: { "!=": learning.ID },
          });
          if (duplicate) {
            return req.reject(400, "This learning has already been assigned to the employee.");
          }
        }
      }

      // ✅ Project validation
      if (Array.isArray(projects)) {
        for (const project of projects) {
          const { project_ID } = project;
          if (!project_ID) {
            return req.reject(400, "Each project must include 'project_ID'.");
          }

          const exists = await SELECT.one.from('my.employee.Projects').where({
            employee_ID: ID,
            project_ID,
            ID: { "!=": project.ID },
          });

          if (exists) {
            return req.reject(400, "This project is already assigned to the employee.");
          }

          // Autofill projectDescription
          const master = await SELECT.one.from('my.employee.ProjectsMasterData').where({ ID: project_ID });
          if (master) {
            project.projectDescription = master.projectDescription;
          }
        }
      }

      // ✅ Ratings validation
      if (Array.isArray(ratings)) {
        for (const rating of ratings) {
          const { year, ratings: value } = rating;

          if (!year || value === undefined) {
            return req.reject(400, "Each rating must include 'year' and 'ratings'.");
          }

          if (value < 1 || value > 5) {
            return req.reject(400, "Rating must be between 1 and 5.");
          }

          const conflict = await SELECT.one.from('my.employee.Ratings').where({
            employee_ID: ID,
            year,
            ID: { "!=": rating.ID },
          });

          if (conflict) {
            return req.reject(400, `Rating for year ${year} already exists for this employee.`);
          }
        }
      }

    } catch (err: any) {
      console.error("Error in before UPDATE:", err);
      return req.reject(500, err.message || "An error occurred while updating the employee.");
    }
  });

  service.after("READ", Employees, (rows: any[]) => {
    if (!Array.isArray(rows)) rows = [rows];
    for (const row of rows) {
      row.remainingLeaves = row.annualLeavesGranted - row.annualLeavesUsed;
    }
  });



  // Set Employee Inactive
  service.on('setEmployeeInactive', async (req: any) => {
    try {
      const ID = req.params[0]?.ID;
      if (!ID) return req.reject(400, 'Missing Employee ID');

      const employee = await SELECT.one.from(Employees).where({ ID });
      if (!employee) return req.reject(404, 'Employee not found');

      if (employee.status === 'Inactive') {
        return req.reject(400, 'Employee is already inactive');
      }

      await UPDATE(Employees).set({ status: 'Inactive' }).where({ ID });
      return await SELECT.one.from(Employees).where({ ID });
    } catch (error: any) {
      console.error("Error in setEmployeeInactive:", error);
      return req.reject(500, error.message || 'An error occurred while setting the employee inactive.');
    }
  });

  // Delete Employee Permanently
  service.on('deleteEmployeePermanently', async (req: any) => {
    try {
      const ID = req.params[0]?.ID;
      if (!ID) return req.reject(400, 'Missing Employee ID');

      const employee = await SELECT.one.from(Employees).where({ ID });
      if (!employee) return req.reject(404, 'Employee not found');

      if (employee.status !== 'Inactive') {
        return req.reject(400, 'Only inactive employees can be deleted permanently.');
      }

      await DELETE.from(Employees).where({ ID });
      return 'Employee permanently deleted';
    } catch (error: any) {
      console.error("Error in deleteEmployeePermanently:", error);
      return req.reject(500, error.message || 'An error occurred while deleting the employee.');
    }
  });
}