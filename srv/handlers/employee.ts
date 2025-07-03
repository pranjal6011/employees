import { v4 as uuidv4 } from "uuid";
import { generateUniqueEmail } from "../utils/helpers";

export function registerEmployeeHooks(service: any, Employees: any, Learnings: any, LearningsMasterData: any) {
  service.before("CREATE", Employees, async (req: any) => {
    const { firstName, lastName, bankAccountNumber, phoneNumber } = req.data;

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      req.reject(400, "Phone number must be exactly 10 digits and numeric only.");
    }

    req.data.emailId = await generateUniqueEmail(firstName, lastName, Employees);
    req.data.status = "Active";
    req.data.annualLeavesGranted = 20;
    req.data.annualLeavesUsed = 0;

    const exists = await SELECT.one.from(Employees).where({ bankAccountNumber });
    if (exists) req.reject(400, "Bank Account Number already exists.");
  });


  service.after("CREATE", Employees, async (data: any) => {
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
  });

  service.before("UPDATE", Employees, async (req: any) => {
    const { ID } = req.data;

    // Fetch existing record
    const existing = await SELECT.one.from(Employees).where({ ID });
    if (!existing) return req.reject(404, "Employee not found");

    // Regenerate email if name changes
    const newFirst = req.data.firstName ?? existing.firstName;
    const newLast = req.data.lastName ?? existing.lastName;
    if (newFirst !== existing.firstName || newLast !== existing.lastName) {
      req.data.emailId = await generateUniqueEmail(newFirst, newLast, Employees);
    }

    // Check bank account uniqueness if changed
    const newBankAcc = req.data.bankAccountNumber;
    if (newBankAcc && newBankAcc !== existing.bankAccountNumber) {
      const conflict = await SELECT.one.from(Employees).where({
        bankAccountNumber: newBankAcc,
        ID: { "!=": ID },
      });
      if (conflict) req.reject(400, "Bank Account Number already exists.");
    }
  });

  // set employee as inactive
  service.on('setEmployeeInactive', async (req: any) => {
    const ID = req.params[0]?.ID;

    if (!ID) return req.reject(400, 'Missing Employee ID');

    const employee = await SELECT.one.from(Employees).where({ ID });
    if (!employee) return req.reject(404, 'Employee not found');
    if (employee.status === 'Inactive') return req.reject(400, 'Employee is already inactive');

    await UPDATE(Employees).set({ status: 'Inactive' }).where({ ID });
    return 'Employee has been marked inactive';
  });

  service.on('deleteEmployeePermanently', async (req: any) => {
  const ID = req.params[0]?.ID;
  if (!ID) return req.reject(400, 'Missing Employee ID');

  const employee = await SELECT.one.from(Employees).where({ ID });
  if (!employee) return req.reject(404, 'Employee not found');

  if (employee.status !== 'Inactive') {
    return req.reject(400, 'Only inactive employees can be deleted permanently.');
  }

  await DELETE.from(Employees).where({ ID });
  return 'Employee permanently deleted';
});

}
