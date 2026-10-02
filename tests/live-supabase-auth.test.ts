/**
 * Notsopedia — Live Supabase Authorization Verification
 *
 * SAFETY RULES FOLLOWED:
 * - Truly isolated anonymous client (no sessions, no tokens, no signIn)
 * - Negative write tests NEVER touch existing production notes or config
 * - Ephemeral test records created with unique IDs and deleted in finally-cleanup
 * - No service-role key used (publishable key only for anon tests)
 * - Authenticated tests clearly marked and gated on token/credential availability
 * - Safe prerequisites required before testing: SKIP instead of modifying production data
 * - Titles and IDs are tracked in memory; never delete by pattern matching
 * - Admin-created records are strictly cleaned up with verified adminClient only
 * - Normal-user-created records are strictly cleaned up with verified normalClient only
 * - Anonymous storage upload requires verified adminClient for guaranteed immediate cleanup
 *
 * Run: npx tsx tests/live-supabase-auth.test.ts
 *
 * For authenticated tests: set SUPABASE_TEST_NORMAL_TOKEN and/or
 * SUPABASE_TEST_ADMIN_TOKEN (or email/password credentials) in .env.local.
 * DO NOT hardcode tokens or credentials in this file.
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Direct JWT tokens -- backward-compatible DevTools path (still works)
const NORMAL_USER_TOKEN_DIRECT = process.env.SUPABASE_TEST_NORMAL_TOKEN;
const ADMIN_USER_TOKEN_DIRECT  = process.env.SUPABASE_TEST_ADMIN_TOKEN;

// Email + password credentials -- automated path.
// NEVER printed, logged, or written to disk anywhere in this file.
const NORMAL_USER_EMAIL    = process.env.SUPABASE_TEST_NORMAL_EMAIL;
const NORMAL_USER_PASSWORD = process.env.SUPABASE_TEST_NORMAL_PASSWORD;
const ADMIN_USER_EMAIL     = process.env.SUPABASE_TEST_ADMIN_EMAIL;
const ADMIN_USER_PASSWORD  = process.env.SUPABASE_TEST_ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("❌ VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY missing from .env.local");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Clients
// ─────────────────────────────────────────────────────────────────────────────

// Dedicated truly anonymous client — completely unauthenticated, simulating a signed-out visitor.
// NEVER call signInWithPassword() or setSession() on this client!
const anonClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Helper to build a temporary isolated client for credential-based authentication
function createIsolatedAuthClient() {
  return createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// Helper to build an authenticated client from a raw JWT (with session persistence disabled)
function makeAuthClient(token: string) {
  return createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentication helpers
// Credentials and tokens are NEVER logged, stored, or written to any file.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sign in with email + password using an isolated client and return the access token
 * held in memory only.
 * On failure, prints only a sanitized role-level message -- never the password
 * or the resulting token.
 */
async function signInForToken(
  role: "Normal-user" | "Admin",
  email: string,
  password: string
): Promise<string | null> {
  const isolatedClient = createIsolatedAuthClient();
  const { data, error } = await isolatedClient.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    console.error(`  [FAIL] ${role} authentication failed -- check credentials or Supabase Auth status`);
    return null;
  }
  // Token is returned in memory only -- never printed or written to disk.
  return data.session.access_token;
}

// Resolve effective token for the normal test user.
let NORMAL_USER_TOKEN: string | null | undefined = NORMAL_USER_TOKEN_DIRECT;
if (!NORMAL_USER_TOKEN && NORMAL_USER_EMAIL && NORMAL_USER_PASSWORD) {
  NORMAL_USER_TOKEN = await signInForToken("Normal-user", NORMAL_USER_EMAIL, NORMAL_USER_PASSWORD);
}

// Resolve effective token for the admin user.
let ADMIN_USER_TOKEN: string | null | undefined = ADMIN_USER_TOKEN_DIRECT;
if (!ADMIN_USER_TOKEN && ADMIN_USER_EMAIL && ADMIN_USER_PASSWORD) {
  ADMIN_USER_TOKEN = await signInForToken("Admin", ADMIN_USER_EMAIL, ADMIN_USER_PASSWORD);
}

const normalClient = NORMAL_USER_TOKEN ? makeAuthClient(NORMAL_USER_TOKEN) : null;
const adminClient = ADMIN_USER_TOKEN ? makeAuthClient(ADMIN_USER_TOKEN) : null;

// Validate authenticated clients upfront
let verifiedNormalUser: any = null;
if (normalClient) {
  const { data: { user }, error } = await normalClient.auth.getUser();
  if (!error && user) {
    verifiedNormalUser = user;
  }
}

let verifiedAdminUser: any = null;
if (adminClient) {
  const { data: { user }, error } = await adminClient.auth.getUser();
  if (!error && user) {
    const { data: profile } = await adminClient
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.is_admin) {
      verifiedAdminUser = user;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test runner
// ─────────────────────────────────────────────────────────────────────────────

type TestResult = {
  id: string;
  purpose: string;
  method: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL" | "SKIP" | "ERROR";
  note?: string;
};

const results: TestResult[] = [];
let testIdSeq = 0;

async function test(
  purpose: string,
  method: string,
  expected: string,
  fn: () => Promise<{ actual: string; pass: boolean; note?: string }>
): Promise<void> {
  const id = `T${String(++testIdSeq).padStart(2, "0")}`;
  try {
    const { actual, pass, note } = await fn();
    results.push({ id, purpose, method, expected, actual, status: pass ? "PASS" : "FAIL", note });
    const icon = pass ? "✅" : "❌";
    console.log(`  ${icon} [${id}] ${purpose}`);
    if (!pass) {
      console.log(`      expected: ${expected}`);
      console.log(`      actual:   ${actual}`);
    }
    if (note) console.log(`      note: ${note}`);
  } catch (err: any) {
    results.push({ id, purpose, method, expected, actual: `ERROR: ${err.message}`, status: "ERROR" });
    console.log(`  💥 [${id}] ${purpose} — ERROR: ${err.message}`);
  }
}

function skip(purpose: string, method: string, expected: string, note: string) {
  const id = `T${String(++testIdSeq).padStart(2, "0")}`;
  results.push({ id, purpose, method, expected, actual: "SKIPPED", status: "SKIP", note });
  console.log(`  ⏭️  [${id}] ${purpose} — SKIP: ${note}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tracking created test records for guaranteed cleanup
// Admin-created records are cleaned up strictly with verified adminClient only.
// Normal-user-created records are cleaned up strictly with verified normalClient only.
// ─────────────────────────────────────────────────────────────────────────────

const adminCreatedNoteIds: string[] = [];
const adminCreatedConfigIds: string[] = [];
const adminCreatedStoragePaths: string[] = [];

const normalCreatedNoteIds: string[] = [];
const normalCreatedStoragePaths: string[] = [];

async function getAnExistingStorageFile(): Promise<string | null> {
  const { data } = await anonClient.storage.from("Notesopedia").list("", { limit: 1 });
  return data?.[0]?.name ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Test Execution & Protected Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

try {
  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 0 — Read-only: confirm the Supabase project is reachable & data is live
  // ───────────────────────────────────────────────────────────────────────────

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("PHASE 0 — Connectivity & read-only baseline");
  console.log("════════════════════════════════════════════════════════════════");

  await test(
    "Supabase project is reachable (anon SELECT notes)",
    "GET /rest/v1/notes (anonClient.from('notes').select)",
    "HTTP 200, data array returned",
    async () => {
      const { data, error, status } = await anonClient.from("notes").select("id").limit(3);
      const actual = `HTTP ${status}, ${error ? `error: ${error.message}` : `${data?.length ?? 0} rows`}`;
      return { actual, pass: !error && Array.isArray(data) };
    }
  );

  await test(
    "Anonymous user can read public.notes (SELECT allowed by RLS)",
    "anonClient.from('notes').select('*').limit(1)",
    "No error, note data returned",
    async () => {
      const { data, error, status } = await anonClient.from("notes").select("*").limit(1);
      const actual = `HTTP ${status}, ${error ? `error: ${error.message}` : `${data?.length ?? 0} rows, first title: "${data?.[0]?.title?.slice(0, 40) ?? 'n/a'}"`}`;
      return { actual, pass: !error && (data?.length ?? 0) >= 0 };
    }
  );

  await test(
    "Anonymous user can read public.system_config (SELECT allowed by RLS)",
    "anonClient.from('system_config').select('*').eq('id','main')",
    "No error, config returned",
    async () => {
      const { data, error, status } = await anonClient
        .from("system_config").select("*").eq("id", "main").maybeSingle();
      const actual = `HTTP ${status}, ${error ? `error: ${error.message}` : `announcement_active: ${data?.announcement_active}`}`;
      return { actual, pass: !error };
    }
  );

  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 1 — Anonymous negative tests (no auth token → all writes must be blocked)
  // ───────────────────────────────────────────────────────────────────────────

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("PHASE 1 — Anonymous write operations (ALL must be blocked by RLS)");
  console.log("════════════════════════════════════════════════════════════════");

  // Test 1: Anonymous INSERT into notes
  await test(
    "Anonymous user cannot INSERT into public.notes",
    "anonClient.from('notes').insert({...})",
    "RLS error (HTTP 401/403/42501) — no row inserted",
    async () => {
      const anonInsertAttemptId = "rls-anon-insert-attempt-" + Date.now();
      const { data, error, status } = await anonClient.from("notes").insert({
        id: anonInsertAttemptId,
        title: "[RLS TEST] Anonymous insert attempt",
        content: "This should be blocked by RLS",
        subject_name: "Security Test",
        subject_code: "SEC-001",
        uploader_name: "Anonymous Attacker",
        uploader_role: "Attacker",
        likes: 0
      }).select("id");

      if (!error && data?.[0]?.id) {
        adminCreatedNoteIds.push(data[0].id);
      }

      const actual = `HTTP ${status}, ${error ? `blocked: "${error.message}" (code: ${error.code})` : `DANGER: inserted row id=${data?.[0]?.id}`}`;
      return { actual, pass: !!error };
    }
  );

  // Establish isolated temporary note for anonymous UPDATE/DELETE tests.
  // NEVER target an existing production note.
  let anonWriteTestNoteId: string | null = null;
  if (adminClient && verifiedAdminUser) {
    const candidateNoteId = `rls-anon-write-test-${Date.now()}`;
    const { data, error } = await adminClient.from("notes").insert({
      id: candidateNoteId,
      title: `[RLS TEST] temporary anonymous-write-test-${Date.now()}`,
      content: "Temporary note created for anonymous write test isolation",
      subject_name: "Security Test",
      subject_code: "SEC-001",
      uploader_name: "Admin Tester",
      uploader_role: "Administrator",
      owner_id: verifiedAdminUser.id,
      likes: 0
    }).select("id").maybeSingle();

    if (!error && data?.id) {
      anonWriteTestNoteId = data.id;
      adminCreatedNoteIds.push(data.id);
    }
  }

  // Test 2: Anonymous UPDATE notes
  if (!anonWriteTestNoteId) {
    skip(
      "Anonymous user cannot UPDATE public.notes",
      "anonClient.from('notes').update({...}).eq('id', tempNoteId)",
      "RLS error or 0 rows affected — no row updated",
      "Safe temporary test note could not be created (admin credentials required to create isolated test record without touching production data)"
    );
  } else {
    await test(
      "Anonymous user cannot UPDATE public.notes",
      `anonClient.from('notes').update({title:'...'}).eq('id','${anonWriteTestNoteId}')`,
      "RLS error or 0 rows affected — no row updated",
      async () => {
        const { data, error, status } = await anonClient
          .from("notes")
          .update({ title: "[RLS TEST] Anonymous update attempt — should be blocked" })
          .eq("id", anonWriteTestNoteId!)
          .select("id");
        const rowsAffected = data?.length ?? 0;
        const actual = `HTTP ${status}, ${error ? `blocked: "${error.message}"` : `rows returned: ${rowsAffected} (${rowsAffected === 0 ? "no rows updated ✓" : "DANGER: row updated"})`}`;
        const pass = !!error || rowsAffected === 0;
        return { actual, pass, note: rowsAffected === 0 ? "RLS returned 0 rows (silent block) — correct" : undefined };
      }
    );
  }

  // Test 3: Anonymous DELETE notes
  if (!anonWriteTestNoteId) {
    skip(
      "Anonymous user cannot DELETE from public.notes",
      "anonClient.from('notes').delete().eq('id', tempNoteId)",
      "RLS error or 0 rows affected — no row deleted",
      "Safe temporary test note could not be created (admin credentials required to create isolated test record without touching production data)"
    );
  } else {
    await test(
      "Anonymous user cannot DELETE from public.notes",
      `anonClient.from('notes').delete().eq('id','${anonWriteTestNoteId}')`,
      "RLS error or 0 rows affected — no row deleted",
      async () => {
        const { data, error, status } = await anonClient
          .from("notes")
          .delete()
          .eq("id", anonWriteTestNoteId!)
          .select("id");
        const rowsAffected = data?.length ?? 0;
        const actual = `HTTP ${status}, ${error ? `blocked: "${error.message}"` : `rows returned: ${rowsAffected} (${rowsAffected === 0 ? "no rows deleted ✓" : "DANGER: row deleted"})`}`;
        const pass = !!error || rowsAffected === 0;
        return { actual, pass };
      }
    );
  }

  // Test 4: Anonymous INSERT into note_likes
  await test(
    "Anonymous user cannot INSERT into public.note_likes",
    "anonClient.from('note_likes').insert({user_id:'fake-uuid', note_id:'...'})",
    "RLS error — like not created",
    async () => {
      const targetNoteId = anonWriteTestNoteId ?? "00000000-0000-0000-0000-000000000000";
      const { error, status } = await anonClient.from("note_likes").insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        note_id: targetNoteId
      }).select("note_id");
      const actual = `HTTP ${status}, ${error ? `blocked: "${error.message}" (code: ${error.code})` : `DANGER: row inserted`}`;
      return { actual, pass: !!error };
    }
  );

  // Establish isolated temporary system_config row if supported by schema.
  // NEVER modify or target system_config.main.
  let tempConfigId: string | null = null;
  if (adminClient && verifiedAdminUser) {
    const candidateConfigId = `rls-test-config-${Date.now()}`;
    const { data, error } = await adminClient.from("system_config").insert({
      id: candidateConfigId,
      announcement: "[RLS TEST] temporary config",
      announcement_active: false,
      enable_simulator: false,
      enable_submissions: false,
    }).select("id").maybeSingle();

    if (!error && data?.id) {
      tempConfigId = data.id;
      adminCreatedConfigIds.push(data.id);
    }
  }

  // Test 5: Anonymous UPDATE system_config
  if (!tempConfigId) {
    skip(
      "Anonymous user cannot UPDATE public.system_config",
      "anonClient.from('system_config').update({...}).eq('id', tempConfigId)",
      "RLS error or 0 rows affected",
      "Safe temporary system_config row could not be created (system_config.main is protected from test writes)"
    );
  } else {
    await test(
      "Anonymous user cannot UPDATE public.system_config",
      `anonClient.from('system_config').update({announcement:'hacked'}).eq('id','${tempConfigId}')`,
      "RLS error or 0 rows affected",
      async () => {
        const { data, error, status } = await anonClient
          .from("system_config")
          .update({ announcement: "[RLS TEST] Anonymous config attack — should be blocked" })
          .eq("id", tempConfigId!)
          .select("id");
        const rowsAffected = data?.length ?? 0;
        const actual = `HTTP ${status}, ${error ? `blocked: "${error.message}"` : `rows returned: ${rowsAffected} (${rowsAffected === 0 ? "no rows updated ✓" : "DANGER: config updated"})`}`;
        const pass = !!error || rowsAffected === 0;
        return { actual, pass };
      }
    );
  }

  // Test 6: Anonymous call to toggle_note_like RPC
  await test(
    "Anonymous user cannot call toggle_note_like RPC",
    "anonClient.rpc('toggle_note_like', { note_id: '...' })",
    "RLS/auth error — like not toggled",
    async () => {
      const targetNoteId = anonWriteTestNoteId ?? "00000000-0000-0000-0000-000000000000";
      const { data, error, status } = await anonClient.rpc("toggle_note_like", {
        note_id: targetNoteId
      });
      const actual = `HTTP ${status}, ${error ? `blocked: "${error.message}" (code: ${error.code})` : `DANGER: RPC succeeded, data=${JSON.stringify(data)}`}`;
      return { actual, pass: !!error };
    }
  );

  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 2 — Anonymous Storage tests
  // ───────────────────────────────────────────────────────────────────────────

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("PHASE 2 — Anonymous Storage operations");
  console.log("════════════════════════════════════════════════════════════════");

  // Test 7: Anonymous Storage upload blocked
  // Must SKIP unless verified adminClient exists, so that any unexpected upload is immediately cleaned up.
  if (!adminClient || !verifiedAdminUser) {
    skip(
      "Anonymous Storage upload is blocked (Notesopedia bucket)",
      "anonClient.storage.from('Notesopedia').upload('rls-anon-test-<ts>.txt', ...)",
      "Storage error — upload rejected",
      "Verified admin client required for immediate cleanup if anonymous upload unexpectedly succeeds"
    );
  } else {
    await test(
      "Anonymous Storage upload is blocked (Notesopedia bucket)",
      "anonClient.storage.from('Notesopedia').upload('rls-anon-test-<ts>.txt', ...)",
      "Storage error — upload rejected",
      async () => {
        const anonUploadPath = `rls-anon-test-${Date.now()}.txt`;
        const testContent = new Blob(["rls-anon-upload-test"], { type: "text/plain" });
        const { data, error } = await anonClient.storage
          .from("Notesopedia")
          .upload(anonUploadPath, testContent, { upsert: false });

        if (!error && data?.path) {
          adminCreatedStoragePaths.push(data.path);
          const { error: removeErr } = await adminClient.storage.from("Notesopedia").remove([data.path]);
          const cleanedUp = !removeErr;
          if (cleanedUp) {
            const idx = adminCreatedStoragePaths.indexOf(data.path);
            if (idx !== -1) adminCreatedStoragePaths.splice(idx, 1);
          }
          const cleanupMsg = cleanedUp
            ? "immediate cleanup succeeded"
            : `immediate cleanup FAILED: "${removeErr?.message}" — manual cleanup required`;
          return {
            actual: `DANGER: anonymous upload succeeded, path=${data.path} (${cleanupMsg})`,
            pass: false,
            note: cleanedUp ? undefined : "CRITICAL: Anonymous upload succeeded and admin cleanup failed"
          };
        }
        const actual = error
          ? `blocked: "${error.message}"`
          : `DANGER: uploaded, path=${data?.path}`;
        return { actual, pass: !!error };
      }
    );
  }

  // Test 8: Public Storage download remains available (read-only)
  const storageFile = await getAnExistingStorageFile();
  if (!storageFile) {
    skip(
      "Public Storage download is available (Notesopedia bucket, anon)",
      "anonClient.storage.from('Notesopedia').getPublicUrl(...)",
      "Public URL returned (HTTP fetch 200)",
      "No existing file in bucket to test against — bucket may be empty"
    );
  } else {
    await test(
      "Public Storage download is available (Notesopedia bucket, anon)",
      `anonClient.storage.from('Notesopedia').getPublicUrl('${storageFile}')`,
      "Public URL returned (HTTP fetch 200)",
      async () => {
        const { data } = anonClient.storage.from("Notesopedia").getPublicUrl(storageFile);
        const response = await fetch(data.publicUrl, { method: "HEAD" });
        const actual = `getPublicUrl OK, HTTP HEAD ${response.status} ${response.statusText}`;
        return { actual, pass: response.ok || response.status === 200 };
      }
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 3 — Authenticated tests (require tokens/credentials set via env vars)
  // ───────────────────────────────────────────────────────────────────────────

  let createdNormalNoteId: string | null = null;

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("PHASE 3 — Authenticated normal-user tests");
  console.log("════════════════════════════════════════════════════════════════");

  if (!NORMAL_USER_TOKEN || !normalClient || !verifiedNormalUser) {
    console.log("  ℹ️  Normal user credentials/token not set or invalid — skipping authenticated normal-user tests.");
    console.log("     See END OF REPORT for required test account setup instructions.");

    const authTests = [
      ["Authenticated normal user can INSERT own note", "normalClient.from('notes').insert({owner_id: user.id, ...})", "HTTP 201, note created"],
      ["Authenticated normal user cannot UPDATE another user's note", "normalClient.from('notes').update({...}).eq('id', OTHER_USER_NOTE_ID)", "0 rows updated (RLS silently blocks)"],
      ["Authenticated normal user cannot DELETE another user's note", "normalClient.from('notes').delete().eq('id', OTHER_USER_NOTE_ID)", "0 rows deleted (RLS silently blocks)"],
      ["Authenticated normal user can like a note (toggle_note_like)", "normalClient.rpc('toggle_note_like', { note_id })", "Liked: true, like_count incremented"],
      ["Authenticated Storage upload succeeds for normal user", "normalClient.storage.from('Notesopedia').upload(...)", "Upload succeeds, path returned"],
    ];
    for (const [purpose, method, expected] of authTests) {
      skip(purpose, method, expected, "Valid normal user credentials/token not provided");
    }
  } else {
    console.log(`  ℹ️  Normal user token valid: user.id = ${verifiedNormalUser.id}`);

    // T09: Normal user can INSERT their own note
    await test(
      "Authenticated normal user can INSERT own note",
      "normalClient.from('notes').insert({owner_id set by server via RLS, ...})",
      "HTTP 201, note row returned with owner_id = user.id",
      async () => {
        const testNoteId = `rls-test-normal-${Date.now()}`;
        const { data, error, status } = await normalClient.from("notes").insert({
          id: testNoteId,
          title: "[RLS TEST] Normal user insert — safe to delete",
          content: "Live RLS test note — created by automated test",
          subject_name: "Security Test",
          subject_code: "SEC-001",
          topic_name: "RLS Verification",
          uploader_name: "Test User",
          uploader_role: "Student",
          owner_id: verifiedNormalUser.id,
          likes: 0
        }).select("id, owner_id").single();

        if (!error && data?.id) {
          createdNormalNoteId = data.id;
          normalCreatedNoteIds.push(data.id);
        }

        const actual = `HTTP ${status}, ${error ? `error: "${error.message}"` : `id=${data?.id}, owner_id=${data?.owner_id}`}`;
        const pass = !error && data?.owner_id === verifiedNormalUser.id;
        return { actual, pass };
      }
    );

    // Setup cross-user test note:
    // Must NOT use any production records for cross-user UPDATE/DELETE tests.
    let crossUserTestNoteId: string | null = null;
    if (adminClient && verifiedAdminUser && verifiedAdminUser.id !== verifiedNormalUser.id) {
      const candidateId = `rls-test-crossuser-${Date.now()}`;
      const { data, error } = await adminClient.from("notes").insert({
        id: candidateId,
        title: `[RLS TEST] Cross-user test note ${Date.now()}`,
        content: "Live RLS test note created by admin for cross-user negative tests",
        subject_name: "Security Test",
        subject_code: "SEC-001",
        uploader_name: "Admin User",
        uploader_role: "Administrator",
        owner_id: verifiedAdminUser.id,
        likes: 0
      }).select("id").maybeSingle();

      if (!error && data?.id) {
        crossUserTestNoteId = data.id;
        adminCreatedNoteIds.push(data.id);
      }
    }

    // T10: Normal user cannot UPDATE another user's note
    if (!crossUserTestNoteId) {
      skip(
        "Authenticated normal user cannot UPDATE another user's note",
        "normalClient.from('notes').update({...}).eq('id', crossUserNoteId)",
        "0 rows updated — RLS silently blocks cross-user update",
        "Safe temporary note owned by another user could not be created (admin client required to create isolated cross-user record without touching production data)"
      );
    } else {
      await test(
        "Authenticated normal user cannot UPDATE another user's note",
        `normalClient.from('notes').update({title:...}).eq('id', '${crossUserTestNoteId}')`,
        "0 rows updated — RLS silently blocks cross-user update",
        async () => {
          const { data, error, status } = await normalClient
            .from("notes")
            .update({ title: "[RLS TEST] Cross-user update — should be blocked" })
            .eq("id", crossUserTestNoteId!)
            .select("id");

          const rowsAffected = data?.length ?? 0;
          const actual = `HTTP ${status}, ${error ? `error: "${error.message}"` : `rows returned: ${rowsAffected} (${rowsAffected === 0 ? "correctly blocked ✓" : "DANGER: updated!"})`}`;
          const pass = !!error || rowsAffected === 0;
          return { actual, pass };
        }
      );
    }

    // T11: Normal user cannot DELETE another user's note
    if (!crossUserTestNoteId) {
      skip(
        "Authenticated normal user cannot DELETE another user's note",
        "normalClient.from('notes').delete().eq('id', crossUserNoteId)",
        "0 rows deleted — RLS silently blocks cross-user delete",
        "Safe temporary note owned by another user could not be created (admin client required to create isolated cross-user record without touching production data)"
      );
    } else {
      await test(
        "Authenticated normal user cannot DELETE another user's note",
        `normalClient.from('notes').delete().eq('id', '${crossUserTestNoteId}')`,
        "0 rows deleted — RLS silently blocks cross-user delete",
        async () => {
          const { data, error, status } = await normalClient
            .from("notes")
            .delete()
            .eq("id", crossUserTestNoteId!)
            .select("id");

          const rowsAffected = data?.length ?? 0;
          const actual = `HTTP ${status}, ${error ? `error: "${error.message}"` : `rows returned: ${rowsAffected} (${rowsAffected === 0 ? "correctly blocked ✓" : "DANGER: deleted!"})`}`;
          const pass = !!error || rowsAffected === 0;
          return { actual, pass };
        }
      );
    }

    // T12: Normal user can like a note
    const likeTargetNoteId = createdNormalNoteId ?? anonWriteTestNoteId;
    if (!likeTargetNoteId) {
      skip(
        "Authenticated normal user can call toggle_note_like",
        "normalClient.rpc('toggle_note_like', { note_id })",
        "RPC succeeds, liked boolean and like_count returned",
        "No isolated test note available from this run to toggle like on (production notes are never targeted)"
      );
    } else {
      await test(
        "Authenticated normal user can call toggle_note_like",
        `normalClient.rpc('toggle_note_like', { note_id: '${likeTargetNoteId}' })`,
        "RPC succeeds, liked boolean and like_count returned",
        async () => {
          const { data, error, status } = await normalClient.rpc("toggle_note_like", { note_id: likeTargetNoteId });
          const result = Array.isArray(data) ? data[0] : data;
          const actual = `HTTP ${status}, ${error ? `error: "${error.message}"` : `liked=${result?.liked}, like_count=${result?.like_count}`}`;
          const pass = !error && result !== null;
          // Toggle back to restore original state
          await Promise.resolve(normalClient.rpc("toggle_note_like", { note_id: likeTargetNoteId })).catch(() => {});
          return { actual, pass };
        }
      );
    }

    // T13: Authenticated Storage upload
    await test(
      "Authenticated normal user Storage upload succeeds",
      "normalClient.storage.from('Notesopedia').upload('rls-test-normal-<ts>.txt', ...)",
      "Upload succeeds, path returned",
      async () => {
        const testPath = `rls-test-normal-${Date.now()}.txt`;
        const testContent = new Blob(["rls-auth-upload-test"], { type: "text/plain" });
        const { data, error } = await normalClient.storage
          .from("Notesopedia")
          .upload(testPath, testContent, { upsert: false });

        if (!error && data?.path) {
          normalCreatedStoragePaths.push(data.path);
        }
        const actual = error
          ? `blocked: "${error.message}"`
          : `Upload OK, path=${data?.path}`;
        return { actual, pass: !error && !!data?.path };
      }
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 4 — Admin tests (require admin token/credentials)
  // ───────────────────────────────────────────────────────────────────────────

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("PHASE 4 — Admin tests");
  console.log("════════════════════════════════════════════════════════════════");

  if (!ADMIN_USER_TOKEN || !adminClient || !verifiedAdminUser) {
    console.log("  ℹ️  Admin credentials/token not set or invalid — skipping admin tests.");

    const adminTests = [
      ["Admin can UPDATE any note", "adminClient.from('notes').update({...}).eq('id', TEST_NOTE_ID)", "Row updated, HTTP 200"],
      ["Admin can DELETE any note", "adminClient.from('notes').delete().eq('id', TEST_NOTE_ID)", "Row deleted, HTTP 200"],
      ["Admin can UPDATE system_config", "adminClient.from('system_config').update({...}).eq('id', tempConfigId)", "Config updated, HTTP 200"],
    ];
    for (const [purpose, method, expected] of adminTests) {
      skip(purpose, method, expected, "Valid admin credentials/token not provided");
    }
  } else {
    console.log(`  ℹ️  Admin token valid: user.id = ${verifiedAdminUser.id}, is_admin = true`);

    // T14: Admin UPDATE — operates exclusively on a test note created during this test run.
    const adminUpdateTargetId = createdNormalNoteId ?? anonWriteTestNoteId;
    if (!adminUpdateTargetId) {
      skip(
        "Admin can UPDATE a note created in this test run",
        "adminClient.from('notes').update({content:'...'}).eq('id', targetId)",
        "Row updated, 1 row returned — proves admin RLS UPDATE policy works",
        "No isolated test note was created by this test run to update"
      );
    } else {
      await test(
        "Admin can UPDATE a note created in this test run",
        `adminClient.from('notes').update({content:'...'}).eq('id', '${adminUpdateTargetId}')`,
        "Row updated, 1 row returned — proves admin RLS UPDATE policy works",
        async () => {
          const { data, error, status } = await adminClient
            .from("notes")
            .update({ content: "Admin UPDATE verified by live RLS test — safe to delete" })
            .eq("id", adminUpdateTargetId)
            .select("id");

          const pass = !error && (data?.length ?? 0) > 0;
          const actual = `HTTP ${status}, ${error ? `error: "${error.message}"` : `rows: ${data?.length} (id=${adminUpdateTargetId})`}`;
          return { actual, pass };
        }
      );
    }

    // T15: Admin DELETE — operates exclusively on a dedicated test note created in this run.
    // NEVER query and delete arbitrary existing notes matching [RLS TEST]!
    const adminDeleteCandidateId = `rls-test-admin-del-${Date.now()}`;
    const { data: delNote, error: delNoteErr } = await adminClient.from("notes").insert({
      id: adminDeleteCandidateId,
      title: `[RLS TEST] temporary admin-delete-test-${Date.now()}`,
      content: "Ephemeral test note for admin delete verification",
      subject_name: "Security Test",
      subject_code: "SEC-001",
      uploader_name: "Admin Tester",
      uploader_role: "Administrator",
      owner_id: verifiedAdminUser.id,
      likes: 0
    }).select("id").maybeSingle();

    if (delNoteErr || !delNote?.id) {
      skip(
        "Admin can DELETE a note (tested on dedicated test note created in this run)",
        `adminClient.from('notes').delete().eq('id', '${adminDeleteCandidateId}')`,
        "Row deleted, HTTP 200",
        "Could not create dedicated test note for admin delete verification"
      );
    } else {
      adminCreatedNoteIds.push(delNote.id);

      await test(
        "Admin can DELETE a note (tested on dedicated test note created in this run)",
        `adminClient.from('notes').delete().eq('id', '${delNote.id}')`,
        "Row deleted, HTTP 200",
        async () => {
          const { data, error, status } = await adminClient
            .from("notes")
            .delete()
            .eq("id", delNote.id)
            .select("id");

          const pass = !error && (data?.length ?? 0) > 0;
          const actual = `HTTP ${status}, ${error ? `error: "${error.message}"` : `deleted: ${data?.[0]?.id}`}`;
          if (pass) {
            const idx = adminCreatedNoteIds.indexOf(delNote.id);
            if (idx !== -1) adminCreatedNoteIds.splice(idx, 1);
          }
          return { actual, pass };
        }
      );
    }

    // T16: Admin UPDATE system_config (operates on temporary config row only; NEVER touches 'main')
    if (!tempConfigId) {
      skip(
        "Admin can UPDATE system_config (tested on temporary config row)",
        "adminClient.from('system_config').update({...}).eq('id', tempConfigId)",
        "Config updated, HTTP 200",
        "Safe temporary system_config row could not be created (system_config.main is protected from test writes)"
      );
    } else {
      await test(
        "Admin can UPDATE system_config (tested on temporary config row)",
        `adminClient.from('system_config').update({...}).eq('id', '${tempConfigId}')`,
        "Config updated, HTTP 200",
        async () => {
          const { data, error, status } = await adminClient
            .from("system_config")
            .update({
              announcement: "[RLS TEST] Admin updated config row",
              announcement_active: false,
              enable_simulator: false,
              enable_submissions: false
            })
            .eq("id", tempConfigId!)
            .select("id");

          const pass = !error && (data?.length ?? 0) > 0;
          const actual = `HTTP ${status}, ${error ? `error: "${error.message}"` : `rows: ${data?.length}`}`;
          return { actual, pass };
        }
      );
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 5 — Privacy tests
  // ───────────────────────────────────────────────────────────────────────────

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("PHASE 5 — Additional privacy checks");
  console.log("════════════════════════════════════════════════════════════════");

  await test(
    "Anonymous user note_likes read — check user_id not exposed",
    "anonClient.from('note_likes').select('*').limit(5)",
    "Either blocked (error) or user_id rows not returned",
    async () => {
      const { data, error, status } = await anonClient
        .from("note_likes").select("*").limit(5);
      if (error) {
        return { actual: `HTTP ${status}, blocked: "${error.message}"`, pass: true };
      }
      // If data is returned, check whether user_id is exposed
      const exposesUserId = (data ?? []).some((row: any) => !!row.user_id);
      const actual = `HTTP ${status}, ${data?.length ?? 0} rows returned${exposesUserId ? ", user_id EXPOSED ⚠️" : ", user_id not visible"}`;
      return {
        actual,
        pass: !exposesUserId,
        note: exposesUserId
          ? "user_id is exposed to anonymous users in note_likes — consider restricting SELECT or masking user_id"
          : "note_likes readable but user_id not exposed (or table not readable)"
      };
    }
  );

  await test(
    "Anonymous user cannot read public.users table (user email/profile privacy)",
    "anonClient.from('users').select('*').limit(1)",
    "Blocked by RLS or empty (users should not be publicly readable)",
    async () => {
      const { data, error, status } = await anonClient.from("users").select("*").limit(1);
      if (error) {
        return { actual: `HTTP ${status}, blocked: "${error.message}"`, pass: true };
      }
      const exposesData = (data?.length ?? 0) > 0;
      const actual = `HTTP ${status}, ${data?.length ?? 0} rows returned`;
      return {
        actual,
        pass: !exposesData,
        note: exposesData
          ? "⚠️  public.users rows visible to anonymous users — check SELECT policy"
          : "Table returns 0 rows for anon — correct"
      };
    }
  );
} finally {
  // ───────────────────────────────────────────────────────────────────────────
  // CLEANUP — Guaranteed cleanup of only exact IDs created in this run
  // ───────────────────────────────────────────────────────────────────────────

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("CLEANUP — Removing test records created during this run");
  console.log("════════════════════════════════════════════════════════════════");

  // 1. Admin cleanup — MUST use verified adminClient only. Never normalClient.
  if (adminCreatedNoteIds.length > 0) {
    console.log(`  Cleaning up ${adminCreatedNoteIds.length} admin-created test note(s)...`);
    for (const noteId of [...adminCreatedNoteIds]) {
      try {
        if (adminClient && verifiedAdminUser) {
          const { error } = await adminClient.from("notes").delete().eq("id", noteId);
          if (error) {
            console.warn(`  ⚠️ Failed to delete admin test note ${noteId}: ${error.message}`);
          } else {
            console.log(`  ✓ Deleted admin test note: ${noteId}`);
          }
        } else {
          console.warn(`  ⚠️ Verified admin client not available to delete admin test note ${noteId}`);
        }
      } catch (err: any) {
        console.warn(`  ⚠️ Error deleting admin test note ${noteId}: ${err.message}`);
      }
    }
  } else {
    console.log("  No admin temporary notes to clean up.");
  }

  if (adminCreatedConfigIds.length > 0) {
    console.log(`  Cleaning up ${adminCreatedConfigIds.length} admin-created test config row(s)...`);
    for (const configId of [...adminCreatedConfigIds]) {
      try {
        if (adminClient && verifiedAdminUser) {
          const { error } = await adminClient.from("system_config").delete().eq("id", configId);
          if (error) {
            console.warn(`  ⚠️ Failed to delete admin test config row ${configId}: ${error.message}`);
          } else {
            console.log(`  ✓ Deleted admin test config row: ${configId}`);
          }
        } else {
          console.warn(`  ⚠️ Verified admin client not available to delete admin test config row ${configId}`);
        }
      } catch (err: any) {
        console.warn(`  ⚠️ Error deleting admin test config row ${configId}: ${err.message}`);
      }
    }
  } else {
    console.log("  No temporary config rows to clean up.");
  }

  if (adminCreatedStoragePaths.length > 0) {
    console.log(`  Cleaning up ${adminCreatedStoragePaths.length} admin/anon test storage file(s)...`);
    for (const filePath of [...adminCreatedStoragePaths]) {
      try {
        if (adminClient && verifiedAdminUser) {
          const { error } = await adminClient.storage.from("Notesopedia").remove([filePath]);
          if (error) {
            console.warn(`  ⚠️ Failed to delete test storage file ${filePath}: ${error.message}`);
          } else {
            console.log(`  ✓ Deleted test storage file: ${filePath}`);
          }
        } else {
          console.warn(`  ⚠️ Verified admin client not available to delete test storage file ${filePath}`);
        }
      } catch (err: any) {
        console.warn(`  ⚠️ Error deleting test storage file ${filePath}: ${err.message}`);
      }
    }
  } else {
    console.log("  No admin temporary storage files to clean up.");
  }

  // 2. Normal user cleanup — clean up records created by normal user (verified normalClient only)
  if (normalCreatedNoteIds.length > 0) {
    console.log(`  Cleaning up ${normalCreatedNoteIds.length} normal-user test note(s)...`);
    for (const noteId of [...normalCreatedNoteIds]) {
      try {
        if (normalClient && verifiedNormalUser) {
          const { error } = await normalClient.from("notes").delete().eq("id", noteId);
          if (error) {
            console.warn(`  ⚠️ Failed to delete normal test note ${noteId}: ${error.message}`);
          } else {
            console.log(`  ✓ Deleted normal test note: ${noteId}`);
          }
        } else {
          console.warn(`  ⚠️ Verified normal user client not available to delete normal test note ${noteId}`);
        }
      } catch (err: any) {
        console.warn(`  ⚠️ Error deleting normal test note ${noteId}: ${err.message}`);
      }
    }
  } else {
    console.log("  No normal-user temporary notes to clean up.");
  }

  if (normalCreatedStoragePaths.length > 0) {
    console.log(`  Cleaning up ${normalCreatedStoragePaths.length} normal-user test storage file(s)...`);
    for (const filePath of [...normalCreatedStoragePaths]) {
      try {
        if (normalClient && verifiedNormalUser) {
          const { error } = await normalClient.storage.from("Notesopedia").remove([filePath]);
          if (error) {
            console.warn(`  ⚠️ Failed to delete normal test storage file ${filePath}: ${error.message}`);
          } else {
            console.log(`  ✓ Deleted normal test storage file: ${filePath}`);
          }
        } else {
          console.warn(`  ⚠️ Verified normal user client not available to delete normal test storage file ${filePath}`);
        }
      } catch (err: any) {
        console.warn(`  ⚠️ Error deleting normal test storage file ${filePath}: ${err.message}`);
      }
    }
  } else {
    console.log("  No normal-user temporary storage files to clean up.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FINAL SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.status === "PASS").length;
const failed = results.filter(r => r.status === "FAIL").length;
const skipped = results.filter(r => r.status === "SKIP").length;
const errors = results.filter(r => r.status === "ERROR").length;

console.log("\n════════════════════════════════════════════════════════════════");
console.log("LIVE SUPABASE AUTHORIZATION TEST RESULTS");
console.log("════════════════════════════════════════════════════════════════");
console.log();

const categories = {
  "A. VERIFIED BY LIVE SUPABASE": results.filter(r => r.status === "PASS" || r.status === "FAIL"),
  "B. SKIPPED (prerequisites or token not available)": results.filter(r => r.status === "SKIP"),
  "C. ERRORS": results.filter(r => r.status === "ERROR"),
};

for (const [label, list] of Object.entries(categories)) {
  if (list.length === 0) continue;
  console.log(`\n${label}:`);
  for (const r of list) {
    const icon = r.status === "PASS" ? "✅" : r.status === "FAIL" ? "❌" : r.status === "SKIP" ? "⏭️ " : "💥";
    console.log(`  ${icon} [${r.id}] ${r.purpose}`);
    console.log(`       Method:   ${r.method}`);
    console.log(`       Expected: ${r.expected}`);
    console.log(`       Actual:   ${r.actual}`);
    if (r.note) console.log(`       Note:     ${r.note}`);
  }
}

console.log(`\n──────────────────────────────────────────────────────────────`);
console.log(`  PASS: ${passed}   FAIL: ${failed}   SKIP: ${skipped}   ERROR: ${errors}`);
console.log(`──────────────────────────────────────────────────────────────`);

if (skipped > 0) {
  console.log(`
┌─────────────────────────────────────────────────────────────────────┐
│  AUTHENTICATED TEST SETUP INSTRUCTIONS                              │
│                                                                     │
│  To run the skipped tests, set test account environment variables   │
│  in .env.local:                                                     │
│                                                                     │
│  # Automated sign-in (email + password):                            │
│  SUPABASE_TEST_NORMAL_EMAIL=<student@test.com>                      │
│  SUPABASE_TEST_NORMAL_PASSWORD=<password>                           │
│  SUPABASE_TEST_ADMIN_EMAIL=<admin@test.com>                         │
│  SUPABASE_TEST_ADMIN_PASSWORD=<password>                            │
│                                                                     │
│  # Or direct JWT access tokens:                                     │
│  SUPABASE_TEST_NORMAL_TOKEN=<JWT from normal user>                  │
│  SUPABASE_TEST_ADMIN_TOKEN=<JWT from admin user>                    │
│                                                                     │
│  Safety guarantee: all test notes, configs, and files created        │
│  during execution are tracked and deleted in the cleanup phase.      │
│  No production data is ever modified or deleted.                    │
└─────────────────────────────────────────────────────────────────────┘`);
}

if (failed > 0 || errors > 0) {
  console.log("\n⛔  One or more live Supabase authorization tests FAILED.");
  process.exit(1);
}
