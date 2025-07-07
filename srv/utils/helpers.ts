export async function generateUniqueEmail(
  firstName: string,
  lastName: string,
  Employees: any
): Promise<string> {
  const cleanFirstName = firstName.trim().replace(/\s+/g, "").toLowerCase();
  const cleanLastName = lastName.trim().replace(/\s+/g, "").toLowerCase();

  let base = `${cleanFirstName}.${cleanLastName}@sap.com`;
  let email = base;
  let counter = 1;

  while (await SELECT.one.from(Employees).where({ emailId: email })) {
    email = `${cleanFirstName}.${cleanLastName}${counter++}@sap.com`;
  }

  return email;
}