
export class EmployeeHandler {
  private Employees: any;
  private ProjectsMasterData: any;
  private LearningsMasterData: any;

  constructor(Employees: any, ProjectsMasterData: any, LearningsMasterData: any) {
    this.Employees = Employees;
    this.ProjectsMasterData = ProjectsMasterData;
    this.LearningsMasterData = LearningsMasterData;
  }

  private async generateUniqueEmail(firstName: string, lastName: string): Promise<string> {
    const cleanFirstName = firstName.trim().replace(/\s+/g, "").toLowerCase();
    const cleanLastName = lastName.trim().replace(/\s+/g, "").toLowerCase();

    let base = `${cleanFirstName}.${cleanLastName}@sap.com`;
    let email = base;
    let counter = 1;

    while (await SELECT.one.from(this.Employees).where({ emailId: email })) {
      email = `${cleanFirstName}.${cleanLastName}${counter++}@sap.com`;
    }

    return email;
  }

  async beforeCreate(req: any) {
    if (!req.user?.is("Admin"))
      return req.reject(403, "You don't have access to create an employee.");

    const { firstName, lastName, bankAccountNumber, phoneNumber } = req.data;
    const cleanedPhone = phoneNumber.replace(/^0+/, '');
    req.data.phoneNumber = cleanedPhone;

    if (!/^\d{10}$/.test(cleanedPhone))
      return req.reject(400, "Phone number must be exactly 10 digits.");

    if (!/^\d+$/.test(bankAccountNumber))
      return req.reject(400, "Bank Account Number must contain digits only.");

    const exists = await SELECT.one.from(this.Employees).where({ bankAccountNumber });
    if (exists)
      return req.reject(400, "Bank Account Number already exists.");

    req.data.emailId = await this.generateUniqueEmail(firstName, lastName);
    req.data.status = "Active";
    req.data.annualLeavesGranted = 20;

    if (req.data.annualLeavesUsed < 0) {
      return req.reject(400, "Used Annual Leaves cannot be negative.");
    }
    if (req.data.annualLeavesUsed > req.data.annualLeavesGranted) {
      return req.reject(400, "Annual Leaves Used cannot exceed Annual Leaves Granted.");
    }


    if (Array.isArray(req.data.ratings)) {
      const yearSet = new Set();
      for (const r of req.data.ratings) {
        if (yearSet.has(r.year))
          return req.reject(400, `Duplicate rating for year ${r.year}`);
        if (r.ratings < 1 || r.ratings > 5)
          return req.reject(400, `Rating for year ${r.year} must be between 1 and 5`);
        yearSet.add(r.year);
      }
    }

    if (Array.isArray(req.data.projects)) {
      const projectSet = new Set();
      for (const p of req.data.projects) {
        if (projectSet.has(p.project_ID))
          return req.reject(400, "Project already assigned.");
        projectSet.add(p.project_ID);

        const projectMaster = await SELECT.one.from(this.ProjectsMasterData).where({ ID: p.project_ID });
        if (projectMaster)
          p.projectDescription = projectMaster.projectDescription;
      }
    }

    const validLearningStatuses = ["Not Yet Started", "In Progress", "Completed"];
    const initialLearnings = await SELECT.from(this.LearningsMasterData).where({ initial: true });
    const initialLearningIDs = new Set(initialLearnings.map((l: { ID: any; }) => l.ID));

    req.data.learnings = req.data.learnings || [];
    const learningSet = new Set();

    // First validate and collect existing learning_IDs
    for (const l of req.data.learnings) {
      if (learningSet.has(l.learning_ID))
        return req.reject(400, "Learning already assigned.");
      learningSet.add(l.learning_ID);

      if (!validLearningStatuses.includes(l.status)) {
        return req.reject(
          400,
          `Invalid learning status: '${l.status}'. Must be one of: ${validLearningStatuses.join(", ")}`
        );
      }
    }

    // Then append initial learnings if not already present
    for (const learning of initialLearnings) {
      if (!learningSet.has(learning.ID)) {
        req.data.learnings.push({
          learning_ID: learning.ID,
          status: "Not Yet Started"
        });
        learningSet.add(learning.ID);
      }
    }

  }


  async beforeUpdate(req: any) {
    if (!req.user?.is("Admin")) return req.reject(403, "You don't have access to update an employee.");

    const { ID, phoneNumber, bankAccountNumber, firstName, lastName } = req.data;
    const cleanedPhone = phoneNumber.replace(/^0+/, '');
    req.data.phoneNumber = cleanedPhone;

    if (!/^\d{10}$/.test(cleanedPhone)) return req.reject(400, "Phone number must be exactly 10 digits.");
    if (!/^\d+$/.test(bankAccountNumber)) return req.reject(400, "Bank Account Number must contain digits only.");

    const existing = await SELECT.one.from(this.Employees).where({ ID });
    if (!existing) return req.reject(404, "Employee not found");

    if (firstName !== existing.firstName || lastName !== existing.lastName) {
      req.data.emailId = await this.generateUniqueEmail(firstName, lastName);
    }

    if (bankAccountNumber !== existing.bankAccountNumber) {
      const conflict = await SELECT.one.from(this.Employees).where({
        bankAccountNumber,
        ID: { "!=": ID }
      });
      if (conflict) return req.reject(400, "Bank Account Number already exists.");
    }
    if (req.data.annualLeavesUsed < 0) {
      return req.reject(400, "Used Annual Leaves cannot be negative.");
    }
    if (req.data.annualLeavesUsed > req.data.annualLeavesGranted) {
      return req.reject(400, "Annual Leaves Used cannot exceed Annual Leaves Granted.");
    }

    const yearSet = new Set();
    for (const r of req.data.ratings || []) {
      if (yearSet.has(r.year)) return req.reject(400, `Duplicate rating for year ${r.year}`);
      if (r.ratings < 1 || r.ratings > 5) return req.reject(400, `Rating for year ${r.year} must be 1-5`);
      yearSet.add(r.year);
    }

    const projectSet = new Set();
    for (const p of req.data.projects || []) {
      if (projectSet.has(p.project_ID)) return req.reject(400, "Project already assigned.");
      projectSet.add(p.project_ID);

      const projectMaster = await SELECT.one.from(this.ProjectsMasterData).where({ ID: p.project_ID });
      if (projectMaster) p.projectDescription = projectMaster.projectDescription;
    }

    const validLearningStatuses = ["Not Yet Started", "In Progress", "Completed"];
    const learningSet = new Set();
    for (const l of req.data.learnings || []) {
      if (learningSet.has(l.learning_ID)) return req.reject(400, "Learning already assigned.");
      learningSet.add(l.learning_ID);

      if (!validLearningStatuses.includes(l.status)) {
        return req.reject(400, `Invalid learning status: '${l.status}'. Must be one of: ${validLearningStatuses.join(", ")}`);
      }
    }

  }

  async onSetEmployeeInactive(req: any) {
    if (!req.user?.is("Admin")) return req.reject(403, "You don't have access to mark employee inactive.");

    const ID = req.params?.[0]?.ID;
    if (!ID) return req.reject(400, "Missing Employee ID");

    const employee = await SELECT.one.from(this.Employees).where({ ID });
    if (!employee) return req.reject(404, "Employee not found");
    if (employee.status === "Inactive") return req.reject(400, "Already inactive");

    await UPDATE(this.Employees).set({ status: "Inactive" }).where({ ID });
    return await SELECT.one.from(this.Employees).where({ ID });
  }

  afterReadAddRemainingLeaves(each: any) {
    const compute = (e: any) => {
      e.remainingLeaves = e.annualLeavesGranted - e.annualLeavesUsed;
      e.deleteHidden = e.status === 'Inactive';
    };

    Array.isArray(each) ? each.forEach(compute) : compute(each);
  }

  register(service: any) {
    service.before("CREATE", this.Employees, this.beforeCreate.bind(this));
    service.before("UPDATE", this.Employees, this.beforeUpdate.bind(this));
    service.on("setEmployeeInactive", service.entities.Employees, this.onSetEmployeeInactive.bind(this));
    service.after("READ", this.Employees, this.afterReadAddRemainingLeaves.bind(this));
  }
}