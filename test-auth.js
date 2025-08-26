// Test Authentication System
async function testAuth() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('🚀 Testing Todolly Authentication System\n');

  // Test 1: Register a new user
  console.log('1. Testing user registration...');
  const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123'
    })
  });

  const registerResult = await registerResponse.json();
  console.log('Register Status:', registerResponse.status);
  console.log('Register Response:', registerResult);

  if (!registerResult.success) {
    console.error('❌ Registration failed');
    return;
  }

  const token = registerResult.token;
  console.log('✅ Registration successful\n');

  // Test 2: Login with the same user
  console.log('2. Testing user login...');
  const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });

  const loginResult = await loginResponse.json();
  console.log('Login Status:', loginResponse.status);
  console.log('Login Response:', loginResult);

  if (!loginResult.success) {
    console.error('❌ Login failed');
    return;
  }
  console.log('✅ Login successful\n');

  // Test 3: Get user profile
  console.log('3. Testing user profile...');
  const profileResponse = await fetch(`${BASE_URL}/auth/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  const profileResult = await profileResponse.json();
  console.log('Profile Status:', profileResponse.status);
  console.log('Profile Response:', profileResult);

  if (!profileResult.success) {
    console.error('❌ Profile fetch failed');
    return;
  }
  console.log('✅ Profile fetch successful\n');

  // Test 4: Create a task (protected route)
  console.log('4. Testing task creation (protected route)...');
  const taskResponse = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Test Task',
      description: 'This is a test task',
      status: false,
      priority: 'high'
    })
  });

  const taskResult = await taskResponse.json();
  console.log('Task Creation Status:', taskResponse.status);
  console.log('Task Creation Response:', taskResult);

  if (taskResponse.status !== 201) {
    console.error('❌ Task creation failed');
    return;
  }
  console.log('✅ Task creation successful\n');

  const taskId = taskResult.taskId;

  // Test 5: Get all tasks (protected route)
  console.log('5. Testing tasks list (protected route)...');
  const tasksResponse = await fetch(`${BASE_URL}/tasks`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  const tasksResult = await tasksResponse.json();
  console.log('Tasks List Status:', tasksResponse.status);
  console.log('Tasks List Response:', tasksResult);

  if (tasksResponse.status !== 200) {
    console.error('❌ Tasks list failed');
    return;
  }
  console.log('✅ Tasks list successful\n');

  // Test 6: Try accessing protected route without token
  console.log('6. Testing unauthorized access...');
  const unauthorizedResponse = await fetch(`${BASE_URL}/tasks`, {
    method: 'GET',
  });

  const unauthorizedResult = await unauthorizedResponse.json();
  console.log('Unauthorized Status:', unauthorizedResponse.status);
  console.log('Unauthorized Response:', unauthorizedResult);

  if (unauthorizedResponse.status === 401) {
    console.log('✅ Unauthorized access properly blocked\n');
  } else {
    console.error('❌ Unauthorized access should have been blocked\n');
  }

  // Test 7: Login with wrong credentials
  console.log('7. Testing login with wrong credentials...');
  const wrongLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'wrongpassword'
    })
  });

  const wrongLoginResult = await wrongLoginResponse.json();
  console.log('Wrong Login Status:', wrongLoginResponse.status);
  console.log('Wrong Login Response:', wrongLoginResult);

  if (wrongLoginResponse.status === 401) {
    console.log('✅ Wrong credentials properly rejected\n');
  } else {
    console.error('❌ Wrong credentials should have been rejected\n');
  }

  console.log('🎉 Authentication system testing completed!');
}

testAuth().catch(console.error);
