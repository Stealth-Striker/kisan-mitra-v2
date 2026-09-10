const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../server');

let server;
let baseUrl;
let authToken;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  // Register a test user to get auth token
  const testEmail = `harvest_test_${Date.now()}@kisan.in`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'HarvestPassword123!',
      full_name: 'Harvest Tester',
      role: 'farmer'
    })
  });
  const regData = await regRes.json();
  authToken = regData.access_token;
});

test.after((_, done) => {
  if (server) server.close(done);
  else done();
});

test('POST /api/functions/simulateHarvestGuardian returns simulation & advisory', async () => {
  const sowDate = new Date();
  sowDate.setDate(sowDate.getDate() - 105);

  const res = await fetch(`${baseUrl}/api/functions/simulateHarvestGuardian`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      crop: 'Rice',
      sowingDate: sowDate.toISOString().split('T')[0],
      farmSize: 2.5,
      location: 'Palakkad, Kerala',
      weatherForecast: [
        { day: 'Today', temp: '30°C', humidity: '60%', rainPct: '5%', condition: 'Sunny', status: 'Ideal' },
        { day: 'Tomorrow', temp: '31°C', humidity: '58%', rainPct: '10%', condition: 'Sunny', status: 'Ideal' },
        { day: 'Day 3', temp: '29°C', humidity: '65%', rainPct: '15%', condition: 'Partly Cloudy', status: 'Good' },
        { day: 'Day 4', temp: '28°C', humidity: '68%', rainPct: '20%', condition: 'Dry Window', status: 'Good' },
        { day: 'Day 5', temp: '27°C', humidity: '75%', rainPct: '45%', condition: 'Scattered Clouds', status: 'Moderate' },
        { day: 'Day 6', temp: '26°C', humidity: '85%', rainPct: '70%', condition: 'Showers Predicted', status: 'Rain Risk' },
        { day: 'Day 7', temp: '28°C', humidity: '74%', rainPct: '35%', condition: 'Clearing', status: 'Moderate' },
      ],
      language: 'English'
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  
  // Verify MATLAB Simulation Data
  assert.ok(data.matlabSimulation, 'matlabSimulation should be present');
  assert.strictEqual(data.matlabSimulation.crop, 'Rice');
  assert.ok(data.matlabSimulation.accumulatedGDD > 0);
  assert.ok(data.matlabSimulation.currentMoisturePct > 0);
  assert.ok(data.matlabSimulation.targetSafeMoisturePct === 14.5);
  assert.strictEqual(data.matlabSimulation.dailyMoistureCurve.length, 15);
  assert.ok(data.matlabSimulation.metadata.odeSolver.includes('Runge-Kutta'));

  // Verify Gemini Advisory
  assert.ok(data.geminiAdvisory, 'geminiAdvisory should be present');
  assert.ok(data.geminiAdvisory.summaryHeadline);
  assert.ok(data.geminiAdvisory.rainGuardedPlan);
  assert.ok(data.geminiAdvisory.storageRiskAnalysis);
  assert.ok(data.geminiAdvisory.machineryLogistics);
  assert.ok(Array.isArray(data.geminiAdvisory.actionChecklist));
});
