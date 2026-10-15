process.env.VERCEL = "1"; // prevent auto-binding port 3000

import { findRelevantNotes } from '../server';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✅ PASS  ${message}`);
}

console.log('\n──────────────────────────────────────────────────────────────');
console.log('PHASE 2 UNIT TESTS: AI Tutor Retrieval & Citation Precision');
console.log('──────────────────────────────────────────────────────────────');

const sampleNotes = [
  {
    id: "note-bfs-1",
    title: "Understanding Graph Traversal: BFS vs DFS Algorithms",
    content: "Graph traversal forms the core of network analysis. BFS uses a FIFO queue while DFS uses a stack. BFS finds shortest path in unweighted graphs.",
    subjectName: "Data Structures & Algorithms",
    topicName: "Graph Algorithms",
  },
  {
    id: "note-physics-2",
    title: "The Schrödinger Equation & Wave Functions Demystified",
    content: "The Schrödinger Equation is the cornerstone of quantum mechanics, describing wave functions and probability amplitude.",
    subjectName: "Advanced Quantum Mechanics",
    topicName: "Quantum Foundations",
  },
  {
    id: "note-econ-3",
    title: "Key Macroeconomic Indicators & Policy Impacts",
    content: "GDP measures national economic output. Fiscal policy tools manipulate taxation and government investment.",
    subjectName: "Macroeconomic Theory",
    topicName: "Economic Indicators",
  }
];

// Test 1: High relevance matches are retrieved accurately
const bfsResults = findRelevantNotes("Explain BFS graph traversal algorithm", sampleNotes);
assert(bfsResults.length > 0, "Retrieves relevant note for BFS query");
assert(bfsResults[0].id === "note-bfs-1", "Top BFS result has id note-bfs-1");

const physicsResults = findRelevantNotes("What is the Schrodinger wave equation?", sampleNotes);
assert(physicsResults.length > 0, "Retrieves relevant note for Schrodinger query");
assert(physicsResults[0].id === "note-physics-2", "Top Physics result has id note-physics-2");

const econResults = findRelevantNotes("Macroeconomic GDP fiscal policy indicators", sampleNotes);
assert(econResults.length > 0, "Retrieves relevant note for Macroeconomics query");
assert(econResults[0].id === "note-econ-3", "Top Econ result has id note-econ-3");

// Test 2: Generic queries with instructional stop words do NOT falsely cite notes
const bioResults = findRelevantNotes("I need help understanding photosynthesis in plants", sampleNotes);
assert(bioResults.length === 0, "Does NOT falsely cite Graph Traversal for 'understanding photosynthesis'");

const cellResults = findRelevantNotes("What is the key difference between Mitosis and Meiosis?", sampleNotes);
assert(cellResults.length === 0, "Does NOT falsely cite Macroeconomic Indicators for 'key difference' in biology");

const chemResults = findRelevantNotes("Introduction to organic chemistry hydrocarbons", sampleNotes);
assert(chemResults.length === 0, "Does NOT falsely cite unrelated notes for 'Introduction to organic chemistry'");

// Test 3: Substring matches inside words do not trigger false positive hits
const logResults = findRelevantNotes("Where can I find a wood log for a fireplace?", sampleNotes);
assert(logResults.length === 0, "Word 'log' does NOT substring-match 'Algorithms'");

const netResults = findRelevantNotes("How do fishermen cast a net in the ocean?", sampleNotes);
assert(netResults.length === 0, "Word 'net' does NOT falsely match 'network' in note content");

console.log('\n══════════════════════════════════════════════════════════════');
console.log('  ALL AI TUTOR RETRIEVAL TESTS COMPLETED: 8 passed, 0 failed');
console.log('══════════════════════════════════════════════════════════════\n');

process.exit(0);
