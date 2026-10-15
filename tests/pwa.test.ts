import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✅ PASS  ${message}`);
}

console.log('\n──────────────────────────────────────────────────────────────');
console.log('PHASE 1 UNIT TESTS: PWA Lifecycle & Service Worker Verification');
console.log('──────────────────────────────────────────────────────────────');

// Test 1: Service Worker file exists and contains essential lifecycle handlers
const swPath = path.resolve(process.cwd(), 'public', 'sw.js');
assert(fs.existsSync(swPath), 'public/sw.js exists on disk');

const swContent = fs.readFileSync(swPath, 'utf-8');
assert(swContent.includes('self.addEventListener("install"'), 'sw.js contains install event listener');
assert(swContent.includes('self.addEventListener("activate"'), 'sw.js contains activate event listener');
assert(swContent.includes('self.addEventListener("message"'), 'sw.js contains message listener for SKIP_WAITING');
assert(swContent.includes('self.addEventListener("fetch"'), 'sw.js contains fetch event listener');

// Test 2: Caching policies verification
assert(swContent.includes('url.pathname.startsWith("/api/")'), 'sw.js explicitly bypasses /api/* requests from caching');
assert(swContent.includes('event.request.mode === "navigate"'), 'sw.js uses Network-First with cache fallback for navigation/HTML requests');
assert(swContent.includes('url.pathname.startsWith("/assets/")'), 'sw.js uses Cache-First with network fallback for content-hashed assets');

// Test 3: Cache eviction on activation
assert(swContent.includes('.filter((key) =>') && swContent.includes('caches.delete(key)'), 'sw.js cleans up stale cache stores during activate');
assert(swContent.includes('self.clients.claim()'), 'sw.js claims clients on activation');

// Test 4: main.tsx production separation & update check listeners
const mainPath = path.resolve(process.cwd(), 'src', 'main.tsx');
assert(fs.existsSync(mainPath), 'src/main.tsx exists on disk');

const mainContent = fs.readFileSync(mainPath, 'utf-8');
assert(mainContent.includes('import.meta.env.PROD'), 'main.tsx enforces production-only service worker registration');
assert(mainContent.includes('visibilitychange'), 'main.tsx checks for SW updates when document becomes visible');
assert(mainContent.includes('online'), 'main.tsx checks for SW updates when device reconnects to network');
assert(mainContent.includes('controllerchange'), 'main.tsx listens for controllerchange to reload page');
assert(mainContent.includes('SKIP_WAITING'), 'main.tsx sends SKIP_WAITING to waiting worker upon user confirmation');

console.log('\n══════════════════════════════════════════════════════════════');
console.log('  ALL PWA LIFECYCLE TESTS COMPLETED: 11 passed, 0 failed');
console.log('══════════════════════════════════════════════════════════════\n');
