/**
 * NOTSOPEDIA AUTONOMOUS HEALING, INCIDENT DIAGNOSIS & RECOVERY TESTS
 *
 * Verifies:
 * 1. Context-aware HTML sanitization & vector neutralization
 * 2. Mathematical formula and Markdown preservation
 * 3. Privacy-conscious secret redaction
 * 4. Incident lifecycle state machine & risk classification
 * 5. High-risk approval gate enforcement
 * 6. Deterministic verification after repair
 * 7. End-to-end HTTP endpoints, RBAC, and telemetry ingestion
 *
 * Run: npx tsx tests/autonomous-healing.test.ts
 */

import assert from "assert";
import http from "http";

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
// Spin up Mock Supabase Service (Supporting Auth & Profiles)
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

process.env.SUPABASE_URL = `http://127.0.0.1:${supabasePort}`;
process.env.SUPABASE_PUBLISHABLE_KEY = "test-pub-key";
process.env.ADMIN_EMAILS = "chetanaagle2007@gmail.com";
process.env.VERCEL = "1";

// Import modules under test
const {
  globalAutonomousEngine,
  sanitizeDangerousHtml,
  redactSensitiveData,
  default: app
} = await import("../server.ts");

const { AutonomousEngine } = await import("../server/autonomousEngine.ts");

// Spin up test HTTP server for Notsopedia app
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
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      `http://127.0.0.1:${appPort}${path}`,
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
console.log("NOTSOPEDIA AUTONOMOUS HEALING & CONTINUOUS REPAIR TEST SUITE");
console.log("──────────────────────────────────────────────────────────────\n");

// --- Suite 1: Sanitization & Safe Redaction ---
console.log("--- Suite 1: Context-Aware Sanitization & Secret Redaction ---");

await test("1. sanitizeDangerousHtml neutralizes executable <script> tags", () => {
  const dirty = "Study notes about algorithms <script>alert('pwned')</script> and trees.";
  const res = sanitizeDangerousHtml(dirty);
  assert.strictEqual(res.modificationsCount, 1);
  assert.ok(res.vectorsFound.includes("executable_script_tag"));
  assert.ok(!res.sanitized.includes("<script>"));
  assert.ok(res.sanitized.includes("&lt;script&gt;alert('pwned')&lt;/script&gt;"));
  assert.ok(res.sanitized.includes("Study notes about algorithms"));
});

await test("2. sanitizeDangerousHtml neutralizes javascript: URI schemes in links", () => {
  const dirty = 'Click <a href="javascript:stealTokens()">here</a> for solutions.';
  const res = sanitizeDangerousHtml(dirty);
  assert.strictEqual(res.modificationsCount, 1);
  assert.ok(res.vectorsFound.includes("javascript_uri_scheme"));
  assert.ok(!res.sanitized.includes("javascript:"));
  assert.ok(res.sanitized.includes('href="#sanitized-javascript-vector"'));
});

await test("3. sanitizeDangerousHtml neutralizes inline DOM event attributes (onload/onerror)", () => {
  const dirty = '<img src="invalid.png" onerror="alert(1)" onload="evil()" /> Diagram';
  const res = sanitizeDangerousHtml(dirty);
  assert.strictEqual(res.modificationsCount, 2);
  assert.ok(res.vectorsFound.includes("inline_dom_event_handler"));
  assert.ok(!res.sanitized.includes("onerror="));
  assert.ok(!res.sanitized.includes("onload="));
  assert.ok(res.sanitized.includes('data-removed-event="sanitized"'));
});

await test("4. sanitizeDangerousHtml preserves mathematical formulas and markdown syntax", () => {
  const mathContent = `The Schrödinger equation is:
$$\\hat{H}\\psi = E\\psi$$
Where probability amplitude is given by $\\int |\\psi(x)|^2 dx = 1$.
\`\`\`python
def solve_energy(h, psi):
    return h * psi
\`\`\``;
  const res = sanitizeDangerousHtml(mathContent);
  assert.strictEqual(res.modificationsCount, 0);
  assert.strictEqual(res.sanitized, mathContent);
});

await test("5. redactSensitiveData scrubs tokens, keys, and credentials", () => {
  const payload = {
    authHeader: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.signature",
    geminiKey: "AIzaSyD-TEST-KEY-12345678901234567890",
    supabaseKey: "sbp_9876543210abcdefghijklmnop",
    secret: "super-secret-password-val",
    publicNote: "Normal note description"
  };
  const scrubbed = redactSensitiveData(payload);
  assert.ok(scrubbed.authHeader.includes("[REDACTED_TOKEN]"));
  assert.ok(!scrubbed.geminiKey.includes("AIzaSyD"));
  assert.ok(scrubbed.geminiKey.includes("[REDACTED_GEMINI_KEY]"));
  assert.strictEqual(scrubbed.secret, "[REDACTED]");
  assert.strictEqual(scrubbed.publicNote, "Normal note description");
});

// --- Suite 2: Incident Lifecycle & Verification ---
console.log("\n--- Suite 2: Incident Engine Lifecycle, Risk Gating & Deterministic Verification ---");

await test("6. Fresh engine records incident with DETECTED state", () => {
  const engine = new AutonomousEngine();
  const inc = engine.recordIncident({
    category: "security_xss",
    severity: "high",
    riskLevel: "low_auto",
    status: "DETECTED",
    title: "Test XSS Anomaly",
    summary: "Suspicious script payload detected",
    diagnosticEvidence: { vector: "script" }
  });

  assert.strictEqual(inc.status, "DETECTED");
  assert.strictEqual(inc.auditLog.length, 1);
  assert.strictEqual(inc.auditLog[0].stage, "DETECTED");
});

await test("7. scanSecurityAndXss detects malicious note and plans repair", async () => {
  const engine = new AutonomousEngine();
  const dirtyNotes = [
    { id: "note-safe-1", title: "Safe Note", content: "Safe educational content with $E=mc^2$." },
    { id: "note-vuln-2", title: "Vulnerable Note", content: "Notes <script>alert(1)</script> details" }
  ];

  const found = await engine.scanSecurityAndXss(dirtyNotes);
  assert.strictEqual(found.length, 1);
  assert.strictEqual(found[0].diagnosticEvidence.noteId, "note-vuln-2");
  assert.strictEqual(found[0].status, "DETECTED");
  assert.ok(found[0].repairPlan?.actions.length! > 0);
});

await test("8. executeRepair performs sanitization, updates note, and verifies with deterministic test", async () => {
  const engine = new AutonomousEngine();
  const dirtyNotes = [
    { id: "note-vuln-3", title: "Vulnerable Note", content: 'Notes <a href="javascript:attack()">link</a>' }
  ];

  const [inc] = await engine.scanSecurityAndXss(dirtyNotes);
  assert.ok(inc);

  let updatedNotesList: any[] = [];
  const repairResult = await engine.executeRepair(
    inc.id,
    { email: "admin@notsopedia.com", id: "admin-1" },
    {
      notes: dirtyNotes,
      updateNotes: (n) => {
        updatedNotesList = n;
      }
    }
  );

  assert.strictEqual(repairResult.verified, true);
  assert.strictEqual(repairResult.incident.status, "VERIFIED");
  assert.strictEqual(repairResult.incident.repairResult?.success, true);
  assert.ok(!dirtyNotes[0].content.includes("javascript:"));
  assert.ok(dirtyNotes[0].content.includes("#sanitized-javascript-vector"));
  assert.strictEqual(updatedNotesList.length, 1);
});

await test("9. High-risk incident stops at AWAITING_APPROVAL without execution", async () => {
  const engine = new AutonomousEngine();
  const highRiskInc = engine.recordIncident({
    category: "data_integrity",
    severity: "critical",
    riskLevel: "high_approval_required",
    status: "DETECTED",
    title: "Database Table Re-indexing",
    summary: "Requires destructive operation",
    diagnosticEvidence: { table: "notes" }
  });

  const res = await engine.executeRepair(highRiskInc.id, { email: "admin@test.com" });
  assert.strictEqual(res.verified, false);
  assert.strictEqual(res.incident.status, "AWAITING_APPROVAL");
  assert.ok(res.error?.includes("requires administrator approval"));
});

await test("10. approveIncident authorizes high-risk repair and advances to REPAIR_PLANNED", () => {
  const engine = new AutonomousEngine();
  const highRiskInc = engine.recordIncident({
    category: "data_integrity",
    severity: "critical",
    riskLevel: "high_approval_required",
    status: "AWAITING_APPROVAL",
    title: "Migration Fix",
    summary: "Requires manual gate",
    diagnosticEvidence: {}
  });

  const approved = engine.approveIncident(highRiskInc.id, { email: "lead-admin@notsopedia.com" });
  assert.strictEqual(approved.status, "REPAIR_PLANNED");
  assert.strictEqual(approved.approvedBy, "lead-admin@notsopedia.com");
  assert.ok(approved.approvalTimestamp);
});

// --- Suite 3: End-to-End HTTP Endpoints & Security Boundaries ---
console.log("\n--- Suite 3: End-to-End HTTP Endpoints & RBAC Security Boundaries ---");

await test("11. POST /api/admin/autonomous/telemetry ingests client exception without authentication", async () => {
  const res = await requestApp("POST", "/api/admin/autonomous/telemetry", {
    message: "TypeError: Cannot read property of undefined in NoteCard",
    stack: "Error: at NoteCard.tsx:42:15",
    component: "NoteCard",
    url: "/notes/123"
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.incidentId.startsWith("inc-"));
});

await test("12. Unauthenticated GET /api/admin/autonomous/status is rejected with HTTP 401", async () => {
  const res = await requestApp("GET", "/api/admin/autonomous/status");
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error, "Authentication is required.");
});

await test("13. Non-admin student GET /api/admin/autonomous/status is rejected with HTTP 403", async () => {
  const res = await requestApp("GET", "/api/admin/autonomous/status", undefined, {
    Authorization: "Bearer student-jwt-token"
  });
  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error, "Administrator privileges are required.");
});

await test("14. Administrator GET /api/admin/autonomous/status returns incidents and summary", async () => {
  const res = await requestApp("GET", "/api/admin/autonomous/status", undefined, {
    Authorization: "Bearer admin-jwt-token"
  });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.summary);
  assert.ok(Array.isArray(res.body.incidents));
  assert.ok(Array.isArray(res.body.logs));
});

await test("15. Administrator POST /api/admin/autonomous/scan initiates multi-domain scan", async () => {
  const res = await requestApp("POST", "/api/admin/autonomous/scan", {}, {
    Authorization: "Bearer admin-jwt-token"
  });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.summary);
  assert.ok(Array.isArray(res.body.incidents));
  assert.ok(res.body.timestamp);
});

await test("16. Administrator POST /api/admin/autonomous/repair executes low-risk repairs", async () => {
  // Pre-seed an incident
  const inc = globalAutonomousEngine.recordIncident({
    category: "security_xss",
    severity: "high",
    riskLevel: "low_auto",
    status: "DETECTED",
    title: "Seeded Test XSS Incident",
    summary: "Automated scan finding",
    diagnosticEvidence: {}
  });

  const res = await requestApp("POST", "/api/admin/autonomous/repair", { incidentId: inc.id }, {
    Authorization: "Bearer admin-jwt-token"
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.incident.status, "VERIFIED");
});

await test("17. Administrator GET /api/admin/autonomous/deployment-status returns git & health status", async () => {
  const res = await requestApp("GET", "/api/admin/autonomous/deployment-status", undefined, {
    Authorization: "Bearer admin-jwt-token"
  });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.localCommit);
  assert.ok(typeof res.body.inSync === "boolean");
  assert.ok(res.body.productionHealth);
  assert.ok(["DEPLOYMENT_VERIFIED", "NOT_VERIFIED", "DIVERGED"].includes(res.body.deploymentStatus));
});

await test("18. Administrator POST /api/admin/autonomous/daily-maintenance runs complete maintenance cycle", async () => {
  const res = await requestApp("POST", "/api/admin/autonomous/daily-maintenance", {}, {
    Authorization: "Bearer admin-jwt-token"
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.summary);
  assert.ok(res.body.timestamp);
});

// Teardown
testServer.close();
mockSupabaseServer.close();

console.log("\n══════════════════════════════════════════════════════════════");
console.log(`  AUTONOMOUS HEALING SUITE COMPLETE: ${passed} passed, ${failed} failed`);
console.log("══════════════════════════════════════════════════════════════\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
