import { generateUniqueEmail } from "../utils/helpers";


// Before hooks for employee creation and update
export async function beforeCreate(req: any, Employees: any, LearningsMasterData: any) {
  if (!req.user?.is("Admin")) return req.reject(403, "You don't have access to create an employee.");

  const { firstName, lastName, bankAccountNumber, phoneNumber } = req.data;

  const newphoneNumber = phoneNumber.replace(/^0+/, '');
  req.data.phoneNumber = newphoneNumber;

  if (!/^\d{10}$/.test(newphoneNumber)) {
    return req.reject(400, "Phone number must be exactly 10 digits and numeric only.");
  }

  if (!/^\d+$/.test(bankAccountNumber)) {
    return req.reject(400, "Bank Account Number must contain digits only.");
  }

  req.data.emailId = await generateUniqueEmail(firstName, lastName, Employees);
  req.data.status = "Active";
  req.data.annualLeavesGranted = 20;
  req.data.annualLeavesUsed = 0;

  const exists = await SELECT.one.from(Employees).where({ bankAccountNumber });
  if (exists) return req.reject(400, "Bank Account Number already exists.");
  // ✅ Fetch initial learnings from LearningsMasterData
  const initialLearnings = await SELECT.from(LearningsMasterData).where({ initial: true });

  // ✅ Attach learnings to the new employee via composition
  if (!req.data.learnings) req.data.learnings = [];

  for (const learning of initialLearnings) {
    req.data.learnings.push({
      learning_ID: learning.ID,
      status: 'Not Yet Started'
    });
  }
}

  // Before hook for employee update
  export async function beforeUpdate(req: any, Employees: any, ProjectsMasterData: any) {
    if (!req.user?.is("Admin")) return req.reject(403, "You don't have access to update an employee.");

    const { ID, phoneNumber, bankAccountNumber, firstName, lastName } = req.data;

    const newphoneNumber = phoneNumber.replace(/^0+/, '');
    req.data.phoneNumber = newphoneNumber;
    if (!/^\d{10}$/.test(newphoneNumber)) {
      return req.reject(400, "Phone number must be exactly 10 digits and numeric only.");
    }

    if (!/^\d+$/.test(bankAccountNumber)) {
      return req.reject(400, "Bank Account Number must contain digits only.");
    }

    const existing = await SELECT.one.from(Employees).where({ ID });
    if (!existing) return req.reject(404, "Employee not found");

    if (firstName !== existing.firstName || lastName !== existing.lastName) {
      req.data.emailId = await generateUniqueEmail(firstName, lastName, Employees);
    }

    if (bankAccountNumber !== existing.bankAccountNumber) {
      const conflict = await SELECT.one.from(Employees).where({
        bankAccountNumber,
        ID: { "!=": ID },
      });
      if (conflict) req.reject(400, "Bank Account Number already exists.");
    }
    // Check for duplicate year in ratings
    const ratings = req.data.ratings || [];
    const yearSet = new Set();
    for (const r of ratings) {
      if (yearSet.has(r.year)) {
        return req.reject(400, `Duplicate rating entry for year ${r.year}`);
      }
      if (r.ratings < 1 || r.ratings > 5) {
        return req.reject(400, `Rating for year ${r.year} must be between 1 and 5`);
      }
      yearSet.add(r.year);
    }

    // Check for duplicate project assignments
    const projects = req.data.projects || [];
    const projectSet = new Set();
    for (const p of projects) {
      const projectId = p.project_ID;
      if (projectSet.has(projectId)) {
        return req.reject(400, `Project is already assigned to employee.`);
      }
      projectSet.add(projectId);

      // Update projectDescription from master data
      const projectMaster = await SELECT.one.from(ProjectsMasterData).where({ ID: projectId });
      if (projectMaster) {
        p.projectDescription = `${projectMaster.projectDescription}`;
      }
    }

    // Check for duplicate learning assignments
    const learnings = req.data.learnings || [];
    const learningSet = new Set();
    for (const l of learnings) {
      const learningId = l.learning_ID;
      if (learningSet.has(learningId)) {
        return req.reject(400, `Learning is already assigned to employee.`);
      }
      learningSet.add(learningId);
    }
  }

  // Function to set an employee as inactive
  export async function onSetEmployeeInactive(req: any, Employees: any) {
    if (!req.user?.is("Admin")) return req.reject(403, "You don't have access to mark an employee inactive.");

    const ID = req.params?.[0]?.ID;
    if (!ID) return req.reject(400, "Missing Employee ID");

    const employee = await SELECT.one.from(Employees).where({ ID });
    if (!employee) return req.reject(404, "Employee not found");

    if (employee.status === "Inactive") {
      return req.reject(400, "Employee is already inactive");
    }

    await UPDATE(Employees).set({ status: "Inactive" }).where({ ID });
    return await SELECT.one.from(Employees).where({ ID });
  }

  // Function to delete an employee permanently
  // export async function onDeleteEmployeePermanently(req: any, Employees: any) {
  //   if (!req.user?.is("Admin")) return req.reject(403, "You don't have access to delete an employee permanently.");

  //   const ID = req.params?.[0]?.ID;
  //   if (!ID) return req.reject(400, "Missing Employee ID");

  //   const employee = await SELECT.one.from(Employees).where({ ID });
  //   if (!employee) return req.reject(404, "Employee not found");

  //   if (employee.status !== "Inactive") {
  //     return req.reject(400, "Only inactive employees can be deleted permanently.");
  //   }

  //   await DELETE.from(Employees).where({ ID });
  //   return null;
  // }

  // Function to add remaining leaves after reading employee data
  export function afterReadAddRemainingLeaves(each: any) {
    const compute = (e: any) => {
      e.remainingLeaves = e.annualLeavesGranted - e.annualLeavesUsed;
      e.deleteHidden = !(e.status === 'Active'); // Only show delete if Inactive
    };

    if (Array.isArray(each)) each.forEach(compute);
    else compute(each);
  }


  export function registerEmployeeHooks(service: any, Employees: any, ProjectsMasterData: any, LearningsMasterData: any) {
    service.before("CREATE", Employees, (req: any) => beforeCreate(req, Employees, LearningsMasterData));
    service.before("UPDATE", Employees, (req: any) => beforeUpdate(req, Employees, ProjectsMasterData));
    service.on("setEmployeeInactive", Employees, (req: any) => onSetEmployeeInactive(req, Employees));
    // service.on("deleteEmployeePermanently", Employees, (req: any) => onDeleteEmployeePermanently(req, Employees));
    service.after("READ", Employees, afterReadAddRemainingLeaves);
  }