/**
 * Notsopedia AI Workspace Integration Tests
 *
 * Verifies secure gateway endpoints to MIND-AI:
 * 1. POST /api/mind-ai/universal-task unauthenticated -> 401
 * 2. POST /api/mind-ai/universal-task invalid/empty goal -> 400
 * 3. POST /api/mind-ai/universal-task valid request -> forwards with X-MIND-AI-Service-Key,
 *    derives owner_id from Supabase user session, isolates service secret.
 * 4. Attached notes retrieval under student RLS is included in parameters.
 * 5. GET /api/mind-ai/tasks unauthenticated -> 401
 * 6. GET /api/mind-ai/tasks authenticated -> fetches student's tasks by owner_id
 * 7. GET /api/mind-ai/tasks/:id authorized vs unauthorized ownership checks
 * 8. GET /api/mind-ai/artifacts/:type/:id/download proxies artifact correctly
 * 9. Upstream MIND-AI 403/401 returns 502 Bad Gateway
 *
 * Run: npx tsx tests/ai-workspace.test.ts
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
// Spin up Mock Supabase Service
// ────────────────────────────────────────────────────────────────────────────

const mockSupabaseServer = http.createServer((req, res) => {
  const url = req.url || "";
  const authHeader = req.headers["authorization"] || "";

  if (!authHeader.startsWith("Bearer valid-student-token") && !authHeader.startsWith("Bearer other-student-token")) {
    res.writeHead(401, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Invalid token" }));
  }

  const isOther = authHeader.includes("other-student-token");

  // Auth endpoint: /auth/v1/user
  if (url.startsWith("/auth/v1/user")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        id: isOther ? "usr-other-99" : "usr-student-42",
        email: isOther ? "other@university.edu" : "student42@university.edu",
        user_metadata: {
          role: "Student",
          institution: "Engineering College"
        }
      })
    );
  }

  // Notes endpoint: /rest/v1/notes
  if (url.startsWith("/rest/v1/notes")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify([
        {
          id: "note-quantum-1",
          title: "Quantum Mechanics Fundamentals",
          content: "Wavefunction psi collapse and Schrodinger equation principles.",
          subject_name: "Physics",
          uploader_email: "prof@university.edu"
        }
      ])
    );
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

// ────────────────────────────────────────────────────────────────────────────
// Spin up Mock MIND-AI Service
// ────────────────────────────────────────────────────────────────────────────

const TEST_MIND_AI_KEY = "mind-ai-secret-key-phase-g";
let lastMindAiUrl: string | null = null;
let lastMindAiPayload: any = null;
let lastMindAiHeaders: http.IncomingHttpHeaders | null = null;
let mockMindAiStatusCode = 200;

const mockMindAiServer = http.createServer((req, res) => {
  let rawBody = "";
  req.on("data", (chunk) => {
    rawBody += chunk;
  });
  req.on("end", () => {
    lastMindAiUrl = req.url || null;
    try {
      lastMindAiPayload = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      lastMindAiPayload = rawBody;
    }
    lastMindAiHeaders = req.headers;

    const incomingKey = req.headers["x-mind-ai-service-key"];
    if (incomingKey !== TEST_MIND_AI_KEY) {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ detail: "Forbidden: Invalid service key" }));
    }

    if (mockMindAiStatusCode !== 200) {
      res.writeHead(mockMindAiStatusCode, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ detail: "Upstream error" }));
    }

    // Handle universal task submission
    if (req.url === "/tasks/universal" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          task_id: "task-univ-12345",
          owner_id: lastMindAiPayload?.owner_id || "unknown",
          category: lastMindAiPayload?.category || "presentation",
          status: "completed",
          progress: 100,
          artifacts: ["artifacts/presentations/quantum_mechanics.pptx"],
          final_response: "Generated 5 slide presentation deck.",
          message: "Task completed successfully."
        })
      );
    }

    // Handle get student's tasks
    if (req.url?.startsWith("/tasks?owner_id=") && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          count: 1,
          tasks: [
            {
              task_id: "task-univ-12345",
              owner_id: "usr-student-42",
              category: "presentation",
              status: "completed",
              goal: "Build quantum slides",
              artifacts: ["artifacts/presentations/quantum_mechanics.pptx"]
            }
          ]
        })
      );
    }

    // Handle get specific task details
    if (req.url === "/tasks/task-univ-12345" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          task_id: "task-univ-12345",
          owner_id: "usr-student-42",
          category: "presentation",
          status: "completed",
          progress: 100,
          artifacts: ["artifacts/presentations/quantum_mechanics.pptx"]
        })
      );
    }

    // Handle artifact download proxy
    if (req.url === "/presentations/quantum_mechanics/download" && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": 'attachment; filename="quantum_mechanics.pptx"'
      });
      return res.end(Buffer.from("PK-MOCK-PPTX-BYTES-CONTENT"));
    }

    // Handle email endpoints
    if (req.url === "/email/generate-subject" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ subject: "Formal Notice: Request for Assignment Extension", tone: "formal" }));
    }
    if (req.url === "/email/generate-body" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ body: "Dear Professor,\n\nI am writing to formally request an extension.", tone: "formal" }));
    }
    if (req.url === "/email/draft" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        draft_id: "emldraft_abc123",
        recipient: lastMindAiPayload?.recipient,
        subject: lastMindAiPayload?.subject,
        body: lastMindAiPayload?.body,
        status: "awaiting_approval",
        approval_hash: null,
      }));
    }
    if (req.url === "/email/draft/emldraft_abc123/approve" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        draft_id: "emldraft_abc123",
        status: "approved",
        approval_hash: "hash-456",
      }));
    }
    if (req.url === "/email/draft/emldraft_abc123/send" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        draft_id: "emldraft_abc123",
        status: "submitted",
        provider_message_id: "msg-789",
      }));
    }
    if (req.url?.startsWith("/email/draft/emldraft_abc123") && req.method === "GET") {

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        draft_id: "emldraft_abc123",
        recipient: "prof@university.edu",
        subject: "Extension",
        body: "Hello",
        status: "approved",
        approval_hash: "hash-456",
        cc: [],
        bcc: []
      }));
    }
    if (req.url === "/email/status" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        status: "disconnected",
        token_configured: false,
        confirmation_required: true
      }));
    }


    // Handle presentation endpoints
    if (req.url === "/presentations/outline" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        slides: [{ title: "Introduction" }, { title: "Core Concepts" }],
        total_slides: 2,
      }));
    }

    // Handle project endpoints
    if (req.url === "/projects/plan" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        project_id: "proj_999",
        name: lastMindAiPayload?.name,
        files: [{ path: "main.py" }],
      }));
    }
    if (req.url === "/projects/proj_999/test" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        project_id: "proj_999",
        test_results: { passed: true, executed: 2 },
      }));
    }

    // Handle connectors & workflows
    if (req.url === "/connectors" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        connectors: [{ provider: "google_workspace", operations_count: 3 }],
      }));
    }
    if (req.url === "/workflows/run" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        workflow_id: "wf-111",
        name: lastMindAiPayload?.name,
        status: "awaiting_approval",
        current_step_index: 0,
      }));
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ detail: "Not found" }));
  });
});

let mindAiPort = 0;
await new Promise<void>((resolve) => {
  mockMindAiServer.listen(0, "127.0.0.1", () => {
    mindAiPort = (mockMindAiServer.address() as any).port;
    resolve();
  });
});

// Configure process environment
process.env.VERCEL = "1";
process.env.SUPABASE_URL = `http://127.0.0.1:${supabasePort}`;
process.env.SUPABASE_PUBLISHABLE_KEY = "mock-sb-key";
process.env.MIND_AI_SERVICE_URL = `http://127.0.0.1:${mindAiPort}`;
process.env.MIND_AI_SERVICE_KEY = TEST_MIND_AI_KEY;

// Import server under test
const { default: app } = await import("../server.ts");

const appServer = http.createServer(app);
let appPort = 0;
await new Promise<void>((resolve) => {
  appServer.listen(0, "127.0.0.1", () => {
    appPort = (appServer.address() as any).port;
    resolve();
  });
});

async function requestApp(
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      `http://127.0.0.1:${appPort}${path}`,
      {
        method,
        headers: {
          ...(postData ? { "Content-Type": "application/json" } : {}),
          ...(headers || {})
        }
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => {
          raw += c;
        });
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
    if (postData) req.write(postData);
    req.end();
  });
}

// ────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ────────────────────────────────────────────────────────────────────────────

console.log("\n🧪 Running Notsopedia AI Workspace Integration Tests...\n");

await test("1. Unauthenticated POST /api/mind-ai/universal-task is rejected with 401", async () => {
  const res = await requestApp("POST", "/api/mind-ai/universal-task", {
    goal: "Create a presentation on thermodynamics"
  });
  assert.strictEqual(res.status, 401);
  assert.ok(res.body.error);
});

await test("2. Missing or empty goal is rejected with 400", async () => {
  const res = await requestApp(
    "POST",
    "/api/mind-ai/universal-task",
    { goal: "   " },
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(res.status, 400);
  assert.ok(res.body.error.includes("goal"));
});

await test("3. Authenticated task request is forwarded to MIND-AI with student identity and service key", async () => {
  lastMindAiPayload = null;
  lastMindAiHeaders = null;

  const res = await requestApp(
    "POST",
    "/api/mind-ai/universal-task",
    {
      goal: "Generate a 5-slide deck on Quantum Wavefunctions",
      category: "presentation",
      parameters: { theme: "academic_modern" },
      noteIds: ["note-quantum-1"]
    },
    { Authorization: "Bearer valid-student-token" }
  );

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.task_id, "task-univ-12345");
  assert.strictEqual(res.body.status, "completed");

  // Verify server-to-server security invariants
  assert.strictEqual(lastMindAiHeaders?.["x-mind-ai-service-key"], TEST_MIND_AI_KEY);
  assert.strictEqual(lastMindAiPayload?.owner_id, "usr-student-42");
  assert.strictEqual(lastMindAiPayload?.category, "presentation");

  // Verify attached note context was fetched and included
  assert.ok(lastMindAiPayload?.parameters?.attached_notes?.includes("Quantum Mechanics Fundamentals"));

  // Verify service secret is never leaked to browser client
  const serialized = JSON.stringify(res.body);
  assert.ok(!serialized.includes(TEST_MIND_AI_KEY));
});

await test("4. Unauthenticated GET /api/mind-ai/tasks is rejected with 401", async () => {
  const res = await requestApp("GET", "/api/mind-ai/tasks");
  assert.strictEqual(res.status, 401);
});

await test("5. Authenticated GET /api/mind-ai/tasks returns student task history", async () => {
  const res = await requestApp("GET", "/api/mind-ai/tasks", undefined, {
    Authorization: "Bearer valid-student-token"
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.count, 1);
  assert.strictEqual(res.body.tasks[0].task_id, "task-univ-12345");
  assert.strictEqual(lastMindAiUrl, "/tasks?owner_id=usr-student-42");
});

await test("6. GET /api/mind-ai/tasks/:id returns task when student is the owner", async () => {
  const res = await requestApp("GET", "/api/mind-ai/tasks/task-univ-12345", undefined, {
    Authorization: "Bearer valid-student-token"
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.task_id, "task-univ-12345");
  assert.strictEqual(res.body.owner_id, "usr-student-42");
});

await test("7. GET /api/mind-ai/tasks/:id rejects unauthorized access by different user (403)", async () => {
  const res = await requestApp("GET", "/api/mind-ai/tasks/task-univ-12345", undefined, {
    Authorization: "Bearer other-student-token"
  });
  assert.strictEqual(res.status, 403);
  assert.ok(res.body.error.includes("not authorized"));
});

await test("8. GET /api/mind-ai/artifacts/:type/:id/download proxies artifact stream", async () => {
  const res = await requestApp(
    "GET",
    "/api/mind-ai/artifacts/presentation/quantum_mechanics/download",
    undefined,
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(res.status, 200);
  assert.ok(res.headers["content-type"]?.includes("presentationml"));
  assert.strictEqual(res.body, "PK-MOCK-PPTX-BYTES-CONTENT");
});

await test("9. Upstream service authentication rejection yields 502 Bad Gateway", async () => {
  // Simulate MIND-AI rejecting service key
  mockMindAiStatusCode = 403;

  const res = await requestApp(
    "POST",
    "/api/mind-ai/universal-task",
    { goal: "Attempt with upstream key rejection" },
    { Authorization: "Bearer valid-student-token" }
  );

  assert.strictEqual(res.status, 502);
  assert.ok(res.body.error.includes("authentication failed"));

  mockMindAiStatusCode = 200;
});

await test("10. POST /api/mind-ai/email/generate-subject & body independently generate content", async () => {
  const subjRes = await requestApp(
    "POST",
    "/api/mind-ai/email/generate-subject",
    { prompt: "Request extension on final project", tone: "formal" },
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(subjRes.status, 200);
  assert.ok(subjRes.body.subject.includes("Formal Notice"));

  const bodyRes = await requestApp(
    "POST",
    "/api/mind-ai/email/generate-body",
    { prompt: "I need 2 more days", tone: "formal" },
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(bodyRes.status, 200);
  assert.ok(bodyRes.body.body.includes("Dear Professor"));
});

await test("11. Email draft lifecycle: draft -> approve -> send with student identity", async () => {
  const draftRes = await requestApp(
    "POST",
    "/api/mind-ai/email/draft",
    { recipient: "prof@university.edu", subject: "Extension", body: "Hello" },
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(draftRes.status, 200);
  assert.strictEqual(draftRes.body.draft_id, "emldraft_abc123");

  const approveRes = await requestApp(
    "POST",
    "/api/mind-ai/email/draft/emldraft_abc123/approve",
    {},
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(approveRes.status, 200);
  assert.strictEqual(approveRes.body.status, "approved");

  const sendRes = await requestApp(
    "POST",
    "/api/mind-ai/email/draft/emldraft_abc123/send",
    { idempotency_key: "idem-key-1" },
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(sendRes.status, 200);
  assert.strictEqual(sendRes.body.status, "submitted");
});

await test("12. Presentation and Project routes forward securely", async () => {
  const presRes = await requestApp(
    "POST",
    "/api/mind-ai/presentations/outline",
    { topic: "Quantum Mechanics", slide_count: 5 },
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(presRes.status, 200);
  assert.strictEqual(presRes.body.total_slides, 2);

  const projRes = await requestApp(
    "POST",
    "/api/mind-ai/projects/plan",
    { name: "FastAPI Project", project_type: "fastapi_service" },
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(projRes.status, 200);
  assert.strictEqual(projRes.body.project_id, "proj_999");
});

await test("13. Connectors & Workflows routes forward with authentication", async () => {
  const connRes = await requestApp(
    "GET",
    "/api/mind-ai/connectors",
    undefined,
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(connRes.status, 200);
  assert.strictEqual(connRes.body.connectors[0].provider, "google_workspace");

  const wfRes = await requestApp(
    "POST",
    "/api/mind-ai/workflows/run",
    { name: "Multi-step Pipeline", steps: [{ name: "Step 1", action_type: "notify" }] },
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(wfRes.status, 200);
  assert.strictEqual(wfRes.body.workflow_id, "wf-111");
});

await test("14. GET /api/mind-ai/email/draft/:id returns draft details with student isolation", async () => {

  const getDraftRes = await requestApp(
    "GET",
    "/api/mind-ai/email/draft/emldraft_abc123",
    undefined,
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(getDraftRes.status, 200);
  assert.strictEqual(getDraftRes.body.draft_id, "emldraft_abc123");
  assert.strictEqual(getDraftRes.body.recipient, "prof@university.edu");
});

await test("15. GET /api/mind-ai/email/status returns configuration transparency without credentials", async () => {
  const statusRes = await requestApp(
    "GET",
    "/api/mind-ai/email/status",
    undefined,
    { Authorization: "Bearer valid-student-token" }
  );
  assert.strictEqual(statusRes.status, 200);
  assert.strictEqual(statusRes.body.status, "disconnected");
  assert.strictEqual(statusRes.body.token_configured, false);
});

// Teardown test servers


appServer.close();
mockMindAiServer.close();
mockSupabaseServer.close();

console.log(`\n========================================`);
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
