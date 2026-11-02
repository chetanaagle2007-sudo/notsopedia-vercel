/**
 * AI Workspace 2.0 — Full-screen ChatGPT-style AI assistant
 *
 * Features:
 * - Persistent, account-synced conversation history (Supabase)
 * - Real AI chat via /api/workspace/chat (Gemini + MIND-AI gateway)
 * - Voice input (Web Speech API) + voice output (Speech Synthesis)
 * - File attachment with content extraction (TXT, MD, CSV, PDF text, code)
 * - Project context (named project with system prompt injection)
 * - Dark/light theme
 * - Fully keyboard accessible
 * - Mobile responsive
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from "react";
import {
  Plus,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  X,
  Trash2,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Copy,
  RefreshCw,
  Square,
  Loader2,
  AlertCircle,
  FileText,
  Code2,
  Sparkles,
  Bot,
  User,
  Settings,
  Sun,
  Moon,
  Lightbulb,
  MessageSquare,
  Play
} from "lucide-react";
import { MarkdownRenderer } from "../common/MarkdownRenderer";
import { supabase } from "../../supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkspaceConversation {
  id: string;
  title: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface WorkspaceMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: AttachedFile[];
  created_at: string;
  is_error?: boolean;
}

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  content: string; // extracted text content
}

interface WorkspaceProject {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
}

interface AIWorkspaceV2Props {
  userId: string | null;
  authToken: string | null;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  { icon: <Code2 className="h-4 w-4" />, text: "Explain how async/await works in JavaScript" },
  { icon: <Lightbulb className="h-4 w-4" />, text: "Give me a study plan for learning machine learning" },
  { icon: <FileText className="h-4 w-4" />, text: "Summarize the key concepts of thermodynamics" },
  { icon: <MessageSquare className="h-4 w-4" />, text: "Help me debug this Python function" },
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const SUPPORTED_TEXT_TYPES = [
  "text/plain", "text/markdown", "text/csv", "text/html",
  "application/json", "application/javascript", "text/javascript",
  "text/typescript", "text/x-python", "text/x-java",
  "application/pdf", "application/xml", "text/xml"
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AIWorkspaceV2({
  userId,
  authToken,
  theme,
  onToggleTheme
}: AIWorkspaceV2Props) {
  // ── Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // ── Conversation State
  const [conversations, setConversations] = useState<WorkspaceConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [convSearch, setConvSearch] = useState("");
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingConvTitle, setEditingConvTitle] = useState("");

  // ── Chat Input State
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // ── Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en-US");
  const [autoSpeak, setAutoSpeak] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ── File Attachment State
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Project State
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showProjectPanel, setShowProjectPanel] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  // ── Error State
  const [error, setError] = useState<string | null>(null);

  // ── Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const convTitleRef = useRef<HTMLInputElement>(null);

  // ─── Responsive Detection ────────────────────────────────────────────────────

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ─── Speech API Detection ────────────────────────────────────────────────────

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognition));
    setSpeechSupported(typeof window.speechSynthesis !== "undefined");
  }, []);

  // ─── Auto-scroll ──────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // ─── Load Conversations ───────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    if (!userId || !authToken) {
      setConversations([]);
      return;
    }
    setIsLoadingConvs(true);
    try {
      const { data, error: dbErr } = await supabase
        .from("workspace_conversations")
        .select("id, title, project_id, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(100);
      if (dbErr) throw dbErr;
      setConversations(data || []);
    } catch (err: any) {
      console.warn("Could not load workspace conversations:", err.message);
      // Fallback: try local storage
      try {
        const local = localStorage.getItem(`ws_convs_${userId}`);
        if (local) setConversations(JSON.parse(local));
      } catch {}
    } finally {
      setIsLoadingConvs(false);
    }
  }, [userId, authToken]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ─── Load Messages for a conversation ────────────────────────────────────────

  const loadMessages = useCallback(async (convId: string) => {
    if (!authToken) return;
    setIsLoadingMsgs(true);
    setMessages([]);
    try {
      const { data, error: dbErr } = await supabase
        .from("workspace_messages")
        .select("id, conversation_id, role, content, attachments, created_at, is_error")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (dbErr) throw dbErr;
      setMessages(
        (data || []).map((m: any) => ({
          ...m,
          attachments: m.attachments || []
        }))
      );
    } catch (err: any) {
      console.warn("Could not load messages:", err.message);
      // Try local fallback
      try {
        const local = localStorage.getItem(`ws_msgs_${convId}`);
        if (local) setMessages(JSON.parse(local));
      } catch {}
    } finally {
      setIsLoadingMsgs(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (activeConvId) loadMessages(activeConvId);
    else setMessages([]);
  }, [activeConvId, loadMessages]);

  // ─── Persist to local storage as fallback ────────────────────────────────────

  useEffect(() => {
    if (!userId || conversations.length === 0) return;
    try {
      localStorage.setItem(`ws_convs_${userId}`, JSON.stringify(conversations.slice(0, 50)));
    } catch {}
  }, [conversations, userId]);

  useEffect(() => {
    if (!activeConvId || messages.length === 0) return;
    try {
      localStorage.setItem(`ws_msgs_${activeConvId}`, JSON.stringify(messages.slice(-100)));
    } catch {}
  }, [messages, activeConvId]);

  // ─── Create Conversation ──────────────────────────────────────────────────────

  const createConversation = useCallback(async (firstUserMessage: string): Promise<string | null> => {
    if (!userId) return null;
    const title = firstUserMessage.slice(0, 60).trim() || "New conversation";
    const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();
    const newConv: WorkspaceConversation = {
      id,
      title,
      project_id: activeProjectId,
      created_at: now,
      updated_at: now
    };

    // Optimistic update
    setConversations(prev => [newConv, ...prev]);

    // Persist to Supabase
    try {
      const { data, error: dbErr } = await supabase
        .from("workspace_conversations")
        .insert({ id, user_id: userId, title, project_id: activeProjectId })
        .select()
        .single();
      if (dbErr) throw dbErr;
      return data.id;
    } catch (err: any) {
      console.warn("Supabase conversation insert failed, using local ID:", err.message);
      return id;
    }
  }, [userId, activeProjectId]);

  // ─── Save Message ──────────────────────────────────────────────────────────────

  const saveMessage = useCallback(async (
    convId: string,
    role: "user" | "assistant",
    content: string,
    attachmentsData?: AttachedFile[],
    isError?: boolean
  ): Promise<WorkspaceMessage> => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();
    const msg: WorkspaceMessage = {
      id,
      conversation_id: convId,
      role,
      content,
      attachments: attachmentsData || [],
      created_at: now,
      is_error: isError || false
    };

    // Optimistic add
    setMessages(prev => [...prev, msg]);

    // Update conversation updated_at
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, updated_at: now, title: c.title } : c)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    );

    // Persist to Supabase
    try {
      await supabase
        .from("workspace_messages")
        .insert({
          id,
          conversation_id: convId,
          role,
          content,
          attachments: attachmentsData || [],
          is_error: isError || false
        });

      await supabase
        .from("workspace_conversations")
        .update({ updated_at: now })
        .eq("id", convId);
    } catch (err: any) {
      console.warn("Supabase message persist failed:", err.message);
    }

    return msg;
  }, []);

  // ─── Send Chat Message ────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const userText = input.trim();
    if (!userText && attachments.length === 0) return;
    if (isSending) return;
    if (!authToken) {
      setError("Please sign in to use AI Workspace.");
      return;
    }

    setError(null);
    setInput("");
    setIsSending(true);

    // Determine or create conversation
    let convId = activeConvId;
    if (!convId) {
      convId = await createConversation(userText);
      if (!convId) {
        setError("Could not create conversation. Please try again.");
        setIsSending(false);
        return;
      }
      setActiveConvId(convId);
    }

    // Build user message content (include file content inline)
    let fullContent = userText;
    if (attachments.length > 0) {
      const fileContext = attachments
        .map(f => `\n\n---\n**Attached file: ${f.name}** (${formatBytes(f.size)})\n\`\`\`\n${f.content.slice(0, 8000)}\n\`\`\``)
        .join("");
      fullContent = userText + fileContext;
    }

    // Save user message
    await saveMessage(convId, "user", fullContent, attachments.length > 0 ? [...attachments] : []);
    setAttachments([]);

    // Build conversation history for context
    const historyForAPI = messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    // Get active project system prompt
    const activeProject = projects.find(p => p.id === activeProjectId);

    // Call backend
    const ctrl = new AbortController();
    setAbortController(ctrl);

    try {
      const res = await fetch("/api/workspace/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          message: fullContent,
          history: historyForAPI,
          project_context: activeProject
            ? { name: activeProject.name, system_prompt: activeProject.system_prompt }
            : null
        }),
        signal: ctrl.signal
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `AI request failed (HTTP ${res.status})`);
      }

      // Check for streaming response
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") || contentType.includes("text/plain")) {
        // Streaming path
        setIsStreaming(true);
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              // Handle SSE format
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") break;
                  try {
                    const parsed = JSON.parse(data);
                    const token = parsed.token || parsed.text || parsed.content || "";
                    accumulated += token;
                    setStreamingContent(accumulated);
                  } catch {
                    // Plain text chunk
                    accumulated += data;
                    setStreamingContent(accumulated);
                  }
                } else if (line && !line.startsWith(":")) {
                  accumulated += line;
                  setStreamingContent(accumulated);
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }

        setIsStreaming(false);
        setStreamingContent("");

        if (accumulated.trim()) {
          await saveMessage(convId, "assistant", accumulated);
          if (autoSpeak) speakText(accumulated);
        }
      } else {
        // Non-streaming JSON path
        const data = await res.json();
        const text = data.text || data.response || data.answer || data.content || "";
        if (!text.trim()) throw new Error("AI returned an empty response.");
        await saveMessage(convId, "assistant", text);
        if (autoSpeak) speakText(text);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User cancelled — save partial streaming content if any
        if (streamingContent.trim()) {
          await saveMessage(convId!, "assistant", streamingContent + "\n\n*(Generation stopped)*");
        }
        setIsStreaming(false);
        setStreamingContent("");
      } else {
        const errorMsg = err.message || "An error occurred. Please try again.";
        await saveMessage(convId!, "assistant", `**Error:** ${errorMsg}`, [], true);
      }
    } finally {
      setIsSending(false);
      setAbortController(null);
      inputRef.current?.focus();
    }
  }, [
    input, attachments, isSending, authToken, activeConvId,
    createConversation, saveMessage, messages, projects, activeProjectId,
    autoSpeak, streamingContent
  ]);

  // ─── Stop Generation ──────────────────────────────────────────────────────────

  const handleStop = useCallback(() => {
    abortController?.abort();
    setIsStreaming(false);
  }, [abortController]);

  // ─── Keyboard Handler ─────────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ─── Auto-resize Textarea ─────────────────────────────────────────────────────

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  }, [input]);

  // ─── File Attachment Handler ──────────────────────────────────────────────────

  const handleFileAttach = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFileError(null);
    setIsProcessingFile(true);

    const newAttachments: AttachedFile[] = [];

    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i];

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(`${file.name} exceeds the 5 MB limit.`);
        continue;
      }

      try {
        let content = "";

        if (file.type === "application/pdf") {
          // For PDF: read as text (basic extraction - extracts readable text)
          content = await extractPdfText(file);
        } else if (
          SUPPORTED_TEXT_TYPES.some(t => file.type.startsWith(t)) ||
          file.name.match(/\.(txt|md|csv|js|ts|py|java|cpp|c|h|json|xml|html|css|yaml|yml|toml|ini|sh|bash|rb|go|rs|kt|swift)$/i)
        ) {
          content = await readFileAsText(file);
        } else {
          setFileError(`${file.name}: Unsupported file type. Please attach text files, code, CSV, or PDF.`);
          continue;
        }

        newAttachments.push({
          name: file.name,
          type: file.type || "text/plain",
          size: file.size,
          content
        });
      } catch (err: any) {
        setFileError(`Could not read ${file.name}: ${err.message}`);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments].slice(0, 5));
    setIsProcessingFile(false);

    // Clear file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ─── Voice Input ──────────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = voiceLang;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((result: any) => result[0].transcript)
        .join("");
      setInput(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [voiceLang]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // ─── Voice Output ─────────────────────────────────────────────────────────────

  const speakText = useCallback((text: string) => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();

    // Strip markdown for cleaner speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[#*_`~>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim()
      .slice(0, 3000);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = voiceLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [speechSupported, voiceLang]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // ─── Conversation Actions ─────────────────────────────────────────────────────

  const handleNewChat = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
    setStreamingContent("");
    setAttachments([]);
    setError(null);
    if (isMobile) setIsSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isMobile]);

  const handleSelectConv = useCallback((convId: string) => {
    setActiveConvId(convId);
    setStreamingContent("");
    setError(null);
    if (isMobile) setIsSidebarOpen(false);
  }, [isMobile]);

  const handleDeleteConv = useCallback(async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;

    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }

    try {
      await supabase.from("workspace_messages").delete().eq("conversation_id", convId);
      await supabase.from("workspace_conversations").delete().eq("id", convId);
    } catch (err: any) {
      console.warn("Delete conversation error:", err.message);
    }
  }, [activeConvId]);

  const handleStartRenameConv = useCallback((conv: WorkspaceConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditingConvTitle(conv.title);
    setTimeout(() => convTitleRef.current?.focus(), 50);
  }, []);

  const handleSaveRename = useCallback(async (convId: string) => {
    const newTitle = editingConvTitle.trim();
    if (!newTitle) return;
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: newTitle } : c));
    setEditingConvId(null);
    try {
      await supabase.from("workspace_conversations").update({ title: newTitle }).eq("id", convId);
    } catch {}
  }, [editingConvTitle]);

  // ─── Copy Message ─────────────────────────────────────────────────────────────

  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const handleCopyMessage = useCallback((msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  }, []);

  // ─── Regenerate ───────────────────────────────────────────────────────────────

  const handleRegenerate = useCallback(async (msgId: string) => {
    if (!activeConvId || !authToken) return;
    // Find the last user message before this assistant message
    const msgIndex = messages.findIndex(m => m.id === msgId);
    if (msgIndex < 1) return;
    const userMsg = [...messages.slice(0, msgIndex)].reverse().find(m => m.role === "user");
    if (!userMsg) return;

    // Remove the assistant message
    setMessages(prev => prev.filter(m => m.id !== msgId));
    try {
      await supabase.from("workspace_messages").delete().eq("id", msgId);
    } catch {}

    // Re-inject user content as input and send
    setInput(userMsg.content);
    setTimeout(() => handleSend(), 100);
  }, [activeConvId, authToken, messages, handleSend]);

  // ─── Project Management ───────────────────────────────────────────────────────

  const handleCreateProject = useCallback(() => {
    if (!newProjectName.trim()) return;
    const project: WorkspaceProject = {
      id: `proj_${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDesc.trim(),
      system_prompt: newProjectDesc.trim()
        ? `You are a coding assistant helping with the "${newProjectName.trim()}" project. ${newProjectDesc.trim()}`
        : `You are an expert coding assistant helping with the "${newProjectName.trim()}" project.`
    };
    setProjects(prev => [...prev, project]);
    setActiveProjectId(project.id);
    setNewProjectName("");
    setNewProjectDesc("");
    setShowProjectPanel(false);
    // Persist to localStorage (no backend table needed for lightweight projects)
    try {
      const stored = JSON.parse(localStorage.getItem(`ws_projects_${userId}`) || "[]");
      localStorage.setItem(`ws_projects_${userId}`, JSON.stringify([...stored, project]));
    } catch {}
  }, [newProjectName, newProjectDesc, userId]);

  // Load projects from localStorage on mount
  useEffect(() => {
    if (!userId) return;
    try {
      const stored = JSON.parse(localStorage.getItem(`ws_projects_${userId}`) || "[]");
      if (Array.isArray(stored)) setProjects(stored);
    } catch {}
  }, [userId]);

  // ─── Filtered Conversations ───────────────────────────────────────────────────

  const filteredConvs = useMemo(() => {
    if (!convSearch.trim()) return conversations;
    const q = convSearch.toLowerCase();
    return conversations.filter(c => c.title.toLowerCase().includes(q));
  }, [conversations, convSearch]);

  // ─── Active Conversation ──────────────────────────────────────────────────────

  const activeConv = useMemo(
    () => conversations.find(c => c.id === activeConvId) || null,
    [conversations, activeConvId]
  );

  const activeProject = useMemo(
    () => projects.find(p => p.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`
          flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          transition-all duration-200 ease-in-out shrink-0 overflow-hidden
          ${isSidebarOpen ? "w-72" : "w-0"}
          ${isMobile ? "absolute top-0 left-0 h-full z-30 shadow-xl" : "relative"}
        `}
        aria-label="Conversation history"
      >
        {isSidebarOpen && (
          <div className="flex flex-col h-full min-w-[18rem]">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">AI Workspace</span>
              </div>
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* New Chat Button */}
            <div className="px-3 pb-2">
              <button
                type="button"
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </button>
            </div>

            {/* Project Selector */}
            <div className="px-3 pb-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Folder className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Active Project
                </span>
              </div>
              <div className="flex gap-1.5">
                <select
                  value={activeProjectId || ""}
                  onChange={e => setActiveProjectId(e.target.value || null)}
                  className="flex-1 text-xs rounded-lg px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                >
                  <option value="">General (no project)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowProjectPanel(!showProjectPanel)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Create new project"
                  aria-label="Create new project"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              </div>

              {showProjectPanel && (
                <div className="mt-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                  <input
                    type="text"
                    placeholder="Project name"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Description / context (optional)"
                    value={newProjectDesc}
                    onChange={e => setNewProjectDesc(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim()}
                    className="w-full text-xs py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition"
                  >
                    Create Project
                  </button>
                </div>
              )}
            </div>

            {/* Search Conversations */}
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search conversations…"
                  value={convSearch}
                  onChange={e => setConvSearch(e.target.value)}
                  className="flex-1 text-xs bg-transparent text-slate-700 dark:text-slate-300 placeholder-slate-400 focus-visible:outline-none"
                  aria-label="Search conversations"
                />
                {convSearch && (
                  <button type="button" onClick={() => setConvSearch("")} className="text-slate-400 hover:text-slate-600">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
              {isLoadingConvs ? (
                <div className="flex justify-center pt-6">
                  <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                </div>
              ) : !userId ? (
                <div className="text-center text-xs text-slate-400 pt-6 px-3">
                  Sign in to save conversation history across devices.
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="text-center text-xs text-slate-400 pt-6 px-3">
                  {convSearch ? "No matching conversations." : "No conversations yet. Start a new chat!"}
                </div>
              ) : (
                filteredConvs.map(conv => (
                  <div
                    key={conv.id}
                    className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition ${
                      activeConvId === conv.id
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                    onClick={() => handleSelectConv(conv.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && handleSelectConv(conv.id)}
                    aria-label={`Open conversation: ${conv.title}`}
                    aria-current={activeConvId === conv.id ? "true" : undefined}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />

                    {editingConvId === conv.id ? (
                      <input
                        ref={convTitleRef}
                        type="text"
                        value={editingConvTitle}
                        onChange={e => setEditingConvTitle(e.target.value)}
                        onBlur={() => handleSaveRename(conv.id)}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleSaveRename(conv.id);
                          if (e.key === "Escape") setEditingConvId(null);
                        }}
                        className="flex-1 text-xs bg-transparent border-b border-indigo-400 outline-none"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 text-xs truncate">{conv.title}</span>
                    )}

                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={e => handleStartRenameConv(conv, e)}
                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                        title="Rename"
                        aria-label="Rename conversation"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={e => handleDeleteConv(conv.id, e)}
                        className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600"
                        title="Delete"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ── Main Panel ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                {activeConv?.title || "AI Workspace"}
              </span>
              {activeProject && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold">
                  📁 {activeProject.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto-speak toggle */}
            {speechSupported && (
              <button
                type="button"
                onClick={() => setAutoSpeak(prev => !prev)}
                className={`p-1.5 rounded-lg transition ${
                  autoSpeak
                    ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title={autoSpeak ? "Auto-speak enabled" : "Enable auto-speak"}
                aria-label="Toggle auto-speak"
              >
                {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            )}

            {/* Theme toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4" role="log" aria-live="polite" aria-label="Chat messages">
          {!activeConvId && messages.length === 0 ? (
            /* Empty State Welcome */
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                AI Workspace
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                Ask anything, attach documents, work on coding projects, and get intelligent answers — all in one place.
              </p>

              {!authToken && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium">
                  ⚠️ Sign in to save your conversation history across devices.
                </div>
              )}

              {/* Suggested Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setInput(prompt.text);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition text-left text-xs text-slate-600 dark:text-slate-400 group"
                  >
                    <span className="text-indigo-500 mt-0.5 shrink-0 group-hover:text-indigo-600">
                      {prompt.icon}
                    </span>
                    <span>{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message List */
            <div className="max-w-3xl mx-auto space-y-5">
              {isLoadingMsgs ? (
                <div className="flex justify-center pt-8">
                  <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                </div>
              ) : (
                messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onCopy={handleCopyMessage}
                    onRegenerate={handleRegenerate}
                    onSpeak={speakText}
                    isCopied={copiedMsgId === msg.id}
                    speechSupported={speechSupported}
                    isSpeaking={isSpeaking}
                    onStopSpeaking={stopSpeaking}
                  />
                ))
              )}

              {/* Streaming indicator */}
              {isStreaming && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-800">
                    {streamingContent ? (
                      <MarkdownRenderer content={streamingContent} />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading (sending, not streaming) */}
              {isSending && !isStreaming && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* File Error Banner */}
        {fileError && (
          <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{fileError}</span>
            <button type="button" onClick={() => setFileError(null)} className="shrink-0 opacity-60 hover:opacity-100">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mx-4 mb-2 flex flex-wrap gap-2">
            {attachments.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs"
              >
                <FileText className="h-3 w-3 shrink-0" />
                <span className="max-w-[140px] truncate">{file.name}</span>
                <span className="opacity-60">({formatBytes(file.size)})</span>
                <button
                  type="button"
                  onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                  className="ml-0.5 opacity-60 hover:opacity-100"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Listening Banner */}
        {isListening && (
          <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-xs animate-pulse">
            <Mic className="h-3.5 w-3.5 shrink-0 text-red-500" />
            <span>Listening… speak now. Click the microphone button to stop.</span>
          </div>
        )}

        {/* Composer */}
        <div className="px-4 pb-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm focus-within:border-indigo-400 dark:focus-within:border-indigo-600 transition-colors">
              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? "Listening…"
                    : isSending
                    ? "Waiting for response…"
                    : "Ask anything… (Enter to send, Shift+Enter for newline)"
                }
                disabled={isSending}
                rows={1}
                className="w-full resize-none px-4 pt-3.5 pb-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus-visible:outline-none leading-relaxed"
                style={{ maxHeight: "200px", minHeight: "48px" }}
                aria-label="Chat input"
                aria-multiline="true"
              />

              {/* Action Row */}
              <div className="flex items-center justify-between px-3 pb-2">
                <div className="flex items-center gap-1">
                  {/* File Attach */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending || isProcessingFile}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40"
                    title="Attach file (TXT, MD, CSV, PDF, code)"
                    aria-label="Attach file"
                  >
                    {isProcessingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.md,.csv,.pdf,.json,.js,.ts,.py,.java,.cpp,.c,.h,.xml,.html,.css,.yaml,.yml,.sh,.rb,.go,.rs,.kt,.swift"
                    className="hidden"
                    onChange={e => handleFileAttach(e.target.files)}
                    aria-hidden="true"
                  />

                  {/* Voice Input */}
                  {voiceSupported ? (
                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      disabled={isSending}
                      className={`p-1.5 rounded-lg transition disabled:opacity-40 ${
                        isListening
                          ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 animate-pulse"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title={isListening ? "Stop recording" : "Voice input"}
                      aria-label={isListening ? "Stop voice recording" : "Start voice recording"}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      title="Voice input not supported in this browser"
                      aria-label="Voice input not supported"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  )}

                  {/* Stop Speaking */}
                  {isSpeaking && (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 transition"
                      title="Stop speaking"
                      aria-label="Stop AI voice output"
                    >
                      <VolumeX className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Character count hint */}
                  {input.length > 1000 && (
                    <span className="text-[11px] font-mono text-slate-400">
                      {input.length.toLocaleString()}
                    </span>
                  )}

                  {/* Stop / Send Button */}
                  {(isSending || isStreaming) ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      className="p-2 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition"
                      title="Stop generation"
                      aria-label="Stop AI response generation"
                    >
                      <Square className="h-4 w-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!input.trim() && attachments.length === 0}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      title="Send message (Enter)"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 mt-2">
              AI Workspace uses Gemini + MIND-AI. Responses may be inaccurate — verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble Component ──────────────────────────────────────────────────

interface MessageBubbleProps {
  key?: React.Key;
  message: WorkspaceMessage;
  onCopy: (msgId: string, content: string) => void;
  onRegenerate: (msgId: string) => void;
  onSpeak: (text: string) => void;
  isCopied: boolean;
  speechSupported: boolean;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

function MessageBubble({
  message,
  onCopy,
  onRegenerate,
  onSpeak,
  isCopied,
  speechSupported,
  isSpeaking,
  onStopSpeaking
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.is_error;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser
            ? "bg-emerald-600"
            : isError
            ? "bg-red-500"
            : "bg-indigo-600"
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-white" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-white" />
        )}
      </div>

      {/* Bubble */}
      <div className={`group flex flex-col max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
            isUser
              ? "bg-indigo-600 text-white rounded-tr-sm"
              : isError
              ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-tl-sm"
              : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <UserMessageContent content={message.content} attachments={message.attachments} />
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onCopy(message.id, message.content)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-[11px] flex items-center gap-1"
            title="Copy"
            aria-label="Copy message"
          >
            {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {isCopied ? <span className="text-emerald-500">Copied</span> : null}
          </button>

          {!isUser && speechSupported && (
            <button
              type="button"
              onClick={() => isSpeaking ? onStopSpeaking() : onSpeak(message.content)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
              aria-label={isSpeaking ? "Stop reading aloud" : "Read message aloud"}
            >
              {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </button>
          )}

          {!isUser && !isError && (
            <button
              type="button"
              onClick={() => onRegenerate(message.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Regenerate response"
              aria-label="Regenerate AI response"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── User Message Content (handles file attachments display) ──────────────────

function UserMessageContent({
  content,
  attachments
}: {
  content: string;
  attachments?: AttachedFile[];
}) {
  // Split off file content blocks from the user message for cleaner display
  const mainText = content.replace(/\n\n---\n\*\*Attached file:.*?```\n[\s\S]*?```/g, "").trim();

  return (
    <div>
      {mainText && <p className="whitespace-pre-wrap break-words">{mainText}</p>}
      {attachments && attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {attachments.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white/90"
            >
              <FileText className="h-3 w-3" />
              {f.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve((e.target?.result as string) || "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file, "UTF-8");
  });
}

async function extractPdfText(file: File): Promise<string> {
  // Read PDF bytes and extract readable text sequences
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder("latin1");
  const rawText = decoder.decode(bytes);

  // Extract text between BT (Begin Text) and ET (End Text) PDF operators
  const textBlocks: string[] = [];
  const btEtMatches = rawText.matchAll(/BT([\s\S]*?)ET/g);
  for (const match of btEtMatches) {
    // Extract content from Tj and TJ operators
    const block = match[1];
    const tjMatches = block.matchAll(/\(([^)]*)\)\s*Tj/g);
    for (const tj of tjMatches) {
      const text = tj[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\")
        .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
      if (text.trim()) textBlocks.push(text);
    }
    // Also capture TJ array content
    const tjArrayMatches = block.matchAll(/\[([^\]]*)\]\s*TJ/g);
    for (const tjArr of tjArrayMatches) {
      const parts = tjArr[1].matchAll(/\(([^)]*)\)/g);
      for (const part of parts) {
        if (part[1].trim()) textBlocks.push(part[1]);
      }
    }
  }

  const extracted = textBlocks.join(" ").replace(/\s+/g, " ").trim();
  if (extracted.length > 100) return extracted.slice(0, 30000);

  // Fallback: extract any printable ASCII text from the PDF
  const printableText = rawText
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `[PDF text extraction (basic)]:\n${printableText.slice(0, 20000)}`;
}
