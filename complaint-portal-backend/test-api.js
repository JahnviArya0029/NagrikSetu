async function runTest() {
  const fetchAPI = async (path, method = 'GET', body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch('http://localhost:8001' + path, options);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  try {
    // 1. Setup Admin
    console.log("-> Register/Login Admin...");
    await fetchAPI('/api/auth/register', 'POST', { name: 'Admin User', email: 'admin_test2@test.com', password: 'password', role: 'admin' });
    let aRes = await fetchAPI('/api/auth/login', 'POST', { email: 'admin_test2@test.com', password: 'password' });
    const adminToken = aRes.data.token;
    
    // 2. Setup Citizen
    console.log("-> Register/Login Citizen...");
    await fetchAPI('/api/auth/register', 'POST', { name: 'Citizen User', email: 'citizen_test2@test.com', password: 'password', role: 'citizen' });
    let cRes = await fetchAPI('/api/auth/login', 'POST', { email: 'citizen_test2@test.com', password: 'password' });
    const citizenToken = cRes.data.token;
    
    // 3. Citizen files a complaint
    console.log("-> Citizen filing a complaint...");
    await fetchAPI('/api/complaints', 'POST', { title: 'Test Complaint', description: 'Testing the API', category: 'Roads', lat: 10, lng: 20 }, citizenToken);

    // 4. Test Citizen Route
    console.log("\n====== CITIZEN RESPONSE (/api/complaints/my) ======");
    const myRes = await fetchAPI('/api/complaints/my', 'GET', null, citizenToken);
    console.log(`Status: ${myRes.status}`);
    console.log(JSON.stringify(myRes.data, null, 2).substring(0, 400) + '...\n');

    // 5. Test Admin Route
    console.log("====== ADMIN RESPONSE (/api/complaints) ======");
    const allRes = await fetchAPI('/api/complaints', 'GET', null, adminToken);
    console.log(`Status: ${allRes.status}`);
    console.log(JSON.stringify(allRes.data, null, 2).substring(0, 400) + '...\n');
    
    // 6. Test Guest Access
    console.log("====== GUEST RESPONSE (/api/complaints/my) ======");
    const guestRes = await fetchAPI('/api/complaints/my', 'GET', null, null);
    console.log(`Status: ${guestRes.status}`);
    console.log(JSON.stringify(guestRes.data, null, 2));

  } catch(e) {
    console.error("Test Error:", e);
  }
}

runTest();
