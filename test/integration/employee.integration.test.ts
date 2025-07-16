import cds from '@sap/cds';
const { GET, POST, expect, axios } = cds.test(__dirname + "/../..");

describe('Integration Test for AdminService', function () {
  axios.defaults.auth = { username: 'adminUser', password: 'admin123' }

  it('Should create a new Employee and fetch it by firstName', async () => {
    const newEmployee = {
      firstName: "TestName",
      lastName: "LastName",
      bankAccountNumber: "1234567890",
      phoneNumber: "9876543210",
      address: "BLR"
    };

    // Create the Employee
    const createResp = await POST('/odata/v4/admin/Employees', newEmployee);
    expect(createResp.status).to.equal(201);
    expect(createResp.data).to.have.property('ID');
    console.log('Created Employee:', createResp.data);

    // Fetch by firstName
    const fetchResp = await GET(`/odata/v4/admin/Employees?$filter=firstName eq 'TestName'`);
    expect(fetchResp.status).to.equal(200);
    console.log('Fetched Employees:', fetchResp.data.value);

    expect(fetchResp.data.value).to.be.an('array').with.length.greaterThan(0);
    expect(fetchResp.data.value[0].firstName).to.equal('TestName');
  });

  it('Should fetch all Employees', async () => {
    const response = await GET('/odata/v4/admin/Employees');
    expect(response.status).to.equal(200);
    console.log('All Employees:', response.data.value);
    expect(response.data.value).to.be.an('array');
  });
});
