import type { AIChatMessage } from "../types";

const MAX_SAVED_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 20_000;

interface StoredAIChatMessage extends Record<string, unknown> {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface AIWorkspaceChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface StoredAIWorkspaceChatMessage extends Record<string, unknown> {
  role: "user" | "assistant";
  content: string;
}

function isStoredAIChatMessage(message: unknown): message is StoredAIChatMessage {
  if (typeof message !== "object" || message === null) return false;
  const record = message as Record<string, unknown>;
  return (
    (record.sender === "user" || record.sender === "ai") &&
    typeof record.text === "string" &&
    record.text.length <= MAX_MESSAGE_LENGTH &&
    typeof record.timestamp === "string"
  );
}

function isChatSource(source: unknown): source is { title: string; uri: string } {
  if (typeof source !== "object" || source === null) return false;
  const record = source as Record<string, unknown>;
  return typeof record.title === "string" && typeof record.uri === "string";
}

function isStoredAIWorkspaceChatMessage(
  message: unknown
): message is StoredAIWorkspaceChatMessage {
  if (typeof message !== "object" || message === null) return false;
  const record = message as Record<string, unknown>;
  return (
    (record.role === "user" || record.role === "assistant") &&
    typeof record.content === "string" &&
    record.content.length <= MAX_MESSAGE_LENGTH
  );
}

export function getAIChatHistoryStorageKey(userId: string): string {
  return `notsopedia_ai_chat_history_${userId}`;
}

export function getAIWorkspaceChatHistoryStorageKey(userId: string): string {
  return `notsopedia_ai_workspace_chat_${userId}`;
}

export function parseAIChatHistory(serialized: string | null): AIChatMessage[] | null {
  if (serialized === null) return null;

  const parsed: unknown = JSON.parse(serialized);
  if (!Array.isArray(parsed)) return null;
  const messages: unknown[] = parsed;

  return messages
    .filter(isStoredAIChatMessage)
    .slice(-MAX_SAVED_MESSAGES)
    .map((message) => ({
      sender: message.sender,
      text: message.text,
      timestamp: message.timestamp,
      ...(Array.isArray(message.sources)
        ? {
            sources: (message.sources as unknown[]).filter(isChatSource)
          }
        : {}),
      ...(typeof message.provider === "string" ? { provider: message.provider } : {}),
      ...(typeof message.model === "string" ? { model: message.model } : {}),
      ...(typeof message.executionMode === "string" ? { executionMode: message.executionMode } : {})
    }));
}

export function parseAIWorkspaceChatHistory(
  serialized: string | null
): AIWorkspaceChatMessage[] | null {
  if (serialized === null) return null;

  const parsed: unknown = JSON.parse(serialized);
  if (!Array.isArray(parsed)) return null;
  const messages: unknown[] = parsed;

  return messages
    .filter(isStoredAIWorkspaceChatMessage)
    .slice(-MAX_SAVED_MESSAGES)
    .map(({ role, content }) => ({ role, content }));
}
