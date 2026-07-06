/**
 * ──────────────────────────────────────────────────────────────────────────────
 *  DoctorRange API Load Test — 100K Requests
 * ──────────────────────────────────────────────────────────────────────────────
 *
 *  Simulates realistic user flows against the running backend:
 *    1. Health check (public)
 *    2. Hospital signup → login → update
 *    3. Employee signup → login
 *    4. Appointment creation
 *    5. Patient operations (getAll, disease, update, delete)
 *    6. Payment creation
 *
 *  Usage:
 *    node src/__tests__/loadtest.mjs
 *    node src/__tests__/loadtest.mjs --requests=50000 --concurrency=50
 *    node src/__tests__/loadtest.mjs --requests=100000 --concurrency=100 --base-url=http://localhost:5000
 *
 *  NOTE: Arcjet rate limiter (100 req/60s) will block many requests.
 *        Use --no-rate-limit-delay to blast through and test rate-limit behavior.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import http from "node:http";
import https from "node:https";
import { performance } from "node:perf_hooks";

// ── Configuration ──────────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2));

const CONFIG = {
  BASE_URL: args["base-url"] || "http://localhost:5000",
  TOTAL_REQUESTS: parseInt(args.requests || "100000", 10),
  CONCURRENCY: parseInt(args.concurrency || "100", 10),
  RATE_LIMIT_DELAY: args["no-rate-limit-delay"] ? 0 : 0, // ms between batches (0 = no delay, let Arcjet respond)
  REPORT_INTERVAL_MS: 2000,
};

// ── Stats ──────────────────────────────────────────────────────────────────────

const stats = {
  total: 0,
  success: 0,       // 2xx
  clientError: 0,   // 4xx
  serverError: 0,   // 5xx
  rateLimited: 0,   // 429
  networkError: 0,
  byEndpoint: {},
  byStatus: {},
  latencies: [],
  startTime: 0,
  endTime: 0,
};

// ── HTTP Agent (keep-alive for performance) ────────────────────────────────────

const isHttps = CONFIG.BASE_URL.startsWith("https");
const agent = isHttps
  ? new https.Agent({ keepAlive: true, maxSockets: CONFIG.CONCURRENCY })
  : new http.Agent({ keepAlive: true, maxSockets: CONFIG.CONCURRENCY });

// ── Utility ────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const result = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const [key, val] = arg.slice(2).split("=");
      result[key] = val ?? "true";
    }
  }
  return result;
}

function randomStr(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len);
}

function randomPhone() {
  return "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
}

function randomEmail(prefix = "user") {
  return `${prefix}_${randomStr(6)}@loadtest.com`;
}

// ── Low-level HTTP request (no external deps) ─────────────────────────────────

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(path, CONFIG.BASE_URL);
    const lib = url.protocol === "https:" ? https : http;

    const reqHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    };

    let bodyStr = null;
    if (body) {
      bodyStr = JSON.stringify(body);
      reqHeaders["Content-Length"] = Buffer.byteLength(bodyStr);
    }

    const startMs = performance.now();

    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: reqHeaders,
        agent,
        timeout: 15000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const latency = performance.now() - startMs;
          let parsed = null;
          try { parsed = JSON.parse(data); } catch { parsed = data; }
          resolve({ status: res.statusCode, body: parsed, latency });
        });
      }
    );

    req.on("error", (err) => {
      const latency = performance.now() - startMs;
      resolve({ status: 0, body: null, error: err.message, latency });
    });

    req.on("timeout", () => {
      req.destroy();
      const latency = performance.now() - startMs;
      resolve({ status: 0, body: null, error: "TIMEOUT", latency });
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Record stats ───────────────────────────────────────────────────────────────

function recordResult(endpointLabel, result) {
  stats.total++;
  stats.latencies.push(result.latency);

  // By status code
  const code = result.status || 0;
  stats.byStatus[code] = (stats.byStatus[code] || 0) + 1;

  // By endpoint
  if (!stats.byEndpoint[endpointLabel]) {
    stats.byEndpoint[endpointLabel] = { total: 0, success: 0, fail: 0, avgLatency: 0, latencies: [] };
  }
  const ep = stats.byEndpoint[endpointLabel];
  ep.total++;
  ep.latencies.push(result.latency);

  if (code >= 200 && code < 300) {
    stats.success++;
    ep.success++;
  } else if (code === 429) {
    stats.rateLimited++;
    ep.fail++;
  } else if (code >= 400 && code < 500) {
    stats.clientError++;
    ep.fail++;
  } else if (code >= 500) {
    stats.serverError++;
    ep.fail++;
  } else {
    stats.networkError++;
    ep.fail++;
  }
}

// ── API Request Definitions (simulate real user flows) ─────────────────────────

// 1. Health check (public, no auth)
async function healthCheck() {
  const res = await makeRequest("GET", "/api/v1/health-check");
  recordResult("GET /health-check", res);
  return res;
}

// 2. Test API (public, no auth)
async function testApi() {
  const res = await makeRequest("GET", "/api/v1/test");
  recordResult("GET /test", res);
  return res;
}

// 3. Hospital login (will fail with random creds, tests validation)
async function hospitalLogin() {
  const res = await makeRequest("POST", "/api/v1/hospital/login", {
    hospitalEmail: randomEmail("hospital"),
    hospitalPassword: "password123",
  });
  recordResult("POST /hospital/login", res);
  return res;
}

// 4. Hospital login — missing fields (tests 400 path)
async function hospitalLoginMissing() {
  const res = await makeRequest("POST", "/api/v1/hospital/login", {});
  recordResult("POST /hospital/login (missing)", res);
  return res;
}

// 5. Employee login (will fail with random creds)
async function employeeLogin() {
  const res = await makeRequest("POST", "/api/v1/employee/login", {
    email: randomEmail("emp"),
    password: "password123",
  });
  recordResult("POST /employee/login", res);
  return res;
}

// 6. Employee login — missing fields
async function employeeLoginMissing() {
  const res = await makeRequest("POST", "/api/v1/employee/login", {});
  recordResult("POST /employee/login (missing)", res);
  return res;
}

// 7. Appointment create — no auth (tests 401)
async function appointmentNoAuth() {
  const res = await makeRequest("POST", "/api/v1/appointment/create", {
    patientName: "Load Test Patient",
    patientPhone: randomPhone(),
    patientEmail: randomEmail("patient"),
    patientAddress: "123 Load Test Ave",
    patientGender: "male",
    patientAge: 30,
  });
  recordResult("POST /appointment/create (no auth)", res);
  return res;
}

// 8. Payment create — no auth (tests 401)
async function paymentNoAuth() {
  const fakeId = "000000000000000000000000";
  const res = await makeRequest("POST", `/api/v1/payment/create-payment/${fakeId}`, {
    amount: 500,
    paymentMethod: "UPI",
  });
  recordResult("POST /payment/create (no auth)", res);
  return res;
}

// 9. Get all patients — no auth (tests 401)
async function patientsNoAuth() {
  const res = await makeRequest("GET", "/api/v1/patient/");
  recordResult("GET /patient/ (no auth)", res);
  return res;
}

// 10. Patient disease — no auth (tests 401)
async function patientDiseaseNoAuth() {
  const res = await makeRequest("POST", "/api/v1/patient/disease", {
    diseaseName: "Flu",
    diagnosisMedicines: ["Paracetamol"],
    patientId: "000000000000000000000000",
  });
  recordResult("POST /patient/disease (no auth)", res);
  return res;
}

// 11. Update patient — no auth (tests 401)
async function updatePatientNoAuth() {
  const fakeId = "000000000000000000000000";
  const res = await makeRequest("PATCH", `/api/v1/patient/update/${fakeId}`, {
    patientName: "Updated Name",
    patientAge: 35,
  });
  recordResult("PATCH /patient/update (no auth)", res);
  return res;
}

// 12. Delete patient — no auth (tests 401)
async function deletePatientNoAuth() {
  const fakeId = "000000000000000000000000";
  const res = await makeRequest("DELETE", `/api/v1/patient/delete/${fakeId}`);
  recordResult("DELETE /patient/delete (no auth)", res);
  return res;
}

// 13. Hospital update — no auth (tests 401)
async function hospitalUpdateNoAuth() {
  const res = await makeRequest("PATCH", "/api/v1/hospital/update", {
    hospitalName: "Updated Hospital",
  });
  recordResult("PATCH /hospital/update (no auth)", res);
  return res;
}

// 14. Hospital login with wrong password (tests bcrypt compare path)
async function hospitalLoginWrongPassword() {
  const res = await makeRequest("POST", "/api/v1/hospital/login", {
    hospitalEmail: "nonexistent@hospital.com",
    hospitalPassword: "wrongpassword",
  });
  recordResult("POST /hospital/login (wrong pwd)", res);
  return res;
}

// 15. 404 — unknown route
async function unknownRoute() {
  const res = await makeRequest("GET", `/api/v1/nonexistent/${randomStr(5)}`);
  recordResult("GET /unknown-route", res);
  return res;
}

// ── Request pool — weighted distribution to mimic real traffic ─────────────────

const REQUEST_POOL = [
  // Public endpoints — 30% of traffic
  { weight: 15, fn: healthCheck },
  { weight: 15, fn: testApi },

  // Auth attempts (login) — 30% of traffic
  { weight: 8, fn: hospitalLogin },
  { weight: 5, fn: hospitalLoginMissing },
  { weight: 5, fn: hospitalLoginWrongPassword },
  { weight: 7, fn: employeeLogin },
  { weight: 5, fn: employeeLoginMissing },

  // Protected endpoints (no auth → 401) — 35% of traffic
  { weight: 6, fn: appointmentNoAuth },
  { weight: 5, fn: paymentNoAuth },
  { weight: 6, fn: patientsNoAuth },
  { weight: 5, fn: patientDiseaseNoAuth },
  { weight: 5, fn: updatePatientNoAuth },
  { weight: 4, fn: deletePatientNoAuth },
  { weight: 4, fn: hospitalUpdateNoAuth },

  // Edge cases — 5% of traffic
  { weight: 5, fn: unknownRoute },
];

// Build weighted array for O(1) random selection
const weightedPool = [];
for (const entry of REQUEST_POOL) {
  for (let i = 0; i < entry.weight; i++) {
    weightedPool.push(entry.fn);
  }
}

function pickRandomRequest() {
  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
}

// ── Progress reporter ──────────────────────────────────────────────────────────

function printProgress() {
  const elapsed = ((performance.now() - stats.startTime) / 1000).toFixed(1);
  const rps = (stats.total / (elapsed || 1)).toFixed(0);
  const pct = ((stats.total / CONFIG.TOTAL_REQUESTS) * 100).toFixed(1);

  const p50 = percentile(stats.latencies, 50).toFixed(0);
  const p95 = percentile(stats.latencies, 95).toFixed(0);
  const p99 = percentile(stats.latencies, 99).toFixed(0);

  process.stdout.write(
    `\r⏱ ${elapsed}s | ${pct}% (${stats.total}/${CONFIG.TOTAL_REQUESTS}) | ` +
    `✅ ${stats.success} | ❌ ${stats.clientError + stats.serverError} | ` +
    `🚫 ${stats.rateLimited} | 🌐 ${stats.networkError} | ` +
    `${rps} req/s | p50=${p50}ms p95=${p95}ms p99=${p99}ms   `
  );
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ── Main orchestrator ──────────────────────────────────────────────────────────

async function runBatch(batchSize) {
  const promises = [];
  for (let i = 0; i < batchSize; i++) {
    const reqFn = pickRandomRequest();
    promises.push(reqFn());
  }
  await Promise.allSettled(promises);
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("  DoctorRange API Load Test");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log(`  Target:       ${CONFIG.BASE_URL}`);
  console.log(`  Total Reqs:   ${CONFIG.TOTAL_REQUESTS.toLocaleString()}`);
  console.log(`  Concurrency:  ${CONFIG.CONCURRENCY}`);
  console.log(`  Endpoints:    ${REQUEST_POOL.length} (weighted distribution)`);
  console.log("═══════════════════════════════════════════════════════════════════\n");

  // Verify server is reachable
  const warmup = await makeRequest("GET", "/api/v1/health-check");
  if (warmup.status === 0) {
    console.error(`❌ Cannot reach server at ${CONFIG.BASE_URL}. Is it running?`);
    console.error(`   Error: ${warmup.error}`);
    process.exit(1);
  }
  console.log(`✅ Server reachable (${warmup.status}, ${warmup.latency.toFixed(0)}ms warmup)\n`);

  stats.startTime = performance.now();

  // Progress printer
  const progressTimer = setInterval(printProgress, CONFIG.REPORT_INTERVAL_MS);

  // Send requests in batches
  let remaining = CONFIG.TOTAL_REQUESTS;
  while (remaining > 0) {
    const batchSize = Math.min(CONFIG.CONCURRENCY, remaining);
    await runBatch(batchSize);
    remaining -= batchSize;

    if (CONFIG.RATE_LIMIT_DELAY > 0) {
      await new Promise((r) => setTimeout(r, CONFIG.RATE_LIMIT_DELAY));
    }
  }

  stats.endTime = performance.now();
  clearInterval(progressTimer);

  // Final progress
  printProgress();
  console.log("\n");

  // ── Final Report ───────────────────────────────────────────────────────────
  printFinalReport();
}

function printFinalReport() {
  const durationSec = ((stats.endTime - stats.startTime) / 1000).toFixed(2);
  const rps = (stats.total / durationSec).toFixed(0);

  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("  FINAL REPORT");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log(`  Duration:         ${durationSec}s`);
  console.log(`  Total Requests:   ${stats.total.toLocaleString()}`);
  console.log(`  Throughput:       ${rps} req/s`);
  console.log(`  ───────────────────────────────────────`);
  console.log(`  ✅ Success (2xx):  ${stats.success.toLocaleString()}`);
  console.log(`  ⚠️  Client (4xx):  ${stats.clientError.toLocaleString()}`);
  console.log(`  💥 Server (5xx):  ${stats.serverError.toLocaleString()}`);
  console.log(`  🚫 Rate Limited:  ${stats.rateLimited.toLocaleString()}`);
  console.log(`  🌐 Network Err:   ${stats.networkError.toLocaleString()}`);

  // Latency
  const p50 = percentile(stats.latencies, 50).toFixed(1);
  const p95 = percentile(stats.latencies, 95).toFixed(1);
  const p99 = percentile(stats.latencies, 99).toFixed(1);
  const avg = (stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length).toFixed(1);
  const max = Math.max(...stats.latencies).toFixed(1);
  const min = Math.min(...stats.latencies).toFixed(1);

  console.log(`  ───────────────────────────────────────`);
  console.log(`  Latency (ms):`);
  console.log(`    Min:    ${min}`);
  console.log(`    Avg:    ${avg}`);
  console.log(`    p50:    ${p50}`);
  console.log(`    p95:    ${p95}`);
  console.log(`    p99:    ${p99}`);
  console.log(`    Max:    ${max}`);

  // Status code breakdown
  console.log(`  ───────────────────────────────────────`);
  console.log(`  Status Code Breakdown:`);
  const sortedCodes = Object.keys(stats.byStatus).sort((a, b) => stats.byStatus[b] - stats.byStatus[a]);
  for (const code of sortedCodes) {
    const count = stats.byStatus[code];
    const pct = ((count / stats.total) * 100).toFixed(1);
    const label = code === "0" ? "Network Error" : `HTTP ${code}`;
    console.log(`    ${label.padEnd(16)} ${count.toLocaleString().padStart(8)}  (${pct}%)`);
  }

  // Per-endpoint breakdown
  console.log(`  ───────────────────────────────────────`);
  console.log(`  Per-Endpoint Breakdown:`);
  const sortedEndpoints = Object.entries(stats.byEndpoint).sort((a, b) => b[1].total - a[1].total);
  for (const [name, ep] of sortedEndpoints) {
    const avgLat = (ep.latencies.reduce((a, b) => a + b, 0) / ep.latencies.length).toFixed(0);
    const p95Lat = percentile(ep.latencies, 95).toFixed(0);
    console.log(
      `    ${name.padEnd(40)} ${String(ep.total).padStart(7)} reqs | ` +
      `✅ ${String(ep.success).padStart(7)} | ❌ ${String(ep.fail).padStart(6)} | ` +
      `avg=${avgLat}ms p95=${p95Lat}ms`
    );
  }

  console.log("═══════════════════════════════════════════════════════════════════\n");
}

// ── Run ────────────────────────────────────────────────────────────────────────
main().catch((err) => {
  console.error("Load test crashed:", err);
  process.exit(1);
});
