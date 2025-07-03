export async function generateUniqueEmail(firstName: string, lastName: string, Employees: any): Promise<string> {
  const cleanFirstName = firstName.replace(/\s+/g, '').toLowerCase();
  const cleanLastName = lastName.replace(/\s+/g, '').toLowerCase();

  let base = `${cleanFirstName}.${cleanLastName}@sap.com`;
  let email = base;
  let i = 1;

  while (await SELECT.one.from(Employees).where({ emailId: email })) {
    email = `${cleanFirstName}.${cleanLastName}${i++}@sap.com`;
  }

  return email;
}