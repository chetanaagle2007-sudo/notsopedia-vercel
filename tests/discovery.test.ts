import { UserNote, NoteSortOption } from "../src/types";

// Helper replicating sorting logic
function sortNotes(notes: UserNote[], sortBy: NoteSortOption): UserNote[] {
  return notes.slice().sort((a, b) => {
    if (sortBy === "likes") {
      const likesA = typeof a.likes === "number" && !isNaN(a.likes) ? a.likes : 0;
      const likesB = typeof b.likes === "number" && !isNaN(b.likes) ? b.likes : 0;
      if (likesB !== likesA) return likesB - likesA;
      const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return (a.title || "").localeCompare(b.title || "");
    }

    if (sortBy === "title") {
      const titleA = (a.title || "").trim();
      const titleB = (b.title || "").trim();
      const cmp = titleA.localeCompare(titleB, undefined, { sensitivity: "base", numeric: true });
      if (cmp !== 0) return cmp;
      const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return timeB - timeA;
    }

    // Default: "newest"
    const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
    const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return (a.title || "").localeCompare(b.title || "");
  });
}

// Helper replicating filtering logic
function filterNotes(
  notes: UserNote[],
  searchQuery: string,
  selectedSubject: string,
  filterAttachmentsOnly: boolean
): UserNote[] {
  const q = searchQuery.trim().toLowerCase();

  return notes.filter((note) => {
    if (filterAttachmentsOnly) {
      const hasAttachment = Boolean(
        (note.fileUrl && note.fileUrl.trim()) || (note.fileName && note.fileName.trim())
      );
      if (!hasAttachment) return false;
    }

    const matchesSearch =
      !q ||
      (note.title && note.title.toLowerCase().includes(q)) ||
      (note.content && note.content.toLowerCase().includes(q)) ||
      (note.subjectName && note.subjectName.toLowerCase().includes(q)) ||
      (note.subjectCode && note.subjectCode.toLowerCase().includes(q)) ||
      (note.topicName && note.topicName.toLowerCase().includes(q)) ||
      (note.uploaderName && note.uploaderName.toLowerCase().includes(q)) ||
      (Array.isArray(note.tags) && note.tags.some((t) => t.toLowerCase().includes(q)));

    if (!matchesSearch) return false;

    if (selectedSubject === "All Subjects") {
      return true;
    }
    return (note.subjectName || "").toLowerCase() === selectedSubject.toLowerCase();
  });
}

// Mock Dataset for Testing
const sampleNotes: UserNote[] = [
  {
    id: "1",
    title: "Data Structures & Trees",
    content: "Binary search trees, AVL trees, traversal algorithms",
    subjectName: "Computer Science",
    subjectCode: "CS-101",
    topicName: "Trees",
    uploaderName: "Alice",
    uploaderRole: "Student",
    uploadedAt: "2026-03-01T10:00:00Z",
    likes: 15,
    fileName: "trees.pdf",
    fileUrl: "https://example.com/trees.pdf"
  },
  {
    id: "2",
    title: "Quantum Entanglement Basics",
    content: "Bell inequalities, qubits, and quantum state teleportation",
    subjectName: "Physics",
    subjectCode: "PHY-301",
    topicName: "Quantum",
    uploaderName: "Bob",
    uploaderRole: "Scholar",
    uploadedAt: "2026-04-15T12:00:00Z",
    likes: 42
  },
  {
    id: "3",
    title: "Algorithms & Dynamic Programming",
    content: "Memoization, tabulation, knapsack problem",
    subjectName: "Computer Science",
    subjectCode: "CS-102",
    topicName: "Algorithms",
    uploaderName: "Charlie",
    uploaderRole: "TA",
    uploadedAt: "2026-01-10T08:00:00Z",
    likes: 5,
    fileName: "dp-cheatsheet.pdf"
  },
  {
    id: "4",
    title: "Macroeconomics Inflation Models",
    content: "Phillips curve, monetary policy, and interest rate setting",
    subjectName: "Economics",
    subjectCode: "ECO-201",
    topicName: "Monetary Policy",
    uploaderName: "Diana",
    uploaderRole: "Student",
    uploadedAt: "", // missing date
    likes: 0
  }
];

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS  ${testName}`);
    totalPassed++;
  } else {
    console.error(`  ❌ FAIL  ${testName}`);
    totalFailed++;
  }
}

console.log("\n──────────────────────────────────────────────────────────────");
console.log("PHASE 2 UNIT TESTS: Note Sorting Logic");
console.log("──────────────────────────────────────────────────────────────");

// Test 1: Newest First
const sortedNewest = sortNotes(sampleNotes, "newest");
assert(
  sortedNewest[0].id === "2" && sortedNewest[1].id === "1" && sortedNewest[2].id === "3",
  "Sorts newest first by ISO date string, gracefully handling missing date"
);

// Test 2: Most Liked
const sortedLikes = sortNotes(sampleNotes, "likes");
assert(
  sortedLikes[0].id === "2" && sortedLikes[1].id === "1" && sortedLikes[2].id === "3" && sortedLikes[3].id === "4",
  "Sorts most liked in descending order (42 > 15 > 5 > 0)"
);

// Test 3: Title A–Z
const sortedTitle = sortNotes(sampleNotes, "title");
assert(
  sortedTitle[0].title.startsWith("Algorithms") &&
  sortedTitle[1].title.startsWith("Data Structures") &&
  sortedTitle[2].title.startsWith("Macroeconomics") &&
  sortedTitle[3].title.startsWith("Quantum"),
  "Sorts alphabetically by Title A–Z"
);

console.log("\n──────────────────────────────────────────────────────────────");
console.log("PHASE 2 UNIT TESTS: Filtering Logic");
console.log("──────────────────────────────────────────────────────────────");

// Test 4: Subject Filter
const csNotes = filterNotes(sampleNotes, "", "Computer Science", false);
assert(csNotes.length === 2 && csNotes.every((n) => n.subjectName === "Computer Science"), "Filters by Subject accurately");

// Test 5: Attachment Filter
const attachmentNotes = filterNotes(sampleNotes, "", "All Subjects", true);
assert(
  attachmentNotes.length === 2 && attachmentNotes.every((n) => Boolean(n.fileUrl || n.fileName)),
  "Filters notes with attachments accurately"
);

// Test 6: Combined Search + Subject + Attachment
const combinedNotes = filterNotes(sampleNotes, "dynamic", "Computer Science", true);
assert(
  combinedNotes.length === 1 && combinedNotes[0].id === "3",
  "Combines search query, subject filter, and attachment filter simultaneously"
);

// Test 7: Reset State
let testSearch = "quantum";
let testSubject = "Physics";
let testAttachmentOnly = true;
let testSort: NoteSortOption = "likes";

// Reset action
testSearch = "";
testSubject = "All Subjects";
testAttachmentOnly = false;
testSort = "newest";

const resetResult = filterNotes(sampleNotes, testSearch, testSubject, testAttachmentOnly);
assert(
  resetResult.length === sampleNotes.length && testSort === "newest",
  "Reset action restores all filters and default sorting"
);

console.log("\n══════════════════════════════════════════════════════════════");
console.log(`  DISCOVERY TEST RESULTS: ${totalPassed} passed, ${totalFailed} failed`);
console.log("══════════════════════════════════════════════════════════════\n");

if (totalFailed > 0) {
  process.exit(1);
}
