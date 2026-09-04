const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server');
const db = require('../db');

let server;
let baseUrl;

before((_, done) => {
  server = http.createServer(app);
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    done();
  });
});

after((_, done) => {
  if (server) server.close(done);
  else done();
});

describe('Kisan Mitra Production API & SQLite Database', () => {
  let authToken = '';
  let testUserId = '';
  const testEmail = `farmer_${Date.now()}@example.com`;

  test('GET /api/health returns 200 with ok status and security headers', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.ok(body.timestamp);

    // Verify security headers
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  });

  test('SQLite database is initialized and collections are queryable', () => {
    assert.equal(db._isSqlite(), true, 'Database should be SQLite-backed');
    const alerts = db.disease_alerts.list();
    assert.ok(Array.isArray(alerts));
    assert.ok(alerts.length >= 3, 'Pre-seeded alerts should be present');

    const prices = db.market_prices.list();
    assert.ok(Array.isArray(prices));
    assert.ok(prices.length >= 4, 'Pre-seeded market prices should be present');
  });

  test('POST /api/auth/register creates a new user and returns JWT token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword123!',
        full_name: 'Test Farmer'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.access_token, 'Should return access token');
    assert.ok(data.user);
    assert.equal(data.user.email, testEmail.toLowerCase());
    assert.equal(data.user.password_hash, undefined, 'Password hash should be sanitized');

    authToken = data.access_token;
    testUserId = data.user.id;
  });

  test('POST /api/auth/login authenticates user and returns valid token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword123!'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.access_token);
    assert.equal(data.user.id, testUserId);
  });

  test('GET /api/auth/me verifies authenticated user', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    assert.equal(res.status, 200);
    const user = await res.json();
    assert.equal(user.id, testUserId);
    assert.equal(user.email, testEmail.toLowerCase());
  });

  test('Entity CRUD on SQLite: Farm creation, listing, update, and deletion', async () => {
    // Create farm
    const createRes = await fetch(`${baseUrl}/api/entities/Farm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Green Valley Organic Farm',
        crop: 'Rice',
        acreage: 4.5,
        location: 'Palakkad, Kerala',
        soil_type: 'Alluvial'
      })
    });

    assert.equal(createRes.status, 201);
    const farm = await createRes.json();
    assert.ok(farm.id);
    assert.equal(farm.name, 'Green Valley Organic Farm');
    assert.equal(farm.crop, 'Rice');

    // List farms
    const listRes = await fetch(`${baseUrl}/api/entities/Farm`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert.equal(listRes.status, 200);
    const list = await listRes.json();
    assert.ok(list.some(f => f.id === farm.id));

    // Update farm
    const updateRes = await fetch(`${baseUrl}/api/entities/Farm/${farm.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Green Valley Premium Farm',
        acreage: 5.0
      })
    });
    assert.equal(updateRes.status, 200);
    const updated = await updateRes.json();
    assert.equal(updated.name, 'Green Valley Premium Farm');
    assert.equal(updated.acreage, 5.0);

    // Delete farm
    const deleteRes = await fetch(`${baseUrl}/api/entities/Farm/${farm.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert.equal(deleteRes.status, 200);
    const deleteData = await deleteRes.json();
    assert.equal(deleteData.success, true);
  });

  test('Rate limiting triggers on excessive requests', async () => {
    // Send 35 fast requests to /api/auth/login to exceed limit of 30
    let rateLimited = false;
    for (let i = 0; i < 35; i++) {
      const r = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'spam@test.com', password: 'test' })
      });
      if (r.status === 429) {
        rateLimited = true;
        break;
      }
    }
    assert.equal(rateLimited, true, 'Rate limiter should respond with status 429');
  });
});
