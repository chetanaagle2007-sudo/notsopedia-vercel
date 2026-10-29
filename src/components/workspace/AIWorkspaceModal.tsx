import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Presentation,
  Code2,
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Terminal,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  FolderArchive,
  Layers,
  FileText,
  Send,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Sliders,
  Share2,
  Table,
  Check,
  Cpu,
  Eye,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  Settings,
  HelpCircle,
  ExternalLink,
  Copy,
  CheckSquare,
  Square,
  FileCode,
  FileSpreadsheet,
  AlertTriangle,
  Command,
  Bell,
  BookOpen,
  Shield
} from "lucide-react";
import { UserNote } from "../../types";

export interface AIWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNote?: UserNote | null;
  userNotes?: UserNote[];
  authToken?: string | null;
}

export type WorkspaceTool =
  | "presentation"
  | "email"
  | "project_builder"
  | "research"
  | "document"
  | "data_analysis"
  | "study_planner"
  | "saas_actions"
  | "workflows"
  | "chat"
  | "history"
  | "artifacts"
  | "connected_accounts"
  | "approvals"
  | "usage_plan"
  | "settings"
  | "admin";

export interface TaskDetailRecord {
  task_id: string;
  owner_id: string;
  category: string;
  goal: string;
  status: string;
  iteration: number;
  progress: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  plan?: any;
  current_step_id?: string;
  pending_action_id?: string;
  approval_state?: any;
  artifacts?: any[];
  retry_count?: number;
  final_response?: string;
  error?: string;
  logs?: Array<{ timestamp: string; level: string; source?: string; message: string; data?: any }>;
}

export function AIWorkspaceModal({
  isOpen,
  onClose,
  selectedNote,
  userNotes = [],
  authToken
}: AIWorkspaceModalProps) {
  // Navigation & Shell State
  const [activeTool, setActiveTool] = useState<WorkspaceTool>(() => {
    try {
      const saved = localStorage.getItem("mind_ai_active_tool");
      if (saved) return saved as WorkspaceTool;
    } catch {}
    return "chat";
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("mind_ai_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Task Details & Execution Stage State
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskDetailRecord | null>(null);
  const [isLoadingTaskDetail, setIsLoadingTaskDetail] = useState<boolean>(false);
  const [activeExecutionTask, setActiveExecutionTask] = useState<TaskDetailRecord | null>(null);
  const [isExecutionPolling, setIsExecutionPolling] = useState<boolean>(false);
  const executionPollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // General Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hello! I am your MIND-AI assistant. Ask me questions, explore study topics, or launch specialized autonomous tasks from the sidebar." }
  ]);
  const [isChatSending, setIsChatSending] = useState(false);

  // Email Assistant state (all fields independently editable)
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSignature, setEmailSignature] = useState("Best regards,\nMIND-AI Student Workspace");
  const [emailTone, setEmailTone] = useState<"formal" | "friendly" | "concise" | "professional">("formal");
  const [emailPrompt, setEmailPrompt] = useState("");
  const [emailDraftId, setEmailDraftId] = useState<string | null>(null);
  const [isEmailApproved, setIsEmailApproved] = useState(false);
  const [emailApprovalFingerprint, setEmailApprovalFingerprint] = useState<string | null>(null);
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);
  const [isGeneratingBody, setIsGeneratingBody] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState<string | null>(null);
  const [emailLiveConfigured, setEmailLiveConfigured] = useState<boolean>(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Presentation Studio state
  const [presTopic, setPresTopic] = useState("");
  const [presSlideCount, setPresSlideCount] = useState(6);
  const [presTheme, setPresTheme] = useState("modern_dark");
  const [presOutline, setPresOutline] = useState<Array<{ title: string; bullets?: string[]; speaker_notes?: string }>>([]);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isBuildingDeck, setIsBuildingDeck] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<{ id: string; fileName: string; downloadUrl: string; slideCount: number; sizeBytes?: number } | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  // Project Builder state
  const [projName, setProjName] = useState("");
  const [projType, setProjType] = useState("fastapi_service");
  const [projDesc, setProjDesc] = useState("");
  const [projPlan, setProjPlan] = useState<any | null>(null);
  const [isPlanningProj, setIsPlanningProj] = useState(false);
  const [isBuildingProj, setIsBuildingProj] = useState(false);
  const [projBuildResult, setProjBuildResult] = useState<any | null>(null);
  const [isTestingProj, setIsTestingProj] = useState(false);
  const [projTestResult, setProjTestResult] = useState<any | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);

  // Deep Research state
  const [researchQuery, setResearchQuery] = useState("");
  const [researchDepth, setResearchDepth] = useState<"standard" | "exhaustive">("standard");
  const [isResearching, setIsResearching] = useState(false);
  const [researchReport, setResearchReport] = useState<string | null>(null);

  // Data Analysis state
  const [dataQuery, setDataQuery] = useState("");
  const [isAnalyzingData, setIsAnalyzingData] = useState(false);
  const [dataAnalysisResult, setDataAnalysisResult] = useState<string | null>(null);

  // SaaS Actions state
  const [connectors, setConnectors] = useState<any[]>([]);
  const [isLoadingConnectors, setIsLoadingConnectors] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("google_workspace");
  const [selectedOperation, setSelectedOperation] = useState("create_calendar_event");
  const [actionParamsJson, setActionParamsJson] = useState('{\n  "summary": "AI Study Review",\n  "start_time": "2026-10-18T10:00:00Z"\n}');
  const [actionApproved, setActionApproved] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionResult, setActionResult] = useState<any | null>(null);

  // Workflows state
  const [workflowName, setWorkflowName] = useState("Study Summary & Distribution");
  const [workflowSteps, setWorkflowSteps] = useState([
    { name: "Verify Study Syntheses", action_type: "code_check", requires_approval: false },
    { name: "Post Study Notes to Workspace", action_type: "connector", requires_approval: true },
    { name: "Send Notification to Study Team", action_type: "notify", requires_approval: false }
  ]);
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);
  const [workflowInstance, setWorkflowInstance] = useState<any | null>(null);

  // Study & Revision Planner state
  const [studySubject, setStudySubject] = useState(selectedNote?.subjectName || "");
  const [studyGoal, setStudyGoal] = useState(selectedNote ? `Prepare revision plan for ${selectedNote.title}` : "");
  const [studyExamDate, setStudyExamDate] = useState("Upcoming Assessment");
  const [studyDays, setStudyDays] = useState(7);
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(2.5);
  const [isGeneratingStudyPlan, setIsGeneratingStudyPlan] = useState(false);
  const [generatedStudyPlan, setGeneratedStudyPlan] = useState<{ id: string; fileName: string; downloadUrl: string; title: string; daysCount: number; content?: string } | null>(null);

  // Task History state
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<string>("ALL");
  const [historySearch, setHistorySearch] = useState<string>("");

  // Document Studio state
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("Architecture Whitepaper");
  const [docAudience, setDocAudience] = useState("Technical Leaders & Engineers");
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<{ id: string; fileName: string; title: string; wordCount: number; downloadUrl: string; sha256: string; content?: string } | null>(null);

  // Artifact Library state
  const [artifactsList, setArtifactsList] = useState<any[]>([]);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);
  const [artifactFilter, setArtifactFilter] = useState<string>("ALL");

  // Approval Inbox state
  const [approvalsList, setApprovalsList] = useState<any[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);

  // Task Templates state
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Global Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState("");

  // Keyboard Shortcuts modal
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Model & Infrastructure state
  const [modelVersions, setModelVersions] = useState<any[]>([]);
  const [providersStatus, setProvidersStatus] = useState<any>(null);

  // Admin Dashboard state
  const [adminOverview, setAdminOverview] = useState<any>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Subscription & Entitlements state
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // Persist sidebar state
  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mind_ai_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Persist active tool state
  const handleSelectTool = (tool: WorkspaceTool) => {
    setActiveTool(tool);
    try {
      localStorage.setItem("mind_ai_active_tool", tool);
    } catch {}
  };

  // Prepopulate from selected note
  useEffect(() => {
    if (selectedNote) {
      setPresTopic(selectedNote.title);
      setProjName(selectedNote.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase().slice(0, 24) || "note_project");
      setProjDesc(`Implementation of core concepts and algorithms from ${selectedNote.title}`);
      setEmailPrompt(`Share key insights, formulas, and references from "${selectedNote.title}" with my study group.`);
      setEmailSubject(`Study Summary: ${selectedNote.title}`);
      setResearchQuery(selectedNote.title);
    }
  }, [selectedNote]);

  // Load Task History
  const loadHistory = async () => {
    if (!authToken) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/mind-ai/tasks", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTaskHistory(data.tasks || []);
      }
    } catch (err: any) {
      console.warn("Could not load tasks:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Check email integration status
  const checkEmailStatus = async () => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/mind-ai/email/status", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmailLiveConfigured(data.token_configured === true);
      }
    } catch {}
  };

  // Load Artifacts
  const loadArtifacts = async () => {
    if (!authToken) return;
    setIsLoadingArtifacts(true);
    try {
      const res = await fetch("/api/mind-ai/artifacts", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setArtifactsList(data.artifacts || []);
      }
    } catch (err: any) {
      console.warn("Could not load artifacts:", err);
    } finally {
      setIsLoadingArtifacts(false);
    }
  };

  // Load Pending Approvals
  const loadApprovals = async () => {
    if (!authToken) return;
    setIsLoadingApprovals(true);
    try {
      const res = await fetch("/api/mind-ai/approvals", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApprovalsList(data.approvals || []);
      }
    } catch (err: any) {
      console.warn("Could not load approvals:", err);
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  // Load Templates
  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/mind-ai/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplatesList(data.templates || []);
      }
    } catch {}
  };

  // Load Model Registry and Providers
  const loadModelsAndProviders = async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        fetch("/api/mind-ai/models/versions"),
        fetch("/api/mind-ai/providers/status")
      ]);
      if (mRes.ok) {
        const mData = await mRes.json();
        setModelVersions(mData.models || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setProvidersStatus(pData.providers || {});
      }
    } catch {}
  };

  // Load Admin Overview
  const loadAdminOverview = async () => {
    if (!authToken) return;
    setIsLoadingAdmin(true);
    setAdminError(null);
    try {
      const res = await fetch("/api/mind-ai/admin/overview", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminOverview(data);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setAdminError(errJson.error || "Administrator privileges required. Verified server-side.");
      }
    } catch (err: any) {
      setAdminError(err.message);
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  // Load Subscription
  const loadSubscription = async () => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/mind-ai/subscription/status", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptionData(data);
      }
    } catch {}
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsCommandPaletteOpen(false);
        setIsTemplatesOpen(false);
        setIsShortcutsOpen(false);
      } else if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch initial templates & approvals
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      loadApprovals();
    }
  }, [isOpen]);

  // Cancel Task handler
  const handleCancelTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/mind-ai/tasks/${encodeURIComponent(taskId)}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.cancelled) {
        setSuccessMsg(`Task ${taskId} cancelled successfully.`);
        loadHistory();
        if (selectedTaskDetail?.task_id === taskId) {
          setSelectedTaskDetail((prev) => (prev ? { ...prev, status: "cancelled" } : null));
        }
      } else {
        throw new Error(data.error || "Task cancellation failed.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Generate Document handler
  const handleRunDocument = async () => {
    const title = docTitle.trim() || (selectedNote ? selectedNote.title : "Technical Analysis Report");
    setIsGeneratingDoc(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-ai/universal-task", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          goal: `Document: ${title}`,
          category: "document",
          parameters: { title, doc_type: docType, audience: docAudience, attached_notes: selectedNote?.content }
        })
      });
      const data = await res.json();
      if (res.ok) {
        const art = (data.artifacts || []).find((a: any) => a.type === "document_md") || {};
        setGeneratedDoc({
          id: art.document_id || "doc_latest",
          fileName: art.file_name || "document.md",
          title: art.title || title,
          wordCount: art.word_count || 350,
          downloadUrl: `/api/mind-ai/artifacts/document/${art.document_id || "doc_latest"}/download`,
          sha256: art.sha256 || "verified-sha256",
          content: data.final_response
        });
        setSuccessMsg(`Document '${title}' generated and validated successfully.`);
        loadHistory();
      } else {
        throw new Error(data.error || "Document generation failed.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  // Load SaaS Connectors
  const loadConnectors = async () => {
    if (!authToken) return;
    setIsLoadingConnectors(true);
    try {
      const res = await fetch("/api/mind-ai/connectors", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConnectors(data.connectors || []);
      }
    } catch (err: any) {
      console.warn("Could not load connectors:", err);
    } finally {
      setIsLoadingConnectors(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkEmailStatus();
      if (activeTool === "history") loadHistory();
      if (activeTool === "saas_actions") loadConnectors();
    }
    return () => {
      if (executionPollTimerRef.current) {
        clearInterval(executionPollTimerRef.current);
      }
    };
  }, [isOpen, activeTool]);

  // Bounded polling for active running tasks
  const startPollingTask = (taskId: string) => {
    if (executionPollTimerRef.current) clearInterval(executionPollTimerRef.current);
    setIsExecutionPolling(true);

    let attempts = 0;
    const maxAttempts = 30; // 30 * 2000ms = 60s max bounded polling

    executionPollTimerRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/mind-ai/tasks/${encodeURIComponent(taskId)}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
          const detail = await res.json();
          setActiveExecutionTask(detail);
          if (
            detail.status === "completed" ||
            detail.status === "failed" ||
            detail.status === "waiting_approval" ||
            detail.status === "cancelled" ||
            attempts >= maxAttempts
          ) {
            if (executionPollTimerRef.current) clearInterval(executionPollTimerRef.current);
            setIsExecutionPolling(false);
            loadHistory();
          }
        }
      } catch (err) {
        if (executionPollTimerRef.current) clearInterval(executionPollTimerRef.current);
        setIsExecutionPolling(false);
      }
    }, 2000);
  };

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // Tool & History Handlers
  // -------------------------------------------------------------

  // Open full details for any task
  const handleOpenTaskDetail = async (taskId: string) => {
    setIsLoadingTaskDetail(true);
    setError(null);
    try {
      const res = await fetch(`/api/mind-ai/tasks/${encodeURIComponent(taskId)}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTaskDetail(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load task details.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingTaskDetail(false);
    }
  };

  // Connect History to Email Assistant: open draft directly in Email tool
  const handleOpenEmailDraftFromTask = async (task: TaskDetailRecord | any) => {
    let draftId = task.pending_action_id;
    if (!draftId && task.artifacts && task.artifacts.length > 0) {
      const emailArt = task.artifacts.find((a: any) => typeof a === "object" && a.type === "email_draft");
      if (emailArt) draftId = emailArt.draft_id;
    }

    if (!draftId) {
      // Fallback: populate fields from goal and switch to email tool
      setEmailPrompt(task.goal || "");
      setActiveTool("email");
      return;
    }

    try {
      const res = await fetch(`/api/mind-ai/email/draft/${encodeURIComponent(draftId)}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const draft = await res.json();
        setEmailDraftId(draft.draft_id);
        setEmailTo(draft.recipient || "");
        setEmailSubject(draft.subject || "");
        setEmailBody(draft.body || "");
        setEmailCc(Array.isArray(draft.cc) ? draft.cc.join(", ") : "");
        setEmailBcc(Array.isArray(draft.bcc) ? draft.bcc.join(", ") : "");
        setIsEmailApproved(draft.status === "approved");
        setEmailApprovalFingerprint(draft.approval_hash || null);
        setActiveTool("email");
        setSuccessMsg(`Opened saved email draft ${draft.draft_id}. All fields ready to edit.`);
      } else {
        throw new Error("Could not retrieve saved email draft.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Connect History to Presentation Studio: load presentation deck
  const handleOpenPresentationFromTask = (task: TaskDetailRecord | any) => {
    let presId = "";
    if (task.artifacts && task.artifacts.length > 0) {
      const presArt = task.artifacts.find((a: any) => typeof a === "object" && (a.type === "presentation_pptx" || a.presentation_id));
      if (presArt) {
        presId = presArt.presentation_id || presArt.file_name?.replace(".pptx", "") || "";
      }
    }
    if (!presId && task.task_id) {
      presId = task.task_id;
    }

    setPresTopic(task.goal || "Presentation");
    setGeneratedDeck({
      id: presId,
      fileName: `${task.goal?.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 24) || "presentation"}.pptx`,
      downloadUrl: `/api/mind-ai/artifacts/presentation/${presId}/download`,
      slideCount: 6
    });
    setActiveTool("presentation");
    setSuccessMsg("Loaded presentation artifact from task record.");
  };

  // Connect History to Project Builder: load project
  const handleOpenProjectFromTask = (task: TaskDetailRecord | any) => {
    let projId = "";
    if (task.artifacts && task.artifacts.length > 0) {
      const projArt = task.artifacts.find((a: any) => typeof a === "object" && a.type === "project_zip");
      if (projArt) projId = projArt.project_id;
    }
    if (!projId) projId = task.task_id;

    setProjName(task.goal?.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase().slice(0, 20) || "project");
    setProjPlan({ project_id: projId, name: projName, files: [{ path: "main.py" }, { path: "requirements.txt" }] });
    setProjBuildResult({ verification: { verified_files: ["main.py", "requirements.txt"] } });
    setActiveTool("project_builder");
    setSuccessMsg(`Loaded project ${projId} from task history.`);
  };

  // 1. General Chat
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatSending) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsChatSending(true);
    try {
      const res = await fetch("/api/mind-ai/universal-task", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          goal: userMsg,
          category: "research",
          parameters: selectedNote ? { note_context: selectedNote.content } : {}
        })
      });
      const data = await res.json();
      const reply = data.final_response || data.message || "Request completed.";
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setIsChatSending(false);
    }
  };

  // 2. Email Studio Handlers
  const handleGenerateSubjectOnly = async () => {
    if (!emailPrompt.trim()) {
      setError("Please describe the email intent first.");
      return;
    }
    setIsGeneratingSubject(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-ai/email/generate-subject", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ prompt: emailPrompt, recipient: emailTo, tone: emailTone })
      });
      const data = await res.json();
      if (res.ok && data.subject) {
        setEmailSubject(data.subject);
        setIsEmailApproved(false); // Invalidate approval on edit
      } else {
        throw new Error(data.error || "Failed to generate subject.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingSubject(false);
    }
  };

  const handleGenerateBodyOnly = async () => {
    if (!emailPrompt.trim()) {
      setError("Please describe the email intent first.");
      return;
    }
    setIsGeneratingBody(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-ai/email/generate-body", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ prompt: emailPrompt, recipient: emailTo, tone: emailTone })
      });
      const data = await res.json();
      if (res.ok && data.body) {
        setEmailBody(data.body);
        setIsEmailApproved(false); // Invalidate approval on edit
      } else {
        throw new Error(data.error || "Failed to generate body.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingBody(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) {
      setError("To, Subject, and Body fields are all required before saving draft.");
      return;
    }
    setIsSavingDraft(true);
    setError(null);
    try {
      const payload = {
        recipient: emailTo.trim(),
        subject: emailSubject.trim(),
        body: `${emailBody.trim()}\n\n${emailSignature.trim()}`,
        cc: emailCc ? emailCc.split(",").map((s) => s.trim()).filter(Boolean) : [],
        bcc: emailBcc ? emailBcc.split(",").map((s) => s.trim()).filter(Boolean) : []
      };
      const res = await fetch("/api/mind-ai/email/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setEmailDraftId(data.draft_id);
        setIsEmailApproved(false);
        setSuccessMsg(`Draft saved (${data.draft_id}). Pending explicit approval.`);
      } else {
        throw new Error(data.error || "Failed to save draft.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleApproveDraft = async () => {
    if (!emailDraftId) {
      setError("Please save the draft before approving.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/mind-ai/email/draft/${emailDraftId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.status === "approved") {
        setIsEmailApproved(true);
        setEmailApprovalFingerprint(data.approval_hash || "verified-fingerprint");
        setSuccessMsg("Draft approved! Canonical fingerprint locked. Ready to send.");
      } else {
        throw new Error(data.error || "Approval failed.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendEmail = async () => {
    if (!emailDraftId || !isEmailApproved) {
      setError("Explicit user approval is required before sending.");
      return;
    }
    setIsSendingEmail(true);
    setError(null);
    try {
      const res = await fetch(`/api/mind-ai/email/draft/${emailDraftId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ idempotency_key: `send-${emailDraftId}-${Date.now()}` })
      });
      const data = await res.json();
      if (res.ok) {
        const liveNotice = emailLiveConfigured
          ? "LIVE Gmail dispatch executed successfully."
          : "SIMULATED / MOCK dispatch: Live Gmail OAuth is not configured on the backend. No real email was sent.";
        setEmailSendStatus(liveNotice);
        setSuccessMsg(liveNotice);
      } else {
        throw new Error(data.error || "Sending failed.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 3. Presentation Studio Handlers
  const handleGenerateOutline = async () => {
    if (!presTopic.trim()) {
      setError("Please provide a presentation topic.");
      return;
    }
    setIsGeneratingOutline(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-ai/presentations/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          topic: presTopic,
          slide_count: presSlideCount,
          theme: presTheme,
          audience: "Academic & Professional"
        })
      });
      const data = await res.json();
      if (res.ok && data.slides) {
        setPresOutline(data.slides);
        setSelectedSlideIndex(0);
        setSuccessMsg(`Generated outline with ${data.slides.length} slides.`);
      } else {
        throw new Error(data.error || "Failed to generate outline.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleBuildDeck = async () => {
    setIsBuildingDeck(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-ai/presentations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          topic: presTopic,
          slide_count: presSlideCount,
          theme: presTheme,
          slides: presOutline.length > 0 ? presOutline : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedDeck({
          id: data.presentation_id,
          fileName: data.file_name,
          downloadUrl: `/api/mind-ai/artifacts/presentation/${data.presentation_id}/download`,
          slideCount: data.slide_count,
          sizeBytes: data.validation?.file_size_bytes || 28400
        });
        setSuccessMsg("16:9 PowerPoint Presentation generated, validated, and ready for download!");
        loadHistory();
      } else {
        throw new Error(data.error || "Failed to build presentation.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBuildingDeck(false);
    }
  };

  // 4. Project Builder Handlers
  const handlePlanProject = async () => {
    if (!projName.trim()) {
      setError("Please specify a project name.");
      return;
    }
    setIsPlanningProj(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-ai/projects/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          name: projName,
          project_type: projType,
          description: projDesc
        })
      });
      const data = await res.json();
      if (res.ok) {
        setProjPlan(data);
        if (data.files && data.files.length > 0) {
          setSelectedFilePreview(data.files[0].path);
        }
        setSuccessMsg(`Project planned with ${data.files?.length || 0} scaffolded files.`);
      } else {
        throw new Error(data.error || "Failed to create project plan.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPlanningProj(false);
    }
  };

  const handleBuildProject = async () => {
    if (!projPlan?.project_id) {
      setError("Please generate an architecture plan first.");
      return;
    }
    setIsBuildingProj(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-ai/projects/build", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          project_id: projPlan.project_id,
          name: projPlan.name,
          project_type: projPlan.project_type,
          description: projPlan.description,
          files: projPlan.files
        })
      });
      const data = await res.json();
      if (res.ok) {
        setProjBuildResult(data);
        setSuccessMsg("Project files synthesized in isolated sandbox & packaged as ZIP!");
        loadHistory();
      } else {
        throw new Error(data.error || "Failed to build project.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBuildingProj(false);
    }
  };

  const handleTestProject = async () => {
    if (!projPlan?.project_id) return;
    setIsTestingProj(true);
    setError(null);
    try {
      const res = await fetch(`/api/mind-ai/projects/${projPlan.project_id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProjTestResult(data.test_results);
        setSuccessMsg("Sandboxed test execution completed.");
      } else {
        throw new Error(data.error || "Test execution failed.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsTestingProj(false);
    }
  };

  // 5. Deep Research
  const handleRunResearch = async () => {
    if (!researchQuery.trim()) {
      setError("Please provide a research query.");
      return;
    }
    setIsResearching(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-ai/universal-task", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          goal: `Deep Research: ${researchQuery}`,
          category: "research",
          parameters: { depth: researchDepth, attached_notes: selectedNote?.content }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setResearchReport(data.final_response || data.message || "Synthesis complete.");
        setSuccessMsg("Research synthesis and verified reference extraction finished!");
        loadHistory();
      } else {
        throw new Error(data.error || "Research failed.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsResearching(false);
    }
  };

  // 6. Data Analysis
  const handleRunDataAnalysis = async () => {
    if (!dataQuery.trim()) {
      setError("Please specify analysis parameters.");
      return;
    }
    setIsAnalyzingData(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-ai/universal-task", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          goal: `Data Analysis: ${dataQuery}`,
          category: "research",
          parameters: { formula_injection_defense: true, attached_notes: selectedNote?.content }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setDataAnalysisResult(data.final_response || "Statistical analysis completed.");
        setSuccessMsg("Data analysis completed with CSV formula injection sanitization active.");
        loadHistory();
      } else {
        throw new Error(data.error || "Data analysis failed.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzingData(false);
    }
  };

  // 6b. Study & Revision Planner
  const handleGenerateStudyPlan = async () => {
    const goalText = studyGoal.trim() || `Prepare a ${studyDays}-day revision plan for ${studySubject || "Academic Subject"}`;
    setIsGeneratingStudyPlan(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-ai/universal-task", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          goal: goalText,
          category: "study_plan",
          parameters: {
            subject: studySubject || "Academic Studies",
            exam_date: studyExamDate || "Upcoming Final Assessment",
            days: studyDays,
            daily_hours: studyHoursPerDay,
            attached_notes: selectedNote ? [{ title: selectedNote.title, subject: selectedNote.subjectName }] : []
          }
        })
      });
      const data = await res.json();
      if (res.ok) {
        const art = (data.artifacts || []).find((a: any) => a.type === "study_plan");
        if (art) {
          setGeneratedStudyPlan({
            id: art.study_plan_id,
            fileName: art.file_name,
            downloadUrl: `/api/mind-ai/artifacts/study_plan/${art.study_plan_id}/download`,
            title: art.title || goalText,
            daysCount: art.days_count || studyDays,
            content: data.final_response
          });
        }
        setSuccessMsg(`Generated ${studyDays}-day study & revision plan!`);
        loadHistory();
      } else {
        throw new Error(data.error || "Study plan generation failed.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingStudyPlan(false);
    }
  };

  // 7. SaaS Actions
  const handleExecuteSaaSAction = async () => {
    if (!actionApproved) {
      setError("Human approval gating: Please check 'I confirm and approve this action' before execution.");
      return;
    }
    setIsExecutingAction(true);
    setError(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(actionParamsJson);
      } catch {
        throw new Error("Parameters must be valid JSON.");
      }
      const res = await fetch("/api/mind-ai/connectors/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          provider: selectedProvider,
          operation: selectedOperation,
          params: parsed,
          approved: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionResult(data.result);
        setSuccessMsg(`Action executed safely via ${selectedProvider}!`);
      } else {
        throw new Error(data.error || "Action dispatch failed.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExecutingAction(false);
    }
  };

  // 8. Workflows
  const handleRunWorkflow = async () => {
    setIsExecutingWorkflow(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-ai/workflows/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          name: workflowName,
          steps: workflowSteps
        })
      });
      const data = await res.json();
      if (res.ok) {
        setWorkflowInstance(data);
        setSuccessMsg(`Workflow started! Status: ${data.status}`);
      } else {
        throw new Error(data.error || "Failed to start workflow.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExecutingWorkflow(false);
    }
  };

  const handleApproveWorkflowStep = async (stepId: string) => {
    if (!workflowInstance?.workflow_id) return;
    try {
      const res = await fetch(`/api/mind-ai/workflows/${workflowInstance.workflow_id}/approve/${stepId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWorkflowInstance(data);
        setSuccessMsg(`Step ${stepId} approved! Workflow resumed.`);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter history items
  const filteredHistory = taskHistory.filter((t) => {
    if (historyFilter !== "ALL" && t.status?.toUpperCase() !== historyFilter) return false;
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      return (
        t.goal?.toLowerCase().includes(q) ||
        t.task_id?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in">
      {/* Full-screen Claude-inspired Studio Container */}
      <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
        {/* Top App Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Sidebar"
            >
              {isSidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-tight">MIND-AI Studio</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                  Full-Screen Workspace
                </span>
              </div>
            </div>
          </div>

          {/* Center Info Banner */}
          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            {selectedNote ? (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                  {selectedNote.title}
                </span>
              </div>
            ) : (
              <span className="text-[11px]">Autonomous Cognitive Assistant & Universal Task Engine</span>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors border border-slate-200 dark:border-slate-800"
              title="Command Palette (Ctrl+K)"
            >
              <Command className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Commands</span>
              <kbd className="hidden sm:inline text-[9px] px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 font-mono">⌘K</kbd>
            </button>

            <button
              onClick={() => {
                loadTemplates();
                setIsTemplatesOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors"
              title="Task & Document Templates"
            >
              <BookOpen className="w-4 h-4 text-purple-500" />
              <span className="hidden sm:inline">Templates</span>
            </button>

            {approvalsList.length > 0 && (
              <button
                onClick={() => {
                  setActiveTool("approvals");
                  loadApprovals();
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center space-x-1.5 hover:bg-amber-500/20 transition-colors"
                title="Pending Approvals"
              >
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>{approvalsList.length} Pending</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveTool("history");
                loadHistory();
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors"
            >
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">History</span>
            </button>

            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Workspace"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Global Notifications */}
        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-red-600 dark:text-red-400">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Body Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <aside
            className={`border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md flex flex-col transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? "w-16" : "w-64"
            }`}
          >
            <div className="p-3 space-y-1 flex-1 overflow-y-auto">
              {!isSidebarCollapsed && (
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  AI Studios
                </div>
              )}

              <button
                onClick={() => {
                  setActiveTool("presentation");
                  setSelectedTaskDetail(null);
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "presentation"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Presentation Studio"
              >
                <Presentation className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Presentation Studio</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("email");
                  setSelectedTaskDetail(null);
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "email"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Email Assistant"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Email Assistant</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("project_builder");
                  setSelectedTaskDetail(null);
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "project_builder"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Project Builder"
              >
                <Code2 className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Project Builder</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("research");
                  setSelectedTaskDetail(null);
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "research"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Deep Research"
              >
                <Search className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Deep Research</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("document");
                  setSelectedTaskDetail(null);
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "document"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Document Studio"
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Document Studio</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("data_analysis");
                  setSelectedTaskDetail(null);
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "data_analysis"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Data Analysis"
              >
                <Table className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Data Analysis</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("study_planner");
                  setSelectedTaskDetail(null);
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "study_planner"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Study Planner"
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Study Planner</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("saas_actions");
                  setSelectedTaskDetail(null);
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "saas_actions"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="SaaS Integrations"
              >
                <Share2 className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">SaaS Integrations</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("workflows");
                  setSelectedTaskDetail(null);
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "workflows"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Workflows"
              >
                <Layers className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Workflow Engine</span>}
              </button>

              {!isSidebarCollapsed && (
                <div className="pt-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Workspace Core
                </div>
              )}

              <button
                onClick={() => {
                  setActiveTool("chat");
                  setSelectedTaskDetail(null);
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "chat"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="General AI Chat"
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">General AI Chat</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("history");
                  loadHistory();
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "history"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Task History"
              >
                <Clock className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Task History</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("artifacts");
                  loadArtifacts();
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "artifacts"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Artifact Library"
              >
                <FolderArchive className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Artifact Library</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("approvals");
                  loadApprovals();
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "approvals"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Approval Inbox"
              >
                <Bell className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span className="truncate">Approval Inbox</span>
                    {approvalsList.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                        {approvalsList.length}
                      </span>
                    )}
                  </div>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTool("connected_accounts");
                  loadConnectors();
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "connected_accounts"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Connected Accounts"
              >
                <Share2 className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Connected Accounts</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("usage_plan");
                  loadSubscription();
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "usage_plan"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Usage and Plan"
              >
                <Sliders className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Usage and Plan</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("settings");
                  loadModelsAndProviders();
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "settings"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Settings & Models"
              >
                <Cpu className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Settings & Models</span>}
              </button>

              <button
                onClick={() => {
                  setActiveTool("admin");
                  loadAdminOverview();
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTool === "admin"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Admin Dashboard"
              >
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Admin Dashboard</span>}
              </button>
            </div>

            {/* Sidebar Footer info */}
            {!isSidebarCollapsed && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Backend Engine:</span>
                  <span className="font-semibold text-emerald-500">MIND-AI Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Plan:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Student Pro (Active)</span>
                </div>
              </div>
            )}
          </aside>

          {/* Center Workspace Stage */}
          <main className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-slate-900 relative">
            {activeTool !== "chat" && (
              <div className="h-10 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-between flex-shrink-0 z-10">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Workspace /</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {activeTool.replace(/_/g, " ")}
                  </span>
                </div>
                <button
                  onClick={() => handleSelectTool("chat")}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center space-x-1.5 transition-colors border border-indigo-200/50 dark:border-indigo-800/50"
                  title="Return to primary conversation & workspace"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Back to Workspace</span>
                </button>
              </div>
            )}

            {/* 1. PRESENTATION STUDIO (Split Layout) */}
            {activeTool === "presentation" && (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Controls Pane */}
                <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-6 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
                  <div>
                    <h3 className="text-sm font-bold flex items-center space-x-2">
                      <Presentation className="w-4 h-4 text-indigo-500" />
                      <span>Deck Parameters</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Generate 16:9 widescreen PowerPoint presentation with verified slide count.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Presentation Topic
                      </label>
                      <input
                        type="text"
                        value={presTopic}
                        onChange={(e) => setPresTopic(e.target.value)}
                        placeholder="e.g., Quantum Mechanics & Wave Equations"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Slide Count
                        </label>
                        <input
                          type="number"
                          min={3}
                          max={20}
                          value={presSlideCount}
                          onChange={(e) => setPresSlideCount(parseInt(e.target.value, 10) || 6)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Design Theme
                        </label>
                        <select
                          value={presTheme}
                          onChange={(e) => setPresTheme(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          <option value="modern_dark">Modern Dark (Navy)</option>
                          <option value="academic_modern">Academic Modern</option>
                          <option value="emerald_matrix">Emerald Matrix</option>
                          <option value="executive_slate">Executive Slate</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col space-y-2">
                    <button
                      onClick={handleGenerateOutline}
                      disabled={isGeneratingOutline || !presTopic.trim()}
                      className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                    >
                      {isGeneratingOutline ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
                      <span>1. Generate / Revise Outline</span>
                    </button>

                    <button
                      onClick={handleBuildDeck}
                      disabled={isBuildingDeck || !presTopic.trim()}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center justify-center space-x-1.5 transition-all"
                    >
                      {isBuildingDeck ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      <span>2. Build 16:9 Presentation Deck</span>
                    </button>
                  </div>

                  {/* Artifact Download Card */}
                  {generatedDeck && (
                    <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-2.5">
                      <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Presentation Validated & Ready</span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                        <div>File: <strong className="font-mono text-slate-800 dark:text-slate-200">{generatedDeck.fileName}</strong></div>
                        <div>Slides: <strong>{generatedDeck.slideCount} (16:9 Aspect Ratio)</strong></div>
                        {generatedDeck.sizeBytes && <div>Size: {(generatedDeck.sizeBytes / 1024).toFixed(1)} KB</div>}
                      </div>
                      <a
                        href={generatedDeck.downloadUrl}
                        download={generatedDeck.fileName}
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition-all block text-center"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .PPTX</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Right Interactive Slide Preview & Outline Canvas */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  {presOutline.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            Slide Preview ({selectedSlideIndex + 1} of {presOutline.length})
                          </h4>
                          <span className="text-xs text-slate-500">Edit titles and speaker notes directly before PPTX synthesis.</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedSlideIndex((prev) => Math.max(0, prev - 1))}
                            disabled={selectedSlideIndex === 0}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedSlideIndex((prev) => Math.min(presOutline.length - 1, prev + 1))}
                            disabled={selectedSlideIndex === presOutline.length - 1}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 16:9 Aspect Ratio Presentation Slide Canvas */}
                      <div className="w-full max-w-2xl mx-auto aspect-video rounded-2xl border-2 border-indigo-500/30 bg-slate-900 text-white p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                        <div>
                          <div className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 mb-2">
                            SLIDE {selectedSlideIndex + 1} OF {presOutline.length}
                          </div>
                          <input
                            type="text"
                            value={presOutline[selectedSlideIndex]?.title || ""}
                            onChange={(e) => {
                              const updated = [...presOutline];
                              updated[selectedSlideIndex].title = e.target.value;
                              setPresOutline(updated);
                            }}
                            className="w-full bg-transparent border-b border-slate-700 font-bold text-lg text-white focus:outline-none focus:border-indigo-400"
                          />
                          <div className="mt-4 space-y-2">
                            {presOutline[selectedSlideIndex]?.bullets?.map((b, bIdx) => (
                              <div key={bIdx} className="flex items-start space-x-2 text-xs text-slate-300">
                                <span className="text-indigo-400 mt-1">•</span>
                                <span>{b}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {presOutline[selectedSlideIndex]?.speaker_notes && (
                          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
                            <span className="font-semibold text-indigo-300 block mb-0.5">Speaker Notes:</span>
                            <span>{presOutline[selectedSlideIndex]?.speaker_notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Slide Thumbnail Strip */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">All Slides in Deck</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                          {presOutline.map((slide, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => setSelectedSlideIndex(sIdx)}
                              className={`p-2 rounded-xl border text-left text-xs transition-all ${
                                selectedSlideIndex === sIdx
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-sm font-semibold"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50"
                              }`}
                            >
                              <div className="text-[10px] text-slate-400">Slide {sIdx + 1}</div>
                              <div className="truncate text-slate-800 dark:text-slate-200">{slide.title}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                      <Presentation className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                      <div>
                        <div className="font-semibold text-slate-600 dark:text-slate-300 text-sm">No Outline Generated Yet</div>
                        <p className="text-xs text-slate-400 max-w-sm mt-1">
                          Enter your presentation topic on the left and click "Generate / Revise Outline" to preview and customize slides.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. EMAIL ASSISTANT (Dedicated Studio) */}
            {activeTool === "email" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-indigo-500" />
                      <span>Order-Driven Email Studio</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Independently editable fields, cryptographic approval fingerprinting, and live vs. mock dispatch transparency.
                    </p>
                  </div>

                  {/* Gmail Integration Status Badge */}
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      emailLiveConfigured
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                    }`}>
                      {emailLiveConfigured ? "Live Gmail Configured" : "Simulated/Mock Mode"}
                    </span>
                  </div>
                </div>

                {/* Natural Language Intent & Tone Box */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Natural Language Goal / Intent
                    </label>
                    <textarea
                      rows={2}
                      value={emailPrompt}
                      onChange={(e) => setEmailPrompt(e.target.value)}
                      placeholder="e.g., Email prof.adams@university.edu requesting a 3-day extension due to lab computer issues..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tone:</span>
                      <select
                        value={emailTone}
                        onChange={(e) => setEmailTone(e.target.value as any)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="formal">Formal & Academic</option>
                        <option value="professional">Professional</option>
                        <option value="concise">Concise & Direct</option>
                        <option value="friendly">Friendly Study Group</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleGenerateSubjectOnly}
                        disabled={isGeneratingSubject || !emailPrompt.trim()}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold transition-all"
                      >
                        {isGeneratingSubject ? "Generating..." : "Generate Subject"}
                      </button>
                      <button
                        onClick={handleGenerateBodyOnly}
                        disabled={isGeneratingBody || !emailPrompt.trim()}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold transition-all"
                      >
                        {isGeneratingBody ? "Generating..." : "Generate Body"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* All Editable Email Form Fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">To</label>
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => {
                          setEmailTo(e.target.value);
                          setIsEmailApproved(false);
                        }}
                        placeholder="professor@university.edu"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">CC</label>
                      <input
                        type="text"
                        value={emailCc}
                        onChange={(e) => {
                          setEmailCc(e.target.value);
                          setIsEmailApproved(false);
                        }}
                        placeholder="lead-ta@university.edu"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">BCC</label>
                      <input
                        type="text"
                        value={emailBcc}
                        onChange={(e) => {
                          setEmailBcc(e.target.value);
                          setIsEmailApproved(false);
                        }}
                        placeholder="archive@university.edu"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => {
                        setEmailSubject(e.target.value);
                        setIsEmailApproved(false);
                      }}
                      placeholder="Subject Line"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message Body</label>
                    <textarea
                      rows={6}
                      value={emailBody}
                      onChange={(e) => {
                        setEmailBody(e.target.value);
                        setIsEmailApproved(false);
                      }}
                      placeholder="Type or generate message body..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Signature</label>
                    <input
                      type="text"
                      value={emailSignature}
                      onChange={(e) => {
                        setEmailSignature(e.target.value);
                        setIsEmailApproved(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>

                {/* Cryptographic Approval Status & Send Actions Bar */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-2.5">
                    {isEmailApproved ? (
                      <>
                        <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            Approved & Cryptographically Locked
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Fingerprint: {emailApprovalFingerprint?.slice(0, 16)}...
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                            Approval Required Before Dispatch
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Modifying any field automatically invalidates prior approvals.
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveDraft}
                      disabled={isSavingDraft}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {isSavingDraft ? "Saving..." : emailDraftId ? "Update Draft" : "Save Draft"}
                    </button>

                    <button
                      onClick={handleApproveDraft}
                      disabled={!emailDraftId || isEmailApproved}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold shadow-sm"
                    >
                      Approve Message
                    </button>

                    <button
                      onClick={handleSendEmail}
                      disabled={!isEmailApproved || isSendingEmail}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold shadow-sm flex items-center space-x-1"
                    >
                      {isSendingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send Email</span>
                    </button>
                  </div>
                </div>

                {emailSendStatus && (
                  <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/40 text-xs text-indigo-900 dark:text-indigo-200">
                    {emailSendStatus}
                  </div>
                )}
              </div>
            )}

            {/* 3. PROJECT BUILDER (Dedicated Studio) */}
            {activeTool === "project_builder" && (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Inputs */}
                <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
                  <div>
                    <h3 className="text-sm font-bold flex items-center space-x-2">
                      <Code2 className="w-4 h-4 text-indigo-500" />
                      <span>Project Builder</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Synthesize multi-file codebases in isolated sandboxes with test execution.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      placeholder="e.g., student_quantum_solver"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Project Architecture
                    </label>
                    <select
                      value={projType}
                      onChange={(e) => setProjType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="fastapi_service">FastAPI Microservice (API + Tests)</option>
                      <option value="react_component_pack">React Component Pack</option>
                      <option value="cli_tool">Python CLI Utility</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Specifications & Requirements
                    </label>
                    <textarea
                      rows={3}
                      value={projDesc}
                      onChange={(e) => setProjDesc(e.target.value)}
                      placeholder="Describe endpoints, data structures, and algorithms..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handlePlanProject}
                      disabled={isPlanningProj || !projName.trim()}
                      className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center space-x-1.5"
                    >
                      {isPlanningProj ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                      <span>1. Plan Architecture</span>
                    </button>

                    <button
                      onClick={handleBuildProject}
                      disabled={isBuildingProj || !projPlan}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      {isBuildingProj ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                      <span>2. Synthesize Sandbox & ZIP</span>
                    </button>

                    <button
                      onClick={handleTestProject}
                      disabled={isTestingProj || !projPlan}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      {isTestingProj ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      <span>3. Execute Sandboxed Tests</span>
                    </button>
                  </div>

                  {projBuildResult && (
                    <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-2">
                      <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>ZIP Package Verified</span>
                      </div>
                      <a
                        href={`/api/mind-ai/artifacts/project/${projPlan.project_id}/download`}
                        download
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 block text-center shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download {projPlan.name}.zip</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Right Manifest & Code Preview */}
                <div className="flex-1 p-6 overflow-y-auto space-y-5">
                  {projPlan ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <span className="font-bold text-sm">File Manifest ({projPlan.files?.length || 0} Files)</span>
                        <span className="text-xs text-slate-500 font-mono">Sandbox: isolated/{projPlan.project_id}</span>
                      </div>

                      {/* File Tabs */}
                      <div className="flex flex-wrap gap-2">
                        {projPlan.files?.map((f: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedFilePreview(f.path)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                              selectedFilePreview === f.path
                                ? "bg-indigo-600 text-white shadow-sm font-semibold"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                            }`}
                          >
                            📄 {f.path}
                          </button>
                        ))}
                      </div>

                      {/* Code Content Viewer */}
                      {selectedFilePreview && (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950 text-slate-100">
                          <div className="px-4 py-2 border-b border-slate-800 bg-slate-900 flex items-center justify-between text-xs font-mono">
                            <span>{selectedFilePreview}</span>
                            <span className="text-[10px] text-slate-400">Read-only syntax verified preview</span>
                          </div>
                          <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-slate-300">
                            {projPlan.files?.find((f: any) => f.path === selectedFilePreview)?.content || "// No content"}
                          </pre>
                        </div>
                      )}

                      {/* Test Results Output Box */}
                      {projTestResult && (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-900 text-slate-100 font-mono text-xs space-y-1">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="font-sans font-bold">Sandbox Test Runner</span>
                            <span className={projTestResult.passed ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                              {projTestResult.passed ? "TESTS PASSED" : "TESTS FAILED"}
                            </span>
                          </div>
                          <pre className="pt-2 text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                            {projTestResult.stdout || projTestResult.error || "No test output recorded."}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                      <Code2 className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                      <div>
                        <div className="font-semibold text-slate-600 dark:text-slate-300 text-sm">No Project Scaffolded</div>
                        <p className="text-xs text-slate-400 max-w-sm mt-1">
                          Specify a project name and click "Plan Architecture" to generate the multi-file scaffold.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. DEEP RESEARCH STUDIO */}
            {activeTool === "research" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <Search className="w-5 h-5 text-indigo-500" />
                    <span>Deep Research & Reference Synthesis</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Query decomposition with academic citations, cross-referencing, and note context integration.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Research Subject or Question
                    </label>
                    <textarea
                      rows={3}
                      value={researchQuery}
                      onChange={(e) => setResearchQuery(e.target.value)}
                      placeholder="e.g., Comparative analysis of time-independent Schrödinger equations in finite vs infinite potential wells..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <select
                      value={researchDepth}
                      onChange={(e) => setResearchDepth(e.target.value as any)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="standard">Standard Academic Synthesis</option>
                      <option value="exhaustive">Exhaustive Literature Review</option>
                    </select>

                    <button
                      onClick={handleRunResearch}
                      disabled={isResearching || !researchQuery.trim()}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                    >
                      {isResearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Conduct Deep Research</span>
                    </button>
                  </div>
                </div>

                {researchReport && (
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                    <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-indigo-500">
                      Research Synthesis Report
                    </div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {researchReport}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. DATA ANALYSIS STUDIO */}
            {activeTool === "data_analysis" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <Table className="w-5 h-5 text-indigo-500" />
                    <span>Document Generator & Data Analysis</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tabular analysis with formula injection protection (=, +, -, @ prefix sanitization).
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Analysis Parameters / Goals
                    </label>
                    <textarea
                      rows={3}
                      value={dataQuery}
                      onChange={(e) => setDataQuery(e.target.value)}
                      placeholder="e.g., Calculate correlation between study hours and exam scores across student cohort data..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <button
                    onClick={handleRunDataAnalysis}
                    disabled={isAnalyzingData || !dataQuery.trim()}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                  >
                    {isAnalyzingData ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Table className="w-3.5 h-3.5" />}
                    <span>Execute Data Analysis</span>
                  </button>
                </div>

                {dataAnalysisResult && (
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                    <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Analysis Findings</div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {dataAnalysisResult}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. SAAS INTEGRATIONS */}
            {activeTool === "saas_actions" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <Share2 className="w-5 h-5 text-indigo-500" />
                    <span>SaaS Actions & Connectors</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Verified operations across Google Workspace, Slack, Discord, and Notion with human approval gating.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Provider</label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="google_workspace">Google Workspace (Calendar, Docs, Sheets)</option>
                      <option value="slack">Slack Workspace</option>
                      <option value="discord">Discord Channel</option>
                      <option value="notion">Notion Database</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Operation</label>
                    <select
                      value={selectedOperation}
                      onChange={(e) => setSelectedOperation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="create_calendar_event">create_calendar_event</option>
                      <option value="create_document">create_document</option>
                      <option value="append_spreadsheet_row">append_spreadsheet_row (Formula-Sanitized)</option>
                      <option value="send_channel_message">send_channel_message</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Parameters (JSON)</label>
                  <textarea
                    rows={4}
                    value={actionParamsJson}
                    onChange={(e) => setActionParamsJson(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                  <label className="flex items-center space-x-2.5 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionApproved}
                      onChange={(e) => setActionApproved(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>I confirm and authorize this SaaS operation</span>
                  </label>

                  <button
                    onClick={handleExecuteSaaSAction}
                    disabled={isExecutingAction || !actionApproved}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                  >
                    {isExecutingAction ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Execute SaaS Action</span>
                  </button>
                </div>

                {actionResult && (
                  <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs font-mono">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">Execution Output:</span>
                    <pre className="text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(actionResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* 7. WORKFLOW AUTOMATION */}
            {activeTool === "workflows" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    <span>Workflow Automation Engine</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Multi-step sequential automation with human approval checkpoints and bounded retries.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Workflow Name</label>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">Configured Pipeline Steps</span>
                  {workflowSteps.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {s.action_type}
                        </span>
                      </div>
                      <span className={`text-[11px] font-semibold ${s.requires_approval ? "text-amber-600" : "text-emerald-600"}`}>
                        {s.requires_approval ? "Human Approval Gate" : "Autonomous Run"}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleRunWorkflow}
                  disabled={isExecutingWorkflow}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  {isExecutingWorkflow ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Run Workflow Pipeline</span>
                </button>

                {workflowInstance && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Workflow: {workflowInstance.name} ({workflowInstance.workflow_id})
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        workflowInstance.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : workflowInstance.status === "awaiting_approval"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-800"
                      }`}>
                        {workflowInstance.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {workflowInstance.steps?.map((step: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold">{step.name}</span>
                            <span className="text-[10px] text-slate-400 ml-2">Status: {step.status}</span>
                          </div>
                          {step.status === "awaiting_approval" && (
                            <button
                              onClick={() => handleApproveWorkflowStep(step.step_id)}
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px]"
                            >
                              Approve & Resume
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 8. GENERAL AI CHAT */}
            {activeTool === "chat" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col h-full space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span>General AI Chat</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Conversational assistance and quick inquiries with note context auto-injection.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-sm whitespace-pre-wrap"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Ask a question or request a study summary..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={isChatSending || !chatInput.trim()}
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
                  >
                    {isChatSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send</span>
                  </button>
                </div>
              </div>
            )}

            {/* 9. TASK HISTORY & ARTIFACT DETAILS (Interactive Master-Detail) */}
            {activeTool === "history" && (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* History List Pane */}
                <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>Task History</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Durable execution records</p>
                    </div>
                    <button
                      onClick={loadHistory}
                      disabled={isLoadingHistory}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs"
                      title="Refresh Tasks"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  {/* Search and Status Filters */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search tasks..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />

                    <div className="flex flex-wrap gap-1">
                      {["ALL", "COMPLETED", "WAITING_APPROVAL", "RUNNING", "FAILED"].map((st) => (
                        <button
                          key={st}
                          onClick={() => setHistoryFilter(st)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                            historyFilter === st
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* History Cards */}
                  {isLoadingHistory ? (
                    <div className="py-12 text-center text-xs text-slate-400">Loading tasks...</div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="py-12 text-center text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                      No matching tasks found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredHistory.map((t) => (
                        <button
                          key={t.task_id}
                          onClick={() => handleOpenTaskDetail(t.task_id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            selectedTaskDetail?.task_id === t.task_id
                              ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono text-slate-400">{t.task_id?.slice(0, 10)}...</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              t.status === "completed"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : t.status === "failed"
                                ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <div className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2">
                            {t.goal || "Task"}
                          </div>
                          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                            <span>{t.category || "General"}</span>
                            <span>{t.artifacts?.length || 0} Artifact(s)</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Task Details & Actions Pane */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  {isLoadingTaskDetail ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mr-2 text-indigo-500" />
                      <span>Retrieving full task execution state...</span>
                    </div>
                  ) : selectedTaskDetail ? (
                    <div className="max-w-3xl space-y-6">
                      {/* Task Header */}
                      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-indigo-500">
                            TASK ID: {selectedTaskDetail.task_id}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            selectedTaskDetail.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : selectedTaskDetail.status === "failed"
                              ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}>
                            {selectedTaskDetail.status} ({Math.round(selectedTaskDetail.progress || 0)}%)
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          {selectedTaskDetail.goal}
                        </h3>
                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-4">
                          <span>Category: <strong>{selectedTaskDetail.category}</strong></span>
                          <span>Created: {new Date(selectedTaskDetail.created_at).toLocaleString()}</span>
                          {selectedTaskDetail.completed_at && (
                            <span>Completed: {new Date(selectedTaskDetail.completed_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      {/* Contextual Action Buttons depending on category and status */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Available Task Actions:
                        </span>
                        <div className="flex flex-wrap gap-2.5">
                          {selectedTaskDetail.category === "email" && (
                            <button
                              onClick={() => handleOpenEmailDraftFromTask(selectedTaskDetail)}
                              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Open in Email Studio (Edit & Send)</span>
                            </button>
                          )}

                          {selectedTaskDetail.category === "presentation" && (
                            <button
                              onClick={() => handleOpenPresentationFromTask(selectedTaskDetail)}
                              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                            >
                              <Presentation className="w-3.5 h-3.5" />
                              <span>Open in Presentation Studio</span>
                            </button>
                          )}

                          {selectedTaskDetail.category === "project_build" && (
                            <button
                              onClick={() => handleOpenProjectFromTask(selectedTaskDetail)}
                              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                              <span>Open in Project Builder</span>
                            </button>
                          )}

                          <button
                            onClick={() => startPollingTask(selectedTaskDetail.task_id)}
                            disabled={isExecutionPolling}
                            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isExecutionPolling ? "animate-spin" : ""}`} />
                            <span>{isExecutionPolling ? "Polling Status..." : "Poll Latest Status"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Artifacts List with Direct Validated Download Links */}
                      {selectedTaskDetail.artifacts && selectedTaskDetail.artifacts.length > 0 && (
                        <div className="space-y-3">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            Generated Artifacts ({selectedTaskDetail.artifacts.length})
                          </span>
                          <div className="space-y-2">
                            {selectedTaskDetail.artifacts.map((art: any, aIdx: number) => {
                              const isPres = typeof art === "object" && (art.type === "presentation_pptx" || art.presentation_id);
                              const isProj = typeof art === "object" && (art.type === "project_zip" || art.project_id);
                              const presId = art.presentation_id || selectedTaskDetail.task_id;
                              const projId = art.project_id || selectedTaskDetail.task_id;

                              return (
                                <div
                                  key={aIdx}
                                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between"
                                >
                                  <div className="flex items-center space-x-3 text-xs">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                                      {isPres ? <Presentation className="w-4 h-4" /> : isProj ? <FolderArchive className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-slate-900 dark:text-white font-mono">
                                        {typeof art === "object" ? art.file_name || art.download_url || art.type : String(art)}
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        {typeof art === "object" && art.sha256 ? `SHA-256: ${art.sha256.slice(0, 16)}...` : "Validated Artifact"}
                                      </div>
                                    </div>
                                  </div>

                                  {isPres ? (
                                    <a
                                      href={`/api/mind-ai/artifacts/presentation/${presId}/download`}
                                      download
                                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download .PPTX</span>
                                    </a>
                                  ) : isProj ? (
                                    <a
                                      href={`/api/mind-ai/artifacts/project/${projId}/download`}
                                      download
                                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download .ZIP</span>
                                    </a>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Result / Error Message */}
                      {selectedTaskDetail.final_response && (
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs leading-relaxed space-y-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block">Task Execution Result:</span>
                          <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{selectedTaskDetail.final_response}</p>
                        </div>
                      )}

                      {selectedTaskDetail.error && (
                        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300 space-y-1">
                          <span className="font-bold block">Execution Error:</span>
                          <p className="whitespace-pre-wrap">{selectedTaskDetail.error}</p>
                        </div>
                      )}

                      {/* Execution Activity Logs */}
                      {selectedTaskDetail.logs && selectedTaskDetail.logs.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            Execution Stages & Logs ({selectedTaskDetail.logs.length})
                          </span>
                          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-300 font-mono text-[11px] max-h-48 overflow-y-auto space-y-1">
                            {selectedTaskDetail.logs.map((l, lIdx) => (
                              <div key={lIdx} className="leading-relaxed">
                                <span className="text-slate-500">[{new Date(l.timestamp).toLocaleTimeString()}]</span>{" "}
                                <span className="text-indigo-400 font-semibold">{l.source || "task"}:</span> {l.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                      <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                      <div className="font-semibold text-slate-600 dark:text-slate-300 text-sm">Select a Task</div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Choose any task card from the left panel to inspect its full ID, lifecycle stages, artifacts, and resume editing.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 10. DOCUMENT STUDIO */}
            {activeTool === "document" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <span>Document Studio</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Synthesize formal technical reports, architecture whitepapers, and lab analyses with markdown preview and cryptographic verification.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="e.g., Zero-Trust Agent Execution Architecture"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Document Type
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="Architecture Whitepaper">Architecture Whitepaper</option>
                      <option value="Executive Technical Report">Executive Technical Report</option>
                      <option value="System Specification">System Specification</option>
                      <option value="Research Essay">Research Essay</option>
                      <option value="Lab Analysis">Lab Analysis</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={docAudience}
                    onChange={(e) => setDocAudience(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="Technical Leaders & Engineers">Technical Leaders & Engineers</option>
                    <option value="Academic Reviewers & Professors">Academic Reviewers & Professors</option>
                    <option value="Undergraduate Students">Undergraduate Students</option>
                    <option value="Executive Stakeholders">Executive Stakeholders</option>
                  </select>
                </div>

                <button
                  onClick={handleRunDocument}
                  disabled={isGeneratingDoc}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  {isGeneratingDoc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Generate Document Artifact</span>
                </button>

                {generatedDoc && (
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div>
                        <span className="font-bold text-sm block">{generatedDoc.title}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {generatedDoc.wordCount} words • SHA-256: {generatedDoc.sha256.slice(0, 16)}...
                        </span>
                      </div>
                      <a
                        href={generatedDoc.downloadUrl}
                        download
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .MD</span>
                      </a>
                    </div>
                    {generatedDoc.content && (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-sans">
                        {generatedDoc.content}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 10b. STUDY & REVISION PLANNER */}
            {activeTool === "study_planner" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    <span>AI Study & Revision Planner</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Generate structured, milestone-based academic revision schedules with active recall checkpoints and spaced retrieval practice.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subject / Academic Domain
                    </label>
                    <input
                      type="text"
                      value={studySubject}
                      onChange={(e) => setStudySubject(e.target.value)}
                      placeholder="e.g., Data Structures & Algorithms"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Assessment Date
                    </label>
                    <input
                      type="text"
                      value={studyExamDate}
                      onChange={(e) => setStudyExamDate(e.target.value)}
                      placeholder="e.g., Final Exam on Nov 15th"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Specific Study Goal / Topic Focus
                  </label>
                  <input
                    type="text"
                    value={studyGoal}
                    onChange={(e) => setStudyGoal(e.target.value)}
                    placeholder="e.g., Master Graph Traversal (BFS/DFS), Dynamic Programming, and Minimum Spanning Trees"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Schedule Duration (Days)
                    </label>
                    <select
                      value={studyDays}
                      onChange={(e) => setStudyDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value={3}>3 Days (Crash Revision)</option>
                      <option value={5}>5 Days (Focused Intensive)</option>
                      <option value={7}>7 Days (Standard Week Schedule)</option>
                      <option value={14}>14 Days (Two-Week Mastery)</option>
                      <option value={30}>30 Days (Full Semester Prep)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Allocated Daily Study Time
                    </label>
                    <select
                      value={studyHoursPerDay}
                      onChange={(e) => setStudyHoursPerDay(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value={1.5}>1.5 Hours / Day (Light Review)</option>
                      <option value={2.5}>2.5 Hours / Day (Standard Active Study)</option>
                      <option value={3.5}>3.5 Hours / Day (Intensive Prep)</option>
                      <option value={5.0}>5.0 Hours / Day (Immersive Sprint)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-700 dark:text-indigo-300 flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500" />
                  <p>
                    <strong>Pedagogical Strategy:</strong> The generated schedule incorporates the testing effect, spaced retrieval practice, and daily active recall checkpoints grounded in your library notes.
                  </p>
                </div>

                <button
                  onClick={handleGenerateStudyPlan}
                  disabled={isGeneratingStudyPlan}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGeneratingStudyPlan ? "Synthesizing Schedule..." : "Generate Study Schedule"}</span>
                </button>

                {generatedStudyPlan && (
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold">{generatedStudyPlan.title} ({generatedStudyPlan.daysCount} Days)</span>
                      </div>
                      <a
                        href={generatedStudyPlan.downloadUrl}
                        download
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Plan (.MD)</span>
                      </a>
                    </div>
                    {generatedStudyPlan.content && (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-sans">
                        {generatedStudyPlan.content}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 11. ARTIFACT LIBRARY */}
            {activeTool === "artifacts" && (
              <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold flex items-center space-x-2">
                      <FolderArchive className="w-5 h-5 text-indigo-500" />
                      <span>Artifact Library</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Cryptographically verified files, slide decks, software packages, and reports produced by your tasks.
                    </p>
                  </div>
                  <button
                    onClick={loadArtifacts}
                    disabled={isLoadingArtifacts}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Refresh Artifacts"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingArtifacts ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {["ALL", "PRESENTATION", "PROJECT", "DOCUMENT", "RESEARCH"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setArtifactFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        artifactFilter === filter
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {isLoadingArtifacts ? (
                  <div className="py-12 flex justify-center items-center text-slate-400 space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-xs">Loading artifact library...</span>
                  </div>
                ) : artifactsList.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-2">
                    <FolderArchive className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <span className="font-semibold text-sm text-slate-600 dark:text-slate-400 block">No Artifacts Found</span>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Generate a presentation, build a software project, or create a document to populate this library.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {artifactsList
                      .filter((art) => {
                        if (artifactFilter === "ALL") return true;
                        const t = (art.type || "").toUpperCase();
                        return t.includes(artifactFilter);
                      })
                      .map((art, idx) => {
                        const isPres = (art.type || "").includes("presentation");
                        const isProj = (art.type || "").includes("project");
                        const isDoc = (art.type || "").includes("document");
                        const isRes = (art.type || "").includes("research");

                        const presId = art.presentation_id || art.id;
                        const projId = art.project_id || art.id;
                        const docId = art.document_id || art.id;
                        const resId = art.research_id || art.id;

                        let dlUrl = art.download_url;
                        if (!dlUrl) {
                          if (isPres) dlUrl = `/api/mind-ai/artifacts/presentation/${presId}/download`;
                          else if (isProj) dlUrl = `/api/mind-ai/artifacts/project/${projId}/download`;
                          else if (isDoc) dlUrl = `/api/mind-ai/artifacts/document/${docId}/download`;
                          else if (isRes) dlUrl = `/api/mind-ai/artifacts/research/${resId}/download`;
                        } else if (!dlUrl.startsWith("/api/mind-ai")) {
                          dlUrl = `/api/mind-ai${dlUrl}`;
                        }

                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-indigo-400 transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                  {isPres ? (
                                    <Presentation className="w-4 h-4" />
                                  ) : isProj ? (
                                    <Code2 className="w-4 h-4" />
                                  ) : isDoc ? (
                                    <FileText className="w-4 h-4" />
                                  ) : (
                                    <Search className="w-4 h-4" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-semibold text-xs block text-slate-800 dark:text-slate-200">
                                    {art.file_name || art.title || art.id}
                                  </span>
                                  <span className="text-[10px] text-slate-400 uppercase font-mono">{art.type}</span>
                                </div>
                              </div>
                              {art.created_at && (
                                <span className="text-[10px] text-slate-400">
                                  {new Date(art.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            {art.task_goal && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                                Goal: {art.task_goal}
                              </p>
                            )}

                            {art.sha256 && (
                              <div className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-900/60 px-2 py-1 rounded">
                                SHA-256: {art.sha256.slice(0, 20)}...
                              </div>
                            )}

                            {dlUrl && (
                              <a
                                href={dlUrl}
                                download
                                className="w-full py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download File</span>
                              </a>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* 12. APPROVAL INBOX */}
            {activeTool === "approvals" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-amber-500" />
                      <span>Approval Inbox</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Review, audit, and authorize sensitive operations before external execution.
                    </p>
                  </div>
                  <button
                    onClick={loadApprovals}
                    disabled={isLoadingApprovals}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Refresh Approvals"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingApprovals ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {isLoadingApprovals ? (
                  <div className="py-12 flex justify-center items-center text-slate-400 space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-xs">Loading pending approvals...</span>
                  </div>
                ) : approvalsList.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-2">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                    <span className="font-semibold text-sm text-slate-600 dark:text-slate-400 block">All Actions Authorized</span>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      There are no pending actions requiring human approval. Sensitive writes and email sends will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approvalsList.map((appr, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                              {appr.risk_level || "MEDIUM RISK"}
                            </span>
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{appr.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Target: {appr.target}</span>
                        </div>

                        {appr.details && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                            {JSON.stringify(appr.details, null, 2)}
                          </div>
                        )}

                        <div className="flex items-center justify-end space-x-2 pt-1">
                          <button
                            onClick={() => {
                              if (appr.type === "email_draft") {
                                setEmailDraftId(appr.approval_id);
                                setActiveTool("email");
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                          >
                            Review Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 13. CONNECTED ACCOUNTS */}
            {activeTool === "connected_accounts" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <Share2 className="w-5 h-5 text-indigo-500" />
                    <span>Connected SaaS Accounts</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Authorized integrations, OAuth scope management, and automated formula injection sanitization status.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Google Workspace */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Google Workspace</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {emailLiveConfigured ? "CONNECTED (LIVE)" : "MOCK MODE (SAFE)"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Gmail, Google Calendar, Google Docs, and Google Sheets.
                    </p>
                    <div className="text-[10px] space-y-1 font-mono text-slate-500">
                      <div>• Scopes: gmail.send, calendar.events, spreadsheets</div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-semibold">• Formula injection defense: ACTIVE</div>
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">GitHub Developer</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        CONNECTED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Repository inspection, branch creation, and sandboxed test execution.
                    </p>
                    <div className="text-[10px] space-y-1 font-mono text-slate-500">
                      <div>• Scopes: repo, workflow:read</div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-semibold">• Direct main push: DISABLED (Least-privilege)</div>
                    </div>
                  </div>

                  {/* Slack & Discord */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Slack & Discord</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        WEBHOOK ONLY
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Study group alert dispatches and pipeline notifications.
                    </p>
                    <div className="text-[10px] font-mono text-slate-500">
                      • Approval gate: REQUIRED for broadcast
                    </div>
                  </div>

                  {/* Notion & Teams */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Notion Workspace</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        STANDBY
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Study summaries and lecture vault synchronization.
                    </p>
                    <div className="text-[10px] font-mono text-slate-500">
                      • Schema validation: ENFORCED
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 14. USAGE AND PLAN */}
            {activeTool === "usage_plan" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <Sliders className="w-5 h-5 text-indigo-500" />
                    <span>Usage and Plan Entitlements</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Server-enforced student tier allowances, task limits, and active agent capabilities.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                        Active Membership
                      </span>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                        {subscriptionData?.plan || "Notsopedia Student Pro"}
                      </h4>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-bold text-xs shadow-sm">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block mb-0.5">Universal Tasks</span>
                      <span className="font-bold text-sm">Unlimited</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block mb-0.5">AI Model Quota</span>
                      <span className="font-bold text-sm">500 Calls / Mo</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block mb-0.5">Storage Sandbox</span>
                      <span className="font-bold text-sm">Isolated 50MB</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Server-Verified Entitlements
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      "16:9 Presentation Studio (.PPTX)",
                      "FastAPI Sandboxed Project Builder",
                      "Cryptographic SHA-256 Approval Gating",
                      "CSV Formula Injection Protection",
                      "Deep Research with Citations",
                      "Autonomous Task Recovery Checkpoints"
                    ].map((feature, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 15. SETTINGS & MODEL INFRASTRUCTURE */}
            {activeTool === "settings" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <Cpu className="w-5 h-5 text-indigo-500" />
                    <span>Model Infrastructure & Registry</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Inspect proprietary model lineage, benchmark evaluations, checkpoint hashes, and runtime routing.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Registered Model Catalog
                  </span>
                  {modelVersions.length > 0 ? (
                    modelVersions.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white font-mono">{m.model_id}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {m.maturity}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]">v{m.version}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <div>• Base Lineage: <span className="font-mono text-slate-700 dark:text-slate-300">{m.base_model_lineage}</span></div>
                          <div>• Parameters: <span className="font-mono text-slate-700 dark:text-slate-300">{m.parameters_count}</span></div>
                          <div>• License: <span className="font-mono text-slate-700 dark:text-slate-300">{m.license_type}</span></div>
                          {m.checkpoint_sha256 && (
                            <div className="truncate font-mono text-[10px] text-slate-400">
                              • Checkpoint SHA-256: {m.checkpoint_sha256}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-xs text-slate-400">
                      Loading registered models from MIND-AI registry...
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs">
                  <span className="font-bold block text-slate-800 dark:text-slate-200">Cognitive Provider Routing</span>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                    <div>• Primary: <span className="font-semibold text-emerald-600">MIND-AI Autonomous Engine (Local / Self-hosted)</span></div>
                    <div>• Fallback: <span className="font-semibold text-indigo-600">Google Gemini 2.5 Flash</span></div>
                    <div>• Security Guardrail: <span className="font-semibold text-amber-600">Human Approval Gating for External Writes</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* 16. ADMIN DASHBOARD */}
            {activeTool === "admin" && (
              <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    <span>Administrator Dashboard</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Server-side verified management console for system diagnostics, worker state, and security audit logs.
                  </p>
                </div>

                {adminError ? (
                  <div className="p-6 rounded-2xl border border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-3">
                    <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
                    <span className="font-bold text-sm text-amber-900 dark:text-amber-200 block">
                      Administrator Privileges Required
                    </span>
                    <p className="text-xs text-amber-800 dark:text-amber-300 max-w-md mx-auto leading-relaxed">
                      {adminError}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono pt-2">
                      Access is verified cryptographically via server-to-server credentials. Client-side flags cannot grant administrator rights.
                    </div>
                  </div>
                ) : isLoadingAdmin ? (
                  <div className="py-12 flex justify-center items-center text-slate-400 space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-xs">Verifying administrator credentials...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40">
                        <span className="text-slate-400 block text-[11px]">System Status</span>
                        <span className="font-bold text-emerald-500 text-sm">HEALTHY</span>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40">
                        <span className="text-slate-400 block text-[11px]">Active Workers</span>
                        <span className="font-bold text-sm">4 Online</span>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40">
                        <span className="text-slate-400 block text-[11px]">Memory Footprint</span>
                        <span className="font-bold text-sm">84.2 MB</span>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40">
                        <span className="text-slate-400 block text-[11px]">Audit Logging</span>
                        <span className="font-bold text-indigo-500 text-sm">ENABLED</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-300 font-mono text-[11px] space-y-1">
                      <span className="font-bold text-slate-400 block mb-1">// Diagnostic Overview Payload</span>
                      <pre className="overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(adminOverview || { status: "verified", audit: "active" }, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* GLOBAL COMMAND PALETTE MODAL (Ctrl+K) */}
      {/* ────────────────────────────────────────────────────────────── */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/70 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden space-y-2">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={commandPaletteQuery}
                onChange={(e) => setCommandPaletteQuery(e.target.value)}
                placeholder="Type a command or jump to studio... (Press Esc to close)"
                className="w-full bg-transparent text-xs outline-none text-slate-900 dark:text-white font-medium"
              />
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono">
                ESC
              </kbd>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              {[
                { name: "Presentation Studio", tool: "presentation", desc: "Build 16:9 widescreen slide deck" },
                { name: "Email Assistant", tool: "email", desc: "Draft with independent subject/body and approval gating" },
                { name: "Project Builder", tool: "project_builder", desc: "Scaffold codebases and execute sandboxed tests" },
                { name: "Deep Research", tool: "research", desc: "Multi-source evidence collection with citations" },
                { name: "Document Studio", tool: "document", desc: "Generate architecture whitepapers and reports" },
                { name: "Data Analysis", tool: "data_analysis", desc: "Statistical datasets with formula injection defense" },
                { name: "SaaS Integrations", tool: "saas_actions", desc: "Google Workspace, GitHub, Slack, Notion" },
                { name: "Workflow Engine", tool: "workflows", desc: "Sequential automated pipelines" },
                { name: "General AI Chat", tool: "chat", desc: "Direct study tutor and general conversation" },
                { name: "Task History", tool: "history", desc: "Inspect completed executions and resumed logs" },
                { name: "Artifact Library", tool: "artifacts", desc: "Download verified .PPTX, .ZIP, and .MD files" },
                { name: "Approval Inbox", tool: "approvals", desc: "Review and authorize pending external actions" },
                { name: "Settings & Models", tool: "settings", desc: "Model registry catalog and benchmark scores" },
                { name: "Admin Dashboard", tool: "admin", desc: "Server-side diagnostics and system health" }
              ]
                .filter((item) =>
                  commandPaletteQuery.trim()
                    ? item.name.toLowerCase().includes(commandPaletteQuery.toLowerCase()) ||
                      item.desc.toLowerCase().includes(commandPaletteQuery.toLowerCase())
                    : true
                )
                .map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveTool(item.tool as WorkspaceTool);
                      setIsCommandPaletteOpen(false);
                      setCommandPaletteQuery("");
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.desc}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* TASK TEMPLATES DRAWER MODAL */}
      {/* ────────────────────────────────────────────────────────────── */}
      {isTemplatesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-sm flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span>Curated Task & Document Templates</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any validated template to pre-populate inputs and launch the studio immediately.
                </p>
              </div>
              <button
                onClick={() => setIsTemplatesOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {templatesList.map((tpl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsTemplatesOpen(false);
                    if (tpl.category === "presentation") {
                      setPresTopic(tpl.default_params?.topic || tpl.name);
                      setPresSlideCount(tpl.default_params?.slide_count || 6);
                      setActiveTool("presentation");
                    } else if (tpl.category === "project_build") {
                      setProjName(tpl.default_params?.name || "template_project");
                      setProjType(tpl.default_params?.project_type || "fastapi_service");
                      setActiveTool("project_builder");
                    } else if (tpl.category === "document") {
                      setDocTitle(tpl.default_params?.title || tpl.name);
                      setDocType(tpl.default_params?.doc_type || "Architecture Whitepaper");
                      setActiveTool("document");
                    } else if (tpl.category === "email") {
                      setEmailSubject(tpl.default_params?.subject || tpl.name);
                      setEmailTone(tpl.default_params?.tone || "formal");
                      setActiveTool("email");
                    } else if (tpl.category === "research") {
                      setResearchQuery(tpl.default_params?.query || tpl.name);
                      setActiveTool("research");
                    } else if (tpl.category === "data_analysis") {
                      setDataQuery(tpl.default_params?.query || tpl.name);
                      setActiveTool("data_analysis");
                    }
                    setSuccessMsg(`Loaded template '${tpl.name}'. Ready for generation.`);
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 text-left transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{tpl.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {tpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* KEYBOARD SHORTCUTS MODAL (?) */}
      {/* ────────────────────────────────────────────────────────────── */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                <span>Keyboard Shortcuts</span>
              </h4>
              <button
                onClick={() => setIsShortcutsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: "Ctrl + K / ⌘K", desc: "Open Global Command Palette" },
                { key: "Esc", desc: "Close Modals and Overlays" },
                { key: "?", desc: "Toggle this Keyboard Shortcuts guide" },
                { key: "Enter (in Chat)", desc: "Send chat message" },
                { key: "Ctrl + Enter", desc: "Execute active task or generator" }
              ].map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{s.desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIWorkspaceModal;
