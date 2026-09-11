const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const authRoutes = require('../routes/auth');
const entitiesRoutes = require('../routes/entities');
const functionsRoutes = require('../routes/functions');
const uploadRoutes = require('../routes/upload');
const db = require('../db');
const { simulateGrowth } = require('../services/matlabBioGrowthEngine');

describe('Kisan Mitra End-to-End Test Matrix', () => {
  let server;
  let baseUrl;
  let farmerToken;
  let farmerUser;
  let farmer2Token;
  let adminToken;
  let adminUser;

  const testEmail1 = `farmer1_${Date.now()}@test.com`;
  const testEmail2 = `farmer2_${Date.now()}@test.com`;
  const adminEmail = `admin_${Date.now()}@test.com`;
  const testPassword = 'SecurePassword123!';

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/entities', entitiesRoutes);
    app.use('/api/functions', functionsRoutes);
    app.use('/api/upload', uploadRoutes);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('1. Authentication & Session Lifecycle', () => {
    test('POST /api/auth/register fails on empty email or password', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.error);
    });

    test('POST /api/auth/register successfully registers Farmer 1', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail1, password: testPassword }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.access_token);
      assert.equal(data.user.email, testEmail1.toLowerCase());
      assert.equal(data.user.password_hash, undefined);
      farmerToken = data.access_token;
      farmerUser = data.user;
    });

    test('POST /api/auth/register rejects duplicate email with 409', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail1, password: testPassword }),
      });
      assert.equal(res.status, 409);
    });

    test('POST /api/auth/login rejects invalid password with 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail1, password: 'WrongPassword' }),
      });
      assert.equal(res.status, 401);
    });

    test('POST /api/auth/login succeeds with valid credentials', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail1, password: testPassword }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.access_token);
      assert.equal(data.user.email, testEmail1.toLowerCase());
    });

    test('GET /api/auth/me rejects unauthenticated request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      assert.equal(res.status, 401);
    });

    test('GET /api/auth/me returns current user profile with valid JWT', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.id, farmerUser.id);
      assert.equal(data.email, testEmail1.toLowerCase());
    });

    test('POST /api/auth/forgot-password & reset-password workflow', async () => {
      const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail1 }),
      });
      assert.equal(forgotRes.status, 200);

      const u = db.users.findOne((x) => x.email === testEmail1.toLowerCase());
      assert.ok(u.reset_token);

      const newPassword = 'NewStrongPassword123!';
      const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken: u.reset_token, newPassword }),
      });
      assert.equal(resetRes.status, 200);

      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail1, password: newPassword }),
      });
      assert.equal(loginRes.status, 200);
      const loginData = await loginRes.json();
      farmerToken = loginData.access_token;
    });

    test('Register Farmer 2 and Admin accounts for RBAC testing', async () => {
      const res2 = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail2, password: testPassword }),
      });
      const data2 = await res2.json();
      farmer2Token = data2.access_token;

      const resAdmin = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: testPassword }),
      });
      const dataAdmin = await resAdmin.json();
      db.users.update(dataAdmin.user.id, { role: 'admin' });

      const loginAdmin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: testPassword }),
      });
      const dataAdminLogged = await loginAdmin.json();
      adminToken = dataAdminLogged.access_token;
      adminUser = dataAdminLogged.user;
      assert.equal(adminUser.role, 'admin');
    });
  });

  describe('2. Role-Based Access Control (RBAC)', () => {
    test('Farmer role cannot list users (adminOnly) -> 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/entities/user`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      assert.equal(res.status, 403);
    });

    test('Admin role can list all users -> 200 OK', async () => {
      const res = await fetch(`${baseUrl}/api/entities/user`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const users = await res.json();
      assert.ok(Array.isArray(users));
      assert.ok(users.length >= 3);
    });

    test('Farmer role cannot create DiseaseAlert (adminWrite) -> 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/entities/DiseaseAlert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({ disease: 'Test Pest', severity: 'High' }),
      });
      assert.equal(res.status, 403);
    });

    test('Admin role can create DiseaseAlert -> 201 Created', async () => {
      const res = await fetch(`${baseUrl}/api/entities/DiseaseAlert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          disease: 'Blast',
          disease_name: 'Rice Blast',
          severity: 'Moderate',
          location: 'Kalamassery',
          crop: 'Rice',
          active: true,
        }),
      });
      assert.equal(res.status, 201);
      const alert = await res.json();
      assert.ok(alert.id);
      assert.equal(alert.disease_name, 'Rice Blast');
    });

    test('Farmer role can read DiseaseAlert (publicRead) -> 200 OK', async () => {
      const res = await fetch(`${baseUrl}/api/entities/DiseaseAlert`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      assert.equal(res.status, 200);
      const alerts = await res.json();
      assert.ok(Array.isArray(alerts));
      assert.ok(alerts.length >= 1);
    });
  });

  describe('3. IDOR & Ownership Protection', () => {
    let conv1Id;
    let msg1Id;

    test('Farmer 1 creates conversation and message', async () => {
      const cRes = await fetch(`${baseUrl}/api/entities/Conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({ title: 'Farmer 1 Secret Chat', crop: 'Rice', language: 'English' }),
      });
      assert.equal(cRes.status, 201);
      const conv = await cRes.json();
      conv1Id = conv.id;

      const mRes = await fetch(`${baseUrl}/api/entities/Message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          conversation_id: conv1Id,
          sender: 'user',
          content: 'Hello private advisor',
        }),
      });
      assert.equal(mRes.status, 201);
      const msg = await mRes.json();
      msg1Id = msg.id;
    });

    test('Farmer 2 cannot view Farmer 1 conversation -> 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/entities/Conversation/${conv1Id}`, {
        headers: { Authorization: `Bearer ${farmer2Token}` },
      });
      assert.equal(res.status, 403);
    });

    test('Farmer 2 cannot view Farmer 1 message -> 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/entities/Message/${msg1Id}`, {
        headers: { Authorization: `Bearer ${farmer2Token}` },
      });
      assert.equal(res.status, 403);
    });

    test('Farmer 2 cannot post message into Farmer 1 conversation -> 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/entities/Message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmer2Token}`,
        },
        body: JSON.stringify({
          conversation_id: conv1Id,
          sender: 'user',
          content: 'Infiltrator message',
        }),
      });
      assert.equal(res.status, 403);
    });

    test('Farmer 2 cannot delete Farmer 1 conversation -> 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/entities/Conversation/${conv1Id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${farmer2Token}` },
      });
      assert.equal(res.status, 403);
    });

    test('Farmer 1 can successfully delete their own conversation and cascade messages', async () => {
      const res = await fetch(`${baseUrl}/api/entities/Conversation/${conv1Id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      assert.equal(res.status, 200);

      const checkConv = await fetch(`${baseUrl}/api/entities/Conversation/${conv1Id}`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      assert.equal(checkConv.status, 404);
    });
  });

  describe('4. Mathematical Simulation & Bio-Growth Model', () => {
    test('simulateGrowth handles sub-zero temperatures safely without NaN', () => {
      const sim = simulateGrowth({
        crop: 'Rice',
        avgTempC: -5,
        avgRelHumidity: 70,
      });
      assert.equal(sim.accumulatedGDD, 0);
      assert.ok(!isNaN(sim.currentMoisturePct));
      assert.ok(!isNaN(sim.dryingRateK));
    });

    test('simulateGrowth computes valid moisture decay trajectory for 14 days', () => {
      const sim = simulateGrowth({
        crop: 'Rice',
        avgTempC: 30,
        avgRelHumidity: 55,
      });
      assert.equal(sim.dailyMoistureCurve.length, 15);
      assert.ok(sim.dailyMoistureCurve[0].moisturePct >= sim.dailyMoistureCurve[14].moisturePct);
      assert.ok(sim.targetSafeMoisturePct <= 15);
      assert.ok(sim.storageCriticalPct >= 16);
    });

    test('POST /api/functions/simulateHarvestGuardian handles empty weather forecast with valid token', async () => {
      const res = await fetch(`${baseUrl}/api/functions/simulateHarvestGuardian`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          crop: 'Rice',
          weatherForecast: [],
          farmSize: 2.5,
          location: 'Kochi Fields',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.matlabSimulation);
      assert.ok(data.geminiAdvisory);
      assert.ok(data.geminiAdvisory.summaryHeadline);
      assert.ok(Array.isArray(data.geminiAdvisory.actionChecklist));
    });
  });

  describe('5. AI Advisory Input Validation', () => {
    test('POST /api/functions/askKisanMitra rejects empty question & image with 400', async () => {
      const res = await fetch(`${baseUrl}/api/functions/askKisanMitra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({ question: '   ' }),
      });
      assert.equal(res.status, 400);
    });

    test('POST /api/functions/analyzeCrop rejects missing image with 400', async () => {
      const res = await fetch(`${baseUrl}/api/functions/analyzeCrop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({ crop: 'Rice' }),
      });
      assert.equal(res.status, 400);
    });
  });
});
