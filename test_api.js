const http = require('http');

const PORT = 8000;
const BASE = `http://127.0.0.1:${PORT}`;

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      if (typeof body === 'object' && !(body instanceof Buffer)) {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(body));
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING INFRASIGHT FULL STACK API SUITE ---');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /health returns 200 OK', async () => {
    const res = await request('/health');
    if (res.status !== 200 || res.data.status !== 'ok') throw new Error(`Status ${res.status}`);
  });

  // 2. Stats
  await test('GET /stats returns Indore infrastructure metrics', async () => {
    const res = await request('/stats');
    if (res.status !== 200 || typeof res.data.total_reports !== 'number') throw new Error(`Invalid stats: ${JSON.stringify(res.data)}`);
    console.log(`       Stats: Total reports = ${res.data.total_reports}, Critical = ${res.data.critical_issues}, Resolved = ${res.data.resolved_issues}`);
  });

  // 3. Issues list
  await test('GET /issues returns seeded list of issues', async () => {
    const res = await request('/issues');
    if (res.status !== 200 || !Array.isArray(res.data) || res.data.length === 0) throw new Error('Expected array of issues');
    console.log(`       Issues count: ${res.data.length}`);
  });

  // 4. Single issue
  await test('GET /issues/IS-0092 returns single issue details', async () => {
    const res = await request('/issues/IS-0092');
    if (res.status !== 200 || res.data.id !== 'IS-0092') throw new Error(`Not found or wrong id: ${JSON.stringify(res.data)}`);
    console.log(`       Issue IS-0092 title: "${res.data.title}", Area: ${res.data.area}`);
  });

  // 5. Heatmap
  await test('GET /heatmap returns cluster coordinates', async () => {
    const res = await request('/heatmap');
    if (res.status !== 200 || !Array.isArray(res.data) || res.data.length === 0) throw new Error('Expected heatmap coordinates array');
    console.log(`       Heatmap points: ${res.data.length}`);
  });

  // 6. AI Scan simulation
  await test('POST /reports/scan runs Computer Vision inference', async () => {
    const res = await request('/reports/scan', { method: 'POST' });
    if (res.status !== 200 || !res.data.detections || res.data.detections.length === 0) throw new Error('No detections');
    console.log(`       Detected class: ${res.data.detected_class}, confidence: ${res.data.confidence}`);
  });

  // 7. Create Citizen Report
  let createdId = null;
  await test('POST /reports creates a new citizen issue report', async () => {
    const payload = {
      title: 'Water pipe leak near Palasia square',
      category: 'Water Supply',
      address: 'Palasia Square, AB Road',
      area: 'Palasia',
      ward: 'Ward 45',
      description: 'Clean drinking water leaking on road for 3 hours',
      latitude: 22.7244,
      longitude: 75.8839,
      citizen_name: 'Antigravity Test Runner',
      citizen_phone: '+91 99999 88888'
    };
    const res = await request('/reports', { method: 'POST' }, payload);
    if (res.status !== 201 || !res.data.id) throw new Error(`Create failed: ${JSON.stringify(res.data)}`);
    createdId = res.data.id;
    console.log(`       Created Issue ID: ${createdId}, Ref: ${res.data.complaints[0]?.reference_number}`);
  });

  // 8. Patch Status
  await test(`PATCH /issues/${createdId}/status updates status`, async () => {
    const res = await request(`/issues/${createdId}/status`, { method: 'PATCH' }, { status: 'In Progress', changed_by: 'Test Officer' });
    if (res.status !== 200 || res.data.status !== 'In Progress') throw new Error(`Update status failed: ${JSON.stringify(res.data)}`);
    console.log(`       Updated status to: ${res.data.status}`);
  });

  // 9. Verify Repair
  await test(`POST /issues/${createdId}/verify-repair marks issue resolved`, async () => {
    const res = await request(`/issues/${createdId}/verify-repair`, { method: 'POST' }, { officer: 'Chief Sanitary Inspector', notes: 'Inspection passed' });
    if (res.status !== 200 || !res.data.success) throw new Error(`Verify failed: ${JSON.stringify(res.data)}`);
    console.log(`       Verification successful: status is now ${res.data.issue.status}`);
  });

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
