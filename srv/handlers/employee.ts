import { generateUniqueEmail } from "../utils/helpers";

export async function beforeCreate(req: any, Employees: any) {
  if (!req.user?.is("Admin")) return req.reject(403, "You don't have access to create an employee.");

  const { firstName, lastName, bankAccountNumber, phoneNumber } = req.data;

  if (!/^\d{10}$/.test(phoneNumber)) {
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
}

export async function beforeUpdate(req: any, Employees: any) {
  if (!req.user?.is("Admin")) return req.reject(403, "You don't have access to update an employee.");

  const { ID, phoneNumber, bankAccountNumber, firstName, lastName } = req.data;

  if (!/^\d{10}$/.test(phoneNumber)) {
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
}

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

export async function onDeleteEmployeePermanently(req: any, Employees: any) {
  if (!req.user?.is("Admin")) return req.reject(403, "You don't have access to delete an employee permanently.");

  const ID = req.params?.[0]?.ID;
  if (!ID) return req.reject(400, "Missing Employee ID");

  const employee = await SELECT.one.from(Employees).where({ ID });
  if (!employee) return req.reject(404, "Employee not found");

  if (employee.status !== "Inactive") {
    return req.reject(400, "Only inactive employees can be deleted permanently.");
  }

  await DELETE.from(Employees).where({ ID });
  return null;
}

export function registerEmployeeHooks(service: any, Employees: any) {
  service.before("CREATE", Employees, (req: any) => beforeCreate(req, Employees));
  service.before("UPDATE", Employees, (req: any) => beforeUpdate(req, Employees));
  service.on("setEmployeeInactive", Employees, (req: any) => onSetEmployeeInactive(req, Employees));
  service.on("deleteEmployeePermanently", Employees, (req: any) => onDeleteEmployeePermanently(req, Employees));
}