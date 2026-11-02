import assert from "assert";
import {
  getAIWorkspaceChatHistoryStorageKey,
  getAIChatHistoryStorageKey,
  parseAIChatHistory,
  parseAIWorkspaceChatHistory
} from "../src/utils/aiChatHistory";

assert.strictEqual(
  getAIChatHistoryStorageKey("user-1"),
  "notsopedia_ai_chat_history_user-1"
);
assert.notStrictEqual(
  getAIChatHistoryStorageKey("user-1"),
  getAIChatHistoryStorageKey("user-2")
);
assert.notStrictEqual(
  getAIWorkspaceChatHistoryStorageKey("user-1"),
  getAIChatHistoryStorageKey("user-1")
);
assert.strictEqual(parseAIChatHistory(null), null);
assert.strictEqual(parseAIChatHistory(JSON.stringify({ messages: [] })), null);
assert.deepStrictEqual(
  parseAIChatHistory(JSON.stringify([
    { sender: "user", text: "Question", timestamp: "10:00" },
    { sender: "admin", text: "Invalid sender", timestamp: "10:01" },
    { sender: "ai", text: "Answer", timestamp: "10:02", sources: [{ title: "Note", uri: "#note-1" }] }
  ])),
  [
    { sender: "user", text: "Question", timestamp: "10:00" },
    { sender: "ai", text: "Answer", timestamp: "10:02", sources: [{ title: "Note", uri: "#note-1" }] }
  ]
);
assert.strictEqual(
  parseAIChatHistory(JSON.stringify(
    Array.from({ length: 105 }, (_, index) => ({
      sender: "user",
      text: `Message ${index}`,
      timestamp: "10:00"
    }))
  ))?.length,
  100
);
assert.throws(() => parseAIChatHistory("{malformed"));
assert.deepStrictEqual(
  parseAIWorkspaceChatHistory(JSON.stringify([
    { role: "user", content: "Question" },
    { role: "system", content: "Invalid role" },
    { role: "assistant", content: "Answer" }
  ])),
  [
    { role: "user", content: "Question" },
    { role: "assistant", content: "Answer" }
  ]
);
assert.strictEqual(
  parseAIWorkspaceChatHistory(JSON.stringify(
    Array.from({ length: 105 }, (_, index) => ({
      role: "user",
      content: `Message ${index}`
    }))
  ))?.length,
  100
);

console.log("AI chat history tests: 10 passed, 0 failed");
