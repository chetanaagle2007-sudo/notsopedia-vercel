/**
 * NOTSOPEDIA SCHEDULED AUTONOMOUS MAINTENANCE & M2M AUTHENTICATION TESTS
 *
 * Verifies:
 * 1. GitHub Actions workflow specification (cron, timeout, concurrency, permissions)
 * 2. Timing-safe Machine-to-Machine authentication via AUTONOMOUS_MAINTENANCE_KEY
 * 3. Daily maintenance cycle execution, unique runId, duration, metrics, and truthful states
 * 4. High-risk action gating (AWAITING_APPROVAL) and intervention flagging
 * 5. Concurrency protection & idempotent execution
 * 6. Incident state persistence across engine restarts
 *
 * Run: npx tsx tests/scheduled-maintenance.test.ts
 */

import assert from "assert";
import http from "http";
import fs from "fs";
import path from "path";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  ✅ PASS  ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ FAIL  ${name}`);
    console.error(`          ${err.stack || err.message || err}`);
    failed++;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Spin up Mock Supabase Service
// ────────────────────────────────────────────────────────────────────────────

const mockSupabaseServer = http.createServer((req, res) => {
  const url = req.url || "";
  const authHeader = req.headers["authorization"] || "";

  if (authHeader === "Bearer admin-jwt-token") {
    if (url.startsWith("/auth/v1/user")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          id: "usr-admin-1",
          email: "chetanaagle2007@gmail.com",
          user_metadata: { isAdmin: true, role: "Admin" }
        })
      );
    }
    if (url.startsWith("/rest/v1/users")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ is_admin: true }));
    }
  } else if (authHeader === "Bearer student-jwt-token") {
    if (url.startsWith("/auth/v1/user")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          id: "usr-student-2",
          email: "student@university.edu",
          user_metadata: { isAdmin: false, role: "Student" }
        })
      );
    }
    if (url.startsWith("/rest/v1/users")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ is_admin: false }));
    }
  } else {
    res.writeHead(401, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Invalid token" }));
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

let supabasePort = 0;
await new Promise<void>((resolve) => {
  mockSupabaseServer.listen(0, "127.0.0.1", () => {
    supabasePort = (mockSupabaseServer.address() as any).port;
    resolve();
  });
});

const TEST_M2M_SECRET = "sec-m2m-notsopedia-sched-test-key-987654321";

process.env.SUPABASE_URL = `http://127.0.0.1:${supabasePort}`;
process.env.SUPABASE_PUBLISHABLE_KEY = "test-pub-key";
process.env.ADMIN_EMAILS = "chetanaagle2007@gmail.com";
process.env.AUTONOMOUS_MAINTENANCE_KEY = TEST_M2M_SECRET;
process.env.VERCEL = "1";

// Import server app and engine
const {
  globalAutonomousEngine,
  default: app
} = await import("../server.ts");

const { AutonomousEngine } = await import("../server/autonomousEngine.ts");

// Spin up test HTTP server
let appPort = 0;
const testServer = http.createServer(app);
await new Promise<void>((resolve) => {
  testServer.listen(0, "127.0.0.1", () => {
    appPort = (testServer.address() as any).port;
    resolve();
  });
});

function requestApp(
  method: string,
  urlPath: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      `http://127.0.0.1:${appPort}${urlPath}`,
      {
        method,
        headers: {
          ...(data
            ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data).toString() }
            : {}),
          ...headers
        }
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let parsed: any;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode || 500, body: parsed, headers: res.headers });
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

console.log("\n──────────────────────────────────────────────────────────────");
console.log("NOTSOPEDIA SCHEDULED AUTONOMOUS MAINTENANCE TEST SUITE");
console.log("──────────────────────────────────────────────────────────────\n");

// --- Suite 1: GitHub Actions Workflow Validation ---
console.log("--- Suite 1: GitHub Actions Workflow Configuration Audit ---");

await test("1. Workflow YAML file exists at .github/workflows/notsopedia-daily-maintenance.yml", () => {
  const workflowPath = path.join(process.cwd(), ".github", "workflows", "notsopedia-daily-maintenance.yml");
  assert.ok(fs.existsSync(workflowPath), "Workflow file must exist on disk");
});

await test("2. Workflow specifies 21:00 UTC schedule (02:30 AM IST)", () => {
  const workflowContent = fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", "notsopedia-daily-maintenance.yml"),
    "utf8"
  );
  assert.ok(workflowContent.includes("cron: '0 21 * * *'"), "Must have 0 21 * * * schedule");
  assert.ok(workflowContent.includes("02:30 AM IST"), "Must document IST conversion");
});

await test("3. Workflow specifies bounded timeout, least permissions, and concurrency lock", () => {
  const workflowContent = fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", "notsopedia-daily-maintenance.yml"),
    "utf8"
  );
  assert.ok(workflowContent.includes("timeout-minutes: 10"), "Must set bounded job timeout");
  assert.ok(workflowContent.includes("permissions:\n  contents: read"), "Least privilege contents: read");
  assert.ok(workflowContent.includes("group: notsopedia-daily-maintenance"), "Must have concurrency group");
  assert.ok(workflowContent.includes("cancel-in-progress: false"), "Concurrency must not cancel running maintenance");
  assert.ok(workflowContent.includes("workflow_dispatch"), "Must support manual trigger");
});

await test("4. Workflow targets AUTONOMOUS_MAINTENANCE_KEY repository secret without printing", () => {
  const workflowContent = fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", "notsopedia-daily-maintenance.yml"),
    "utf8"
  );
  assert.ok(workflowContent.includes("secrets.AUTONOMOUS_MAINTENANCE_KEY"));
  assert.ok(!workflowContent.includes("echo $MAINTENANCE_KEY"), "Never echo secret");
});

// --- Suite 2: Machine-to-Machine Authorization ---
console.log("\n--- Suite 2: Machine-to-Machine Timing-Safe Authentication ---");

await test("5. Missing credentials to /api/admin/autonomous/daily-maintenance returns HTTP 401", async () => {
  const res = await requestApp("POST", "/api/admin/autonomous/daily-maintenance");
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error, "Authentication is required.");
});

await test("6. Invalid X-Autonomous-Maintenance-Key returns HTTP 401", async () => {
  const res = await requestApp("POST", "/api/admin/autonomous/daily-maintenance", {}, {
    "X-Autonomous-Maintenance-Key": "invalid-wrong-key-12345"
  });
  assert.strictEqual(res.status, 401);
});

await test("7. Non-admin student user JWT is rejected with HTTP 403", async () => {
  const res = await requestApp("POST", "/api/admin/autonomous/daily-maintenance", {}, {
    Authorization: "Bearer student-jwt-token"
  });
  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error, "Administrator privileges are required.");
});

await test("8. Valid X-Autonomous-Maintenance-Key authorizes M2M maintenance request with HTTP 200", async () => {
  const res = await requestApp("POST", "/api/admin/autonomous/daily-maintenance", {}, {
    "X-Autonomous-Maintenance-Key": TEST_M2M_SECRET
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.report);
  assert.ok(res.body.report.runId.startsWith("maint-"));
});

await test("9. Valid Bearer token matching AUTONOMOUS_MAINTENANCE_KEY also authorizes M2M caller", async () => {
  const res = await requestApp("POST", "/api/admin/autonomous/daily-maintenance", { force: true }, {
    Authorization: `Bearer ${TEST_M2M_SECRET}`
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
});

// --- Suite 3: Maintenance Lifecycle & Reporting ---
console.log("\n--- Suite 3: Maintenance Lifecycle, Idempotency & Failure Gating ---");

await test("10. Maintenance cycle returns comprehensive structured report", async () => {
  const res = await requestApp("POST", "/api/admin/autonomous/daily-maintenance", { force: true }, {
    "X-Autonomous-Maintenance-Key": TEST_M2M_SECRET
  });

  const { report } = res.body;
  assert.ok(report.runId);
  assert.ok(report.startTime);
  assert.ok(report.endTime);
  assert.ok(typeof report.durationMs === "number");
  assert.ok(["SUCCESS", "PARTIAL_SUCCESS", "AWAITING_APPROVAL", "FAILED"].includes(report.status));
  assert.ok(report.metrics);
  assert.ok(typeof report.metrics.totalIncidentsScanned === "number");
  assert.ok(typeof report.metrics.lowRiskRepairsAttempted === "number");
  assert.ok(typeof report.metrics.lowRiskRepairsVerified === "number");
  assert.ok(report.deploymentHealth);
  assert.ok(typeof report.manualInterventionRequired === "boolean");
});

await test("11. Concurrency guard prevents duplicate overlapping execution", async () => {
  const engine = new AutonomousEngine();

  // Simulate long-running maintenance
  (engine as any).isMaintenanceRunning = true;

  try {
    await engine.runDailyMaintenanceCycle();
    assert.fail("Should have thrown error on concurrent execution");
  } catch (err: any) {
    assert.ok(err.message.includes("currently in progress"));
  } finally {
    (engine as any).isMaintenanceRunning = false;
  }
});

await test("12. Force flag overrides concurrent lock in emergency re-run", async () => {
  const engine = new AutonomousEngine();
  (engine as any).isMaintenanceRunning = true;

  const res = await engine.runDailyMaintenanceCycle({ force: true });
  assert.strictEqual(res.success, true);
  assert.ok(res.report.runId);
});

await test("13. High-risk incident stops maintenance cycle in AWAITING_APPROVAL with manual intervention flag", async () => {
  const engine = new AutonomousEngine();

  // Register a high-risk incident
  engine.recordIncident({
    category: "data_integrity",
    severity: "critical",
    riskLevel: "high_approval_required",
    status: "DETECTED",
    title: "Critical Schema Anomaly",
    summary: "Requires destructive migration",
    diagnosticEvidence: {}
  });

  const res = await engine.runDailyMaintenanceCycle({ force: true });
  assert.strictEqual(res.report.status, "AWAITING_APPROVAL");
  assert.strictEqual(res.report.manualInterventionRequired, true);
  assert.ok(res.report.metrics.highRiskAwaitingApproval > 0);
  assert.ok(res.report.message.includes("require administrator approval"));
});

// --- Suite 4: State Persistence Across Restarts ---
console.log("\n--- Suite 4: Incident & Audit State Persistence Across Restarts ---");

await test("14. Engine persists state to disk and loads on fresh instantiation", () => {
  const engine1 = new AutonomousEngine();
  const testId = `inc-persist-test-${Date.now()}`;
  engine1.recordIncident({
    id: testId,
    category: "security_xss",
    severity: "medium",
    riskLevel: "low_auto",
    status: "DETECTED",
    title: "Persistence Verification Incident",
    summary: "Verifying survival across lambda recycling",
    diagnosticEvidence: {}
  });

  // Create a brand new engine instance representing server restart
  const engine2 = new AutonomousEngine();
  const recovered = engine2.getIncident(testId);
  assert.ok(recovered, "Incident must be recovered from disk store");
  assert.strictEqual(recovered?.title, "Persistence Verification Incident");
});

// Teardown
testServer.close();
mockSupabaseServer.close();

console.log("\n══════════════════════════════════════════════════════════════");
console.log(`  SCHEDULED MAINTENANCE SUITE COMPLETE: ${passed} passed, ${failed} failed`);
console.log("══════════════════════════════════════════════════════════════\n");

process.exit(failed > 0 ? 1 : 0);
