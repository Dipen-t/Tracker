async function test() {
  const API = 'http://localhost:3000/api';
  
  console.log('1. Registering user...');
  const regRes = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: 'test@test.com', password: 'password123' })
  });
  const regData = await regRes.json();
  console.log('Register response:', regData);

  console.log('\n2. Logging in...');
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  console.log('Login response:', { success: loginData.success, token: loginData.data?.token ? 'REDACTED' : null });
  const token = loginData.data.token;

  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  console.log('\n3. Creating a task...');
  const taskRes = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ title: 'My first task', description: 'Testing the API' })
  });
  const taskData = await taskRes.json();
  console.log('Task response:', taskData);
  const taskId = taskData.data.id;

  console.log('\n4. Starting a timer...');
  const startRes = await fetch(`${API}/tasks/${taskId}/time/start`, {
    method: 'POST',
    headers: authHeaders
  });
  console.log('Start timer response:', await startRes.json());

  console.log('\nWaiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n5. Stopping the timer...');
  const stopRes = await fetch(`${API}/tasks/${taskId}/time/stop`, {
    method: 'POST',
    headers: authHeaders
  });
  console.log('Stop timer response:', await stopRes.json());

  console.log('\n6. Fetching total time...');
  const totalRes = await fetch(`${API}/tasks/${taskId}/time-total`, {
    method: 'GET',
    headers: authHeaders
  });
  console.log('Total time response:', await totalRes.json());
}

test().catch(console.error);
