import cds from '@sap/cds';
const { GET, POST, PATCH, expect, axios } = cds.test(__dirname + "/../..");

describe('Integration Test for AdminService - Employees Only', function () {
  axios.defaults.auth = { username: 'adminUser', password: 'admin123' };

  let createdEmployee: any;

  beforeEach(async () => {
    const { data: draft } = await POST('/odata/v4/admin/Employees', {});
    await PATCH(`/odata/v4/admin/Employees(ID=${draft.ID},IsActiveEntity=false)`, {
      firstName: "TestEmployee",
      lastName: "User",
      phoneNumber: "9876543210",
      bankAccountNumber: Date.now().toString(),
      address: "BLR",
      status_code: "A"
    });
    const { data: active } = await POST(`/odata/v4/admin/Employees(ID=${draft.ID},IsActiveEntity=false)/draftActivate`);
    expect(active).to.have.property('ID');
    createdEmployee = active;
  });


  it('Should set an Employee inactive using action', async () => {
    const { data: updated } = await POST(`/odata/v4/admin/Employees(ID=${createdEmployee.ID},IsActiveEntity=true)/setEmployeeInactive`, {});
    expect(updated.status_code).to.equal('I');
  });

  it('Should not allow setting already inactive Employee again', async () => {
    await POST(`/odata/v4/admin/Employees(ID=${createdEmployee.ID},IsActiveEntity=true)/setEmployeeInactive`, {});
    try {
      await POST(`/odata/v4/admin/Employees(ID=${createdEmployee.ID},IsActiveEntity=true)/setEmployeeInactive`, {});
      throw new Error('Expected error not thrown');
    } catch (err: any) {
      expect(err.response.status).to.equal(400);
      expect(err.response.data.error.message).to.include('Already inactive');
    }
  });

  it('Should not allow duplicate bank account number', async () => {
    const { data: draft } = await POST('/odata/v4/admin/Employees', {});
    await PATCH(`/odata/v4/admin/Employees(ID=${draft.ID},IsActiveEntity=false)`, {
      firstName: "DuplicateBank",
      lastName: "User2",
      phoneNumber: "9876543211",
      bankAccountNumber: createdEmployee.bankAccountNumber, // duplicate
      address: "BLR",
      status_code: "A"
    });

    try {
      await POST(`/odata/v4/admin/Employees(ID=${draft.ID},IsActiveEntity=false)/draftActivate`);
      throw new Error('Expected error not thrown');
    } catch (err: any) {
      expect(err.response.status).to.equal(400);
      expect(err.response.data.error.message).to.include('already exists');
    }
  });

  it('Should fetch all Employees', async () => {
    const response = await GET('/odata/v4/admin/Employees');
    expect(response.status).to.equal(200);
    expect(response.data.value).to.be.an('array');
  });

  it('Should fail creating Employee with invalid phone number', async () => {
    const { data: draft } = await POST('/odata/v4/admin/Employees', {});
    await PATCH(`/odata/v4/admin/Employees(ID=${draft.ID},IsActiveEntity=false)`, {
      firstName: "InvalidPhone",
      lastName: "User",
      phoneNumber: "123",  // Invalid
      bankAccountNumber: Date.now().toString(),
      address: "BLR",
      status_code: "A"
    });

    try {
      await POST(`/odata/v4/admin/Employees(ID=${draft.ID},IsActiveEntity=false)/draftActivate`);
      throw new Error('Expected error not thrown');
    } catch (err: any) {
      expect(err.response.status).to.equal(400);
      expect(err.response.data.error.message).to.include('Phone number must be exactly 10 digits');
    }
  });

  it('Should fail creating Employee with negative leaves used', async () => {
    const { data: draft } = await POST('/odata/v4/admin/Employees', {});
    await PATCH(`/odata/v4/admin/Employees(ID=${draft.ID},IsActiveEntity=false)`, {
      firstName: "NegativeLeave",
      lastName: "User",
      phoneNumber: "9876543216",
      bankAccountNumber: Date.now().toString(),
      address: "BLR",
      annualLeavesUsed: -5,
      status_code: "A"
    });

    try {
      await POST(`/odata/v4/admin/Employees(ID=${draft.ID},IsActiveEntity=false)/draftActivate`);
      throw new Error('Expected error not thrown');
    } catch (err: any) {
      expect(err.response.status).to.equal(400);
      expect(err.response.data.error.message).to.include('Used Annual Leaves cannot be negative');
    }
  });

  it('Should fetch inactive Employees using filter', async () => {
    const { data: draft } = await POST('/odata/v4/admin/Employees', {});
    await PATCH(`/odata/v4/admin/Employees(ID=${draft.ID},IsActiveEntity=false)`, {
      firstName: "InactiveFilter",
      lastName: "User",
      phoneNumber: "9876543222",
      bankAccountNumber: Date.now().toString(),
      address: "BLR",
      status_code: "A"
    });
    const { data: active } = await POST(`/odata/v4/admin/Employees(ID=${draft.ID},IsActiveEntity=false)/draftActivate`);
    await POST(`/odata/v4/admin/Employees(ID=${active.ID},IsActiveEntity=true)/setEmployeeInactive`);

    const { data: response } = await GET(`/odata/v4/admin/Employees?$filter=status_code eq 'I'`);
    expect(response.value.some((e: any) => e.ID === active.ID)).to.be.true;
  });
});
