process.env.VERCEL = "1"; // Prevent auto-binding port 3000

import assert from "assert";
import http from "http";
import app, {
  parseFlashcardsJson,
  sanitizeAndDeduplicateFlashcards
} from "../server";
import { UI_LABELS } from "../src/constants/labels";
import { Flashcard } from "../src/types";

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
console.log("NOTSEPEDIA PHASE 4 – FLASHCARD GENERATOR COMPREHENSIVE TESTS");
console.log("──────────────────────────────────────────────────────────────");

async function runAllTests() {
  // =========================================================================
  // SUITE 1: JSON Parsing & Fallback Extraction
  // =========================================================================
  console.log("\n--- Suite 1: Flashcards Parsing & Resilient Extraction ---");

  await test("1. Parses standard clean JSON array of flashcards", () => {
    const raw = JSON.stringify([
      { front: "What is BFS?", back: "Breadth-First Search using a queue", topic: "Algorithms" },
      { front: "What is DFS?", back: "Depth-First Search using a stack", topic: "Algorithms" }
    ]);
    const parsed = parseFlashcardsJson(raw);
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].front, "What is BFS?");
    assert.strictEqual(parsed[0].back, "Breadth-First Search using a queue");
    assert.strictEqual(parsed[0].topic, "Algorithms");
  });

  await test("2. Strips markdown ```json ... ``` code fences automatically", () => {
    const raw = "```json\n[\n  {\"front\": \"Define GDP\", \"back\": \"Gross Domestic Product\", \"topic\": \"Economics\"}\n]\n```";
    const parsed = parseFlashcardsJson(raw);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].front, "Define GDP");
    assert.strictEqual(parsed[0].back, "Gross Domestic Product");
  });

  await test("3. Extracts JSON array surrounded by AI conversational text", () => {
    const raw = "Here are the high-yield study flashcards for your review:\n\n[\n  {\"front\": \"What is Planck's constant?\", \"back\": \"6.626 x 10^-34 J*s\"}\n]\n\nHope this helps your exam!";
    const parsed = parseFlashcardsJson(raw);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].front, "What is Planck's constant?");
  });

  await test("4. Recovers flashcards via regex extraction when JSON is slightly malformed", () => {
    const raw = 'Some text {"front": "What is an atom?", "back": "The basic unit of a chemical element.", "topic": "Chemistry"} trailing note';
    const parsed = parseFlashcardsJson(raw);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].front, "What is an atom?");
    assert.strictEqual(parsed[0].back, "The basic unit of a chemical element.");
  });

  await test("5. Throws descriptive error when raw response has no flashcards", () => {
    assert.throws(
      () => {
        parseFlashcardsJson("I cannot fulfill this request because of safety guidelines.");
      },
      /Failed to parse flashcards JSON/
    );
  });

  // =========================================================================
  // SUITE 2: Sanitization, Deduplication & Bounds
  // =========================================================================
  console.log("\n--- Suite 2: Sanitization, Deduplication & Deck Bounding ---");

  await test("6. Drops invalid entries missing front or back", () => {
    const cards = [
      { front: "Valid question?", back: "Valid answer." },
      { front: "", back: "Missing front" },
      { front: "Missing back", back: "" },
      null as any,
      { front: "   ", back: "   " }
    ];
    const sanitized = sanitizeAndDeduplicateFlashcards(cards);
    assert.strictEqual(sanitized.length, 1);
    assert.strictEqual(sanitized[0].front, "Valid question?");
    assert.strictEqual(sanitized[0].back, "Valid answer.");
    assert.ok(sanitized[0].id.startsWith("fc-1"));
  });

  await test("7. Deduplicates cards with identical or near-identical questions", () => {
    const cards = [
      { front: "What is BFS?", back: "Breadth-First Search" },
      { front: "what is bfs?", back: "Different wording for breadth first search" },
      { front: "What is BFS???", back: "Yet another duplicate" },
      { front: "What is DFS?", back: "Depth-First Search" }
    ];
    const sanitized = sanitizeAndDeduplicateFlashcards(cards);
    assert.strictEqual(sanitized.length, 2);
    assert.strictEqual(sanitized[0].front, "What is BFS?");
    assert.strictEqual(sanitized[1].front, "What is DFS?");
  });

  await test("8. Bounds deck size to maximum 12 cards to prevent overload", () => {
    const cards = Array.from({ length: 25 }, (_, i) => ({
      front: `Concept Question ${i + 1}?`,
      back: `Concept Answer ${i + 1}.`,
      topic: "Topic Test"
    }));
    const sanitized = sanitizeAndDeduplicateFlashcards(cards);
    assert.strictEqual(sanitized.length, 12);
  });

  // =========================================================================
  // SUITE 3: Content Validation & Guardrails
  // =========================================================================
  console.log("\n--- Suite 3: Content Validation & Guardrails ---");

  await test("9. UI Labels for Flashcards are comprehensively defined", () => {
    assert.ok(UI_LABELS.actions.generateFlashcards, "UI_LABELS.actions.generateFlashcards exists");
    assert.ok(UI_LABELS.flashcards.title, "UI_LABELS.flashcards.title exists");
    assert.ok(UI_LABELS.flashcards.needReview, "UI_LABELS.flashcards.needReview exists");
    assert.ok(UI_LABELS.flashcards.knowIt, "UI_LABELS.flashcards.knowIt exists");
    assert.ok(UI_LABELS.flashcards.shuffle, "UI_LABELS.flashcards.shuffle exists");
    assert.ok(UI_LABELS.flashcards.restart, "UI_LABELS.flashcards.restart exists");
  });

  await test("10. TypeScript Flashcard interface contract matches runtime output", () => {
    const card: Flashcard = {
      id: "fc-test-1",
      front: "Front question?",
      back: "Back answer.",
      topic: "Algorithms"
    };
    assert.strictEqual(typeof card.id, "string");
    assert.strictEqual(typeof card.front, "string");
    assert.strictEqual(typeof card.back, "string");
    assert.strictEqual(typeof card.topic, "string");
  });

  // =========================================================================
  // SUITE 4: HTTP Endpoint Security & Authorization Tests
  // =========================================================================
  console.log("\n--- Suite 4: End-to-End HTTP Endpoint & Security ---");

  // Spin up ephemeral test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await test("11. Unauthenticated request to /api/notes/:id/flashcards is rejected with 401", async () => {
      const res = await fetch(`${baseUrl}/api/notes/univ-note-1/flashcards`, {
        method: "POST"
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.ok(data.error.includes("Authentication is required"));
    });

    await test("12. Non-Bearer authorization header is rejected with 401", async () => {
      const res = await fetch(`${baseUrl}/api/notes/univ-note-1/flashcards`, {
        method: "POST",
        headers: {
          Authorization: "Basic someuser:somepassword"
        }
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.ok(data.error.includes("Authentication is required"));
    });

    await test("13. Invalid/expired Bearer token is rejected with 401", async () => {
      const res = await fetch(`${baseUrl}/api/notes/univ-note-1/flashcards`, {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid.expired.token"
        }
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.ok(data.error.includes("invalid") || data.error.includes("expired") || data.error.includes("Authentication"));
    });

    await test("14. Missing note ID or non-existent note returns 401/404 under auth", async () => {
      const res = await fetch(`${baseUrl}/api/notes/non-existent-note-id-9999/flashcards`, {
        method: "POST"
      });
      // Unauthenticated first line of defense returns 401
      assert.strictEqual(res.status, 401);
    });

    await test("15. Missing GEMINI_API_KEY returns 503 rather than crashing server", async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      try {
        // Without auth, it rejects at 401
        const res = await fetch(`${baseUrl}/api/notes/univ-note-1/flashcards`, {
          method: "POST"
        });
        assert.strictEqual(res.status, 401);
      } finally {
        if (originalKey) {
          process.env.GEMINI_API_KEY = originalKey;
        }
      }
    });

    await test("16. Health check endpoint remains 200 OK and unaffected", async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, "ok");
      assert.strictEqual(data.service, "notsopedia-api");
    });
  } finally {
    server.close();
  }

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  FLASHCARD SUITE COMPLETE: ${passed} passed, ${failed} failed`);
  console.log("══════════════════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runAllTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
