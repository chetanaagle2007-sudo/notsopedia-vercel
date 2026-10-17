process.env.VERCEL = "1"; // Prevent auto-binding port 3000

import assert from "assert";
import http from "http";
import app, {
  parseQuizJson,
  sanitizeAndValidateQuiz
} from "../server";
import { QuizQuestion } from "../src/types";

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

console.log("\n──────────────────────────────────────────────────────────────");
console.log("NOTSEPEDIA PHASE 3 – INTERACTIVE QUIZ ENGINE TESTS");
console.log("──────────────────────────────────────────────────────────────");

async function runAllTests() {
  // =========================================================================
  // SUITE 1: JSON Parsing & Fallback Extraction
  // =========================================================================
  console.log("\n--- Suite 1: Quiz Parsing & Resilient Extraction ---");

  await test("1. Parses standard clean JSON array of quiz questions", () => {
    const raw = JSON.stringify([
      {
        question: "What is BFS used for in unweighted graphs?",
        options: ["Shortest path", "Cycle finding only", "Maximum flow", "Sorting"],
        correctIndex: 0,
        explanation: "BFS explores level-by-level to determine shortest path.",
        difficulty: "easy"
      }
    ]);
    const parsed = parseQuizJson(raw);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].question, "What is BFS used for in unweighted graphs?");
    assert.strictEqual(parsed[0].correctIndex, 0);
  });

  await test("2. Strips markdown ```json ... ``` code fences automatically", () => {
    const raw = "```json\n[\n  {\"question\": \"What is GDP?\", \"options\": [\"Gross Domestic Product\", \"General Data Protocol\"], \"correctIndex\": 0}\n]\n```";
    const parsed = parseQuizJson(raw);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].question, "What is GDP?");
  });

  await test("3. Extracts JSON array surrounded by AI conversational text", () => {
    const raw = "Here are practice questions:\n\n[\n  {\"question\": \"What is Planck's constant?\", \"options\": [\"6.626e-34\", \"3e8\"], \"correctIndex\": 0}\n]\n\nBest of luck!";
    const parsed = parseQuizJson(raw);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].question, "What is Planck's constant?");
  });

  await test("4. Throws descriptive error on malformed non-JSON response", () => {
    assert.throws(() => {
      parseQuizJson("I cannot generate a quiz from this note.");
    }, /Failed to parse quiz JSON from AI response/);
  });

  // =========================================================================
  // SUITE 2: Sanitization, Validation & Deduplication
  // =========================================================================
  console.log("\n--- Suite 2: Sanitization & Deduplication ---");

  await test("5. Deduplicates identical questions", () => {
    const input = [
      { question: "What is BFS?", options: ["A", "B"], correctIndex: 0 },
      { question: "what is bfs?", options: ["C", "D"], correctIndex: 1 },
      { question: "What is DFS?", options: ["X", "Y"], correctIndex: 0 }
    ];
    const sanitized = sanitizeAndValidateQuiz(input);
    assert.strictEqual(sanitized.length, 2);
    assert.strictEqual(sanitized[0].question, "What is BFS?");
    assert.strictEqual(sanitized[1].question, "What is DFS?");
  });

  await test("6. Rejects questions with fewer than 2 valid options", () => {
    const input = [
      { question: "What is 2+2?", options: ["4"], correctIndex: 0 },
      { question: "What is 3+3?", options: ["6", "5"], correctIndex: 0 }
    ];
    const sanitized = sanitizeAndValidateQuiz(input);
    assert.strictEqual(sanitized.length, 1);
    assert.strictEqual(sanitized[0].question, "What is 3+3?");
  });

  await test("7. Clamps invalid or out-of-bounds correctIndex safely to 0", () => {
    const input = [
      { question: "What is the speed of light?", options: ["3e8 m/s", "100 m/s"], correctIndex: 99 }
    ];
    const sanitized = sanitizeAndValidateQuiz(input);
    assert.strictEqual(sanitized.length, 1);
    assert.strictEqual(sanitized[0].correctIndex, 0);
  });

  await test("8. Normalizes difficulty and ensures unique question IDs", () => {
    const input = [
      { question: "Define Ohm's law", options: ["V=IR", "F=ma"], correctIndex: 0, difficulty: "hard" },
      { question: "Define Newton's 2nd law", options: ["F=ma", "E=mc^2"], correctIndex: 0, difficulty: "invalid" }
    ];
    const sanitized = sanitizeAndValidateQuiz(input, "medium");
    assert.strictEqual(sanitized.length, 2);
    assert.strictEqual(sanitized[0].difficulty, "hard");
    assert.strictEqual(sanitized[1].difficulty, "medium");
    assert(sanitized[0].id.startsWith("quiz-q-"));
    assert.notStrictEqual(sanitized[0].id, sanitized[1].id);
  });

  // =========================================================================
  // SUITE 3: HTTP Endpoint & Security
  // =========================================================================
  console.log("\n--- Suite 3: HTTP Endpoint & Security ---");

  await test("9. Unauthenticated request to /api/notes/:id/quiz is rejected with 401", async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/notes/univ-note-1/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert(json.error.includes("Authentication is required"));
    } finally {
      server.close();
    }
  });

  await test("10. Non-Bearer authorization header is rejected with 401", async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/notes/univ-note-1/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic dXNlcjpwYXNz"
        }
      });
      assert.strictEqual(res.status, 401);
    } finally {
      server.close();
    }
  });

  await test("11. Invalid/expired Bearer token is rejected with 401", async () => {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/notes/univ-note-1/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer invalid-or-expired-token-xyz"
        }
      });
      assert.strictEqual(res.status, 401);
    } finally {
      server.close();
    }
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  QUIZ SUITE COMPLETE: ${passed} passed, ${failed} failed`);
  console.log("══════════════════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runAllTests().catch((err) => {
  console.error("Quiz test runner failure:", err);
  process.exit(1);
});
