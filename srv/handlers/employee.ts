import cds from '@sap/cds';

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
    const base = `${cleanFirstName}.${cleanLastName}`;
    const domain = "@sap.com";

    const existingEmails = await cds.run(
      SELECT.from(this.Employees)
        .columns('emailId')
        .where({ emailId: { like: `${base}%${domain}` } })
    );

    if (!existingEmails.length) return `${base}${domain}`;

    const suffixes = existingEmails.map((e: any) => {
      const match = e.emailId.match(new RegExp(`^${base}(\\d*)${domain}$`));
      return match && match[1] ? parseInt(match[1], 10) : 0;
    });

    const maxSuffix = Math.max(...suffixes);
    return `${base}${maxSuffix + 1}${domain}`;
  }

  private cleanAndValidatePhone(phoneNumber: string, req: any): string {
    const cleaned = phoneNumber.replace(/^0+/, '');
    if (!/^\d{10}$/.test(cleaned)) req.reject(400, "Phone number must be exactly 10 digits.");
    return cleaned;
  }

  private validateBankAccount(bankAccountNumber: string, req: any) {
    if (!/^\d+$/.test(bankAccountNumber)) {
      req.reject(400, "Bank Account Number must contain digits only.");
    }
  }

  private async checkBankAccountUnique(bankAccountNumber: string, req: any, currentID?: any) {
    const query = SELECT.one.from(this.Employees).where({ bankAccountNumber });
    if (currentID) query.where({ ID: { "!=": currentID } });
    const conflict = await cds.run(query);
    if (conflict) req.reject(400, "Bank Account Number already exists.");
  }

  private validateLeaves(used: number, granted: number, req: any) {
    if (used < 0) req.reject(400, "Used Annual Leaves cannot be negative.");
    if (used > granted) req.reject(400, "Annual Leaves Used cannot exceed Annual Leaves Granted.");
  }

  private validateRatings(ratings: any[], req: any) {
    const yearSet = new Set();
    for (const r of ratings) {
      if (yearSet.has(r.year)) req.reject(400, `Duplicate rating for year ${r.year}`);
      if (r.ratings < 1 || r.ratings > 5) req.reject(400, `Rating for year ${r.year} must be between 1 and 5`);
      yearSet.add(r.year);
    }
  }

  private async enrichProjects(projects: any[], req: any) {
    const projectSet = new Set();
    for (const p of projects) {
      if (projectSet.has(p.project_ID)) req.reject(400, "Project already assigned.");
      projectSet.add(p.project_ID);

      const projectMaster = await cds.run(SELECT.one.from(this.ProjectsMasterData).where({ ID: p.project_ID }));
      if (projectMaster) p.projectDescription = projectMaster.projectDescription;
    }
  }

  private async validateAndAppendLearnings(req: any) {
    const initialLearnings = await cds.run(
      SELECT.from(this.LearningsMasterData).where({ initial: true })
    );
    const initialLearningIDs = new Set(initialLearnings.map((l: any) => l.ID));

    req.data.learnings = req.data.learnings || [];
    const learningSet = new Set();

    for (const l of req.data.learnings) {
      if (learningSet.has(l.learning_ID)) req.reject(400, "Learning already assigned.");
      learningSet.add(l.learning_ID);
    }

    for (const learning of initialLearnings) {
      if (!learningSet.has(learning.ID)) {
        req.data.learnings.push({
          learning_ID: learning.ID,
          status_code: "NYS"
        });
        learningSet.add(learning.ID);
      }
    }
  }

  public async beforeCreate(req: any) {
    if (!req.user?.is("Admin")) return req.reject(403, "You don't have access to create an employee.");

    const { firstName, lastName, bankAccountNumber, phoneNumber } = req.data;

    req.data.phoneNumber = this.cleanAndValidatePhone(phoneNumber, req);
    this.validateBankAccount(bankAccountNumber, req);
    await this.checkBankAccountUnique(bankAccountNumber, req);

    req.data.emailId = await this.generateUniqueEmail(firstName, lastName);
    req.data.status_code = "A";
    req.data.annualLeavesGranted = 20;

    this.validateLeaves(req.data.annualLeavesUsed, req.data.annualLeavesGranted, req);
    if (Array.isArray(req.data.ratings)) this.validateRatings(req.data.ratings, req);
    if (Array.isArray(req.data.projects)) await this.enrichProjects(req.data.projects, req);
    await this.validateAndAppendLearnings(req);
  }

  public async beforeUpdate(req: any) {
    if (!req.user?.is("Admin")) return req.reject(403, "You don't have access to update an employee.");

    const { ID, phoneNumber, bankAccountNumber, firstName, lastName } = req.data;

    req.data.phoneNumber = this.cleanAndValidatePhone(phoneNumber, req);
    this.validateBankAccount(bankAccountNumber, req);

    const existing = await cds.run(SELECT.one.from(this.Employees).where({ ID }));
    if (!existing) return req.reject(404, "Employee not found");

    if (firstName !== existing.firstName || lastName !== existing.lastName) {
      req.data.emailId = await this.generateUniqueEmail(firstName, lastName);
    }

    if (bankAccountNumber !== existing.bankAccountNumber) {
      await this.checkBankAccountUnique(bankAccountNumber, req, ID);
    }

    this.validateLeaves(req.data.annualLeavesUsed, req.data.annualLeavesGranted, req);
    if (Array.isArray(req.data.ratings)) this.validateRatings(req.data.ratings, req);
    if (Array.isArray(req.data.projects)) await this.enrichProjects(req.data.projects, req);
    if (Array.isArray(req.data.learnings)) await this.validateAndAppendLearnings(req);
  }

  public async onSetEmployeeInactive(req: any) {
    if (!req.user?.is("Admin")) return req.reject(403, "You don't have access to mark employee inactive.");
    const ID = req.params?.[0]?.ID;
    if (!ID) return req.reject(400, "Missing Employee ID");

    const employee = await cds.run(SELECT.one.from(this.Employees).where({ ID }));
    if (!employee) return req.reject(404, "Employee not found");
    if (employee.status_code === "I") return req.reject(400, "Already inactive");

    await cds.run(UPDATE(this.Employees).set({ status_code: "I" }).where({ ID }));
    return await cds.run(SELECT.one.from(this.Employees).where({ ID }));
  }

  public async afterReadAddComputedFields(each: any) {
    const compute = (e: any) => {
      e.remainingLeaves = e.annualLeavesGranted - e.annualLeavesUsed;
      e.deleteHidden = e.status_code === 'I';
    };
    Array.isArray(each) ? each.forEach(compute) : compute(each);
  }

  public register(service: any) {
    service.before("CREATE", this.Employees, this.beforeCreate.bind(this));
    service.before("UPDATE", this.Employees, this.beforeUpdate.bind(this));
    service.on("setEmployeeInactive", service.entities.Employees, this.onSetEmployeeInactive.bind(this));
    service.after("READ", this.Employees, this.afterReadAddComputedFields.bind(this));
  }
}
