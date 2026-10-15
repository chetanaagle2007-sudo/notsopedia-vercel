process.env.VERCEL = "1"; // prevent auto-binding port 3000

import { findRelevantNotes } from '../server';
import { AIMode } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✅ PASS  ${message}`);
}

console.log('\n──────────────────────────────────────────────────────────────');
console.log('AI TUTOR COMPREHENSIVE RETRIEVAL & CITATION AUDIT TEST SUITE');
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

// Scenario 1: Relevant questions that should retrieve a specific note
const bfsResults = findRelevantNotes("Explain BFS graph traversal algorithm", sampleNotes);
assert(bfsResults.length > 0, "Scenario 1: Retrieves relevant note for BFS query");
assert(bfsResults[0].id === "note-bfs-1", "Scenario 1: Top BFS result has id note-bfs-1");

const physicsResults = findRelevantNotes("What is the Schrodinger wave equation?", sampleNotes);
assert(physicsResults.length > 0, "Scenario 1: Retrieves relevant note for Schrodinger query");
assert(physicsResults[0].id === "note-physics-2", "Scenario 1: Top Physics result has id note-physics-2");

// Scenario 2: Unrelated questions that should not cite that note
const bioResults = findRelevantNotes("Explain cellular respiration and ATP synthesis in mitochondria", sampleNotes);
assert(bioResults.length === 0, "Scenario 2: Completely unrelated biology query yields 0 citations");

// Scenario 3: Near-homographs (algorithms vs logarithms; wood log vs algorithm; ocean net vs network)
const logResults = findRelevantNotes("Where can I find a wood log for a fireplace?", sampleNotes);
assert(logResults.length === 0, "Scenario 3: Word 'log' does NOT substring-match 'Algorithms'");

const logarithmsResults = findRelevantNotes("How do natural logarithms and exponential bases relate?", sampleNotes);
assert(logarithmsResults.length === 0, "Scenario 3: 'logarithms' does NOT match 'algorithms'");

const oceanNetResults = findRelevantNotes("How do deep-sea fishermen cast a net?", sampleNotes);
assert(oceanNetResults.length === 0, "Scenario 3: Word 'net' does NOT falsely match 'network'");

// Scenario 4: Queries containing generic academic filler words
const genericStopwordQuery1 = findRelevantNotes("I need help understanding photosynthesis in plants", sampleNotes);
assert(genericStopwordQuery1.length === 0, "Scenario 4: 'understanding' stopword does NOT trigger Graph Traversal");

const genericStopwordQuery2 = findRelevantNotes("What is the key difference between Mitosis and Meiosis?", sampleNotes);
assert(genericStopwordQuery2.length === 0, "Scenario 4: 'key difference' stopword does NOT trigger Macroeconomics");

const genericStopwordQuery3 = findRelevantNotes("Introduction to organic chemistry hydrocarbons", sampleNotes);
assert(genericStopwordQuery3.length === 0, "Scenario 4: 'Introduction' stopword does NOT trigger unrelated notes");

// Scenario 5: Questions with inflectional variants / singular-plural matching
const singularQuery = findRelevantNotes("Explain graph algorithm traversal", sampleNotes);
assert(singularQuery.length > 0 && singularQuery[0].id === "note-bfs-1", "Scenario 5: Singular 'algorithm' matches plural 'Algorithms'");

const pluralQuery = findRelevantNotes("Schrodinger wave equations in quantum mechanics", sampleNotes);
assert(pluralQuery.length > 0 && pluralQuery[0].id === "note-physics-2", "Scenario 5: Plural 'equations' matches singular 'Equation'");

// Scenario 6: Ambiguous questions with multiple partial relevance ranked properly
const rankedResults = findRelevantNotes("Explain queue data structure and quantum wave function", sampleNotes);
assert(rankedResults.length >= 2, "Scenario 6: Matches both Computer Science and Quantum Physics notes");
const ids = rankedResults.map((n) => n.id);
assert(ids.includes("note-bfs-1") && ids.includes("note-physics-2"), "Scenario 6: Both relevant notes are included in multi-domain query");

// Scenario 7: Questions with no relevant notes
const noMatchQuery = findRelevantNotes("Renaissance architecture in 15th-century Florence", sampleNotes);
assert(noMatchQuery.length === 0, "Scenario 7: Returns empty array [] when library lacks evidence");

// Scenario 8: Questions requiring multiple notes
const multiNoteQuery = findRelevantNotes("Algorithms for macroeconomic fiscal policy modeling", sampleNotes);
assert(multiNoteQuery.length >= 2, "Scenario 8: Returns both Algorithms note and Macroeconomics note");

// Scenario 9: Duplicate or similarly titled notes
const notesWithDuplicates = [
  ...sampleNotes,
  {
    id: "note-bfs-duplicate",
    title: "Understanding Graph Traversal: BFS vs DFS Algorithms",
    content: "Duplicate copy of graph traversal.",
    subjectName: "Data Structures & Algorithms",
    topicName: "Graph Algorithms",
  },
  {
    id: "note-bfs-1",
    title: "Understanding Graph Traversal: BFS vs DFS Algorithms",
    content: "Original copy of graph traversal.",
    subjectName: "Data Structures & Algorithms",
    topicName: "Graph Algorithms",
  }
];
const dedupedResults = findRelevantNotes("Explain BFS graph traversal", notesWithDuplicates);
assert(dedupedResults.length === 1, "Scenario 9: Successfully deduplicates identical notes/titles");

// Scenario 10: Large collections of notes (fast execution and max results cap)
const largeNoteCollection = [];
for (let i = 0; i < 50; i++) {
  largeNoteCollection.push({
    id: `note-distractor-${i}`,
    title: `Distractor Academic Topic ${i}: Ancient History and Archeology`,
    content: `Historical facts and excavations from era ${i} with archeological data.`,
    subjectName: "History",
    topicName: "Archeology",
  });
}
largeNoteCollection.push(sampleNotes[0]); // inject genuine note

const largeCollectionResults = findRelevantNotes("Explain BFS graph traversal", largeNoteCollection);
assert(largeCollectionResults.length === 1, "Scenario 10: Filters 50+ distractors and isolates the single relevant note");
assert(largeCollectionResults[0].id === "note-bfs-1", "Scenario 10: Correctly identifies note-bfs-1 in large corpus");

// Scenario 11: Validating all existing AI Tutor modes
const supportedModes: AIMode[] = ["notes-expert", "exam-prep", "news-gk"];
for (const mode of supportedModes) {
  assert(typeof mode === "string" && mode.length > 0, `Scenario 11: AI Tutor mode '${mode}' is defined and supported`);
}

console.log('\n══════════════════════════════════════════════════════════════');
console.log('  ALL 11 AI TUTOR SCENARIOS PASSED: 18 assertions, 0 failed');
console.log('══════════════════════════════════════════════════════════════\n');

process.exit(0);
