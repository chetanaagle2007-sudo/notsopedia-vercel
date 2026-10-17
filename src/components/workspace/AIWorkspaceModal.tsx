import React, { useState, useEffect } from "react";
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
  Cpu
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
  | "chat"
  | "email"
  | "presentation"
  | "project_builder"
  | "research"
  | "data_analysis"
  | "saas_actions"
  | "workflows"
  | "history";

export function AIWorkspaceModal({
  isOpen,
  onClose,
  selectedNote,
  userNotes = [],
  authToken
}: AIWorkspaceModalProps) {
  const [activeTool, setActiveTool] = useState<WorkspaceTool>("presentation");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // General Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hello! I am your MIND-AI assistant. Ask me questions, explore study topics, or use the dedicated tools on the left." }
  ]);
  const [isChatSending, setIsChatSending] = useState(false);

  // Email Assistant state (all fields independently editable)
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
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

  // Presentation Studio state
  const [presTopic, setPresTopic] = useState("");
  const [presSlideCount, setPresSlideCount] = useState(6);
  const [presTheme, setPresTheme] = useState("modern_dark");
  const [presOutline, setPresOutline] = useState<Array<{ title: string; bullets?: string[]; speaker_notes?: string }>>([]);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isBuildingDeck, setIsBuildingDeck] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<{ id: string; fileName: string; downloadUrl: string; slideCount: number } | null>(null);

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

  // Task History state
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<string>("ALL");

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
      if (activeTool === "history") loadHistory();
      if (activeTool === "saas_actions") loadConnectors();
    }
  }, [isOpen, activeTool]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // Tool Handlers
  // -------------------------------------------------------------

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
        setIsEmailApproved(false); // Revoke approval on content change
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
        setIsEmailApproved(false); // Revoke approval on content change
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
      setError("To, Subject, and Body fields are all required before creating a draft.");
      return;
    }
    setIsSavingDraft(true);
    setError(null);
    try {
      const payload = {
        recipient: emailTo.trim(),
        subject: emailSubject.trim(),
        body: emailBody.trim(),
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
        setEmailSendStatus("SUBMITTED (Simulated/Mock environment active - zero unsolicited emails delivered)");
        setSuccessMsg(`Email dispatched successfully! Message ID: ${data.provider_message_id || "mock-dispatch"}`);
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
          slideCount: data.slide_count
        });
        setSuccessMsg("16:9 PowerPoint Presentation generated and verified!");
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
      } else {
        throw new Error(data.error || "Data analysis failed.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzingData(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  MIND-AI Autonomous Studio & Workspace
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Full SaaS Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Separated, purpose-built engines for presentations, code synthesis, gated emails, research, and workflows.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Note Banner if available */}
        {selectedNote && (
          <div className="px-6 py-2 bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-200">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                Linked Note: <strong>{selectedNote.title}</strong> ({selectedNote.subjectName || "Study Note"})
              </span>
            </div>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Context auto-injected into prompts
            </span>
          </div>
        )}

        {/* Global Feedback Banners */}
        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Workspace Body: Split Navigation & Main Tool Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Tool Sidebar */}
          <div className="w-60 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 space-y-1 overflow-y-auto flex-shrink-0">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Dedicated Tools
            </div>

            <button
              onClick={() => setActiveTool("presentation")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTool === "presentation"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Presentation className="w-4 h-4" />
              <span>Presentation Studio</span>
            </button>

            <button
              onClick={() => setActiveTool("email")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTool === "email"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email Assistant</span>
            </button>

            <button
              onClick={() => setActiveTool("project_builder")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTool === "project_builder"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Project Builder</span>
            </button>

            <button
              onClick={() => setActiveTool("research")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTool === "research"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Deep Research</span>
            </button>

            <button
              onClick={() => setActiveTool("data_analysis")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTool === "data_analysis"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Document & Data</span>
            </button>

            <button
              onClick={() => setActiveTool("saas_actions")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTool === "saas_actions"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>SaaS Integrations</span>
            </button>

            <button
              onClick={() => setActiveTool("workflows")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTool === "workflows"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Workflow Engine</span>
            </button>

            <div className="pt-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace Core
            </div>

            <button
              onClick={() => setActiveTool("chat")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTool === "chat"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>General AI Chat</span>
            </button>

            <button
              onClick={() => setActiveTool("history")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTool === "history"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Task History</span>
            </button>
          </div>

          {/* Main Tool Content Pane */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
            {/* 1. PRESENTATION STUDIO */}
            {activeTool === "presentation" && (
              <div className="max-w-3xl space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Presentation className="w-5 h-5 text-indigo-500" />
                    <span>Presentation Studio (16:9 Widescreen PPTX)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Generate authentic, structured PowerPoint decks with titles, bullets, speaker notes, and downloadable .pptx files.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Deck Topic / Subject
                    </label>
                    <input
                      type="text"
                      value={presTopic}
                      onChange={(e) => setPresTopic(e.target.value)}
                      placeholder="e.g., Quantum Mechanics & Wave Equations"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Design Theme
                  </label>
                  <select
                    value={presTheme}
                    onChange={(e) => setPresTheme(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="modern_dark">Modern Dark (Navy & Electric Slate)</option>
                    <option value="academic_modern">Academic Modern (Navy & Gold)</option>
                    <option value="emerald_matrix">Emerald Matrix (Clean Technical)</option>
                    <option value="executive_slate">Executive Slate (Monochrome)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleGenerateOutline}
                    disabled={isGeneratingOutline || !presTopic.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  >
                    {isGeneratingOutline ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
                    <span>Generate / Edit Outline</span>
                  </button>

                  <button
                    onClick={handleBuildDeck}
                    disabled={isBuildingDeck || !presTopic.trim()}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all"
                  >
                    {isBuildingDeck ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Build 16:9 Presentation Deck</span>
                  </button>
                </div>

                {/* Outline Preview / Editor */}
                {presOutline.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Slide Outline ({presOutline.length} Slides)
                    </span>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {presOutline.map((slide, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{slide.title}</span>
                          </div>
                          {slide.bullets && slide.bullets.length > 0 && (
                            <ul className="mt-1.5 ml-7 list-disc text-slate-600 dark:text-slate-300 space-y-0.5 text-[11px]">
                              {slide.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated Deck Download Card */}
                {generatedDeck && (
                  <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Presentation Ready for Download</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {generatedDeck.fileName} • {generatedDeck.slideCount} slides (16:9 Widescreen PPTX)
                      </div>
                    </div>
                    <a
                      href={generatedDeck.downloadUrl}
                      download
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .PPTX</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* 2. EMAIL ASSISTANT */}
            {activeTool === "email" && (
              <div className="max-w-3xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-indigo-500" />
                    <span>Order-Driven Email Assistant</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Independently generate and edit To, CC, BCC, Subject, and Body with tone controls and cryptographic approval gating.
                  </p>
                </div>

                {/* Prompt & Tone Selector */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Natural Language Instruction / Objective
                    </label>
                    <textarea
                      rows={2}
                      value={emailPrompt}
                      onChange={(e) => setEmailPrompt(e.target.value)}
                      placeholder="e.g., Email prof.adams@university.edu asking for a 3-day extension on the physics problem set..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Tone:</span>
                      <select
                        value={emailTone}
                        onChange={(e) => setEmailTone(e.target.value as any)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
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
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-medium transition-all"
                      >
                        {isGeneratingSubject ? "Generating..." : "Generate Subject"}
                      </button>
                      <button
                        onClick={handleGenerateBodyOnly}
                        disabled={isGeneratingBody || !emailPrompt.trim()}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-medium transition-all"
                      >
                        {isGeneratingBody ? "Generating..." : "Generate Body"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Separated Editable Fields */}
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
                        placeholder="recipient@university.edu"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
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
                        placeholder="co-lead@uni.edu, advisor@uni.edu"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
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
                        placeholder="record@archive.edu"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
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
                      placeholder="Email Subject Line"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Body</label>
                    <textarea
                      rows={6}
                      value={emailBody}
                      onChange={(e) => {
                        setEmailBody(e.target.value);
                        setIsEmailApproved(false);
                      }}
                      placeholder="Write or review email message body..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono leading-relaxed"
                    />
                  </div>
                </div>

                {/* Approval & Safe Send Gating Status */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-xs">
                    {isEmailApproved ? (
                      <>
                        <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">
                            Approved & Fingerprint Verified
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            SHA-256: {emailApprovalFingerprint?.slice(0, 16)}...
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-amber-800 dark:text-amber-300 block">
                            Pending User Approval
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Editing any field automatically invalidates prior approvals.
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveDraft}
                      disabled={isSavingDraft}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                    >
                      {isSavingDraft ? "Saving..." : emailDraftId ? "Update Draft" : "Save Draft"}
                    </button>

                    <button
                      onClick={handleApproveDraft}
                      disabled={!emailDraftId || isEmailApproved}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold shadow-sm"
                    >
                      Approve Fingerprint
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
                  <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 text-xs">
                    {emailSendStatus}
                  </div>
                )}
              </div>
            )}

            {/* 3. PROJECT BUILDER */}
            {activeTool === "project_builder" && (
              <div className="max-w-3xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Code2 className="w-5 h-5 text-indigo-500" />
                    <span>Autonomous Project Builder (Sandboxed)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Generate multi-file code scaffolds with AST verification, automated unit tests, and download as ZIP.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      placeholder="e.g., student_quantum_solver"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Framework / Template
                    </label>
                    <select
                      value={projType}
                      onChange={(e) => setProjType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    >
                      <option value="fastapi_service">FastAPI Microservice (API + Tests)</option>
                      <option value="react_component_pack">React Component Pack</option>
                      <option value="cli_tool">Python CLI Application</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Project Description / Specifications
                  </label>
                  <textarea
                    rows={2}
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    placeholder="Describe what endpoints, data models, or algorithms to implement..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePlanProject}
                    disabled={isPlanningProj || !projName.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5"
                  >
                    {isPlanningProj ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                    <span>1. Plan Architecture</span>
                  </button>

                  <button
                    onClick={handleBuildProject}
                    disabled={isBuildingProj || !projPlan}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                  >
                    {isBuildingProj ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                    <span>2. Synthesize Sandbox & ZIP</span>
                  </button>

                  <button
                    onClick={handleTestProject}
                    disabled={isTestingProj || !projPlan}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                  >
                    {isTestingProj ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>3. Execute Sandboxed Tests</span>
                  </button>
                </div>

                {/* Scaffold Plan Preview */}
                {projPlan && (
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Architecture Scaffold ({projPlan.files?.length || 0} files planned)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {projPlan.files?.map((f: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-800 dark:text-slate-200">
                          📄 {f.path}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Build and Test Results */}
                {projBuildResult && (
                  <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        Project Packaged: {projPlan.name}.zip
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {projBuildResult.verification?.verified_files?.length || 0} files syntax verified
                      </div>
                    </div>
                    <a
                      href={`/api/mind-ai/artifacts/project/${projPlan.project_id}/download`}
                      download
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .ZIP</span>
                    </a>
                  </div>
                )}

                {projTestResult && (
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans text-slate-300">
                      <span>Test Execution Output</span>
                      <span className={projTestResult.passed ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                        {projTestResult.passed ? "TESTS PASSED" : "TESTS FAILED"}
                      </span>
                    </div>
                    <pre className="overflow-x-auto text-slate-300 whitespace-pre-wrap">
                      {projTestResult.stdout || projTestResult.error || "No test output available."}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* 4. DEEP RESEARCH */}
            {activeTool === "research" && (
              <div className="max-w-3xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Search className="w-5 h-5 text-indigo-500" />
                    <span>Deep Research & Reference Synthesis</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Query decomposition with academic citation validation (no fabricated references).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Research Subject or Question
                  </label>
                  <textarea
                    rows={3}
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    placeholder="e.g., Comparative analysis of time-independent Schrödinger equations in potential wells..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <select
                    value={researchDepth}
                    onChange={(e) => setResearchDepth(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
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

                {researchReport && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Research Synthesis Report</div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {researchReport}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. DATA ANALYSIS */}
            {activeTool === "data_analysis" && (
              <div className="max-w-3xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Table className="w-5 h-5 text-indigo-500" />
                    <span>Document Generator & Data Analysis</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Process CSV/tabular data with strict formula injection sanitization (=, +, -, @ prefix protection).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Analysis Objective
                  </label>
                  <textarea
                    rows={3}
                    value={dataQuery}
                    onChange={(e) => setDataQuery(e.target.value)}
                    placeholder="e.g., Calculate statistics, distributions, and summary correlations from linked student notes..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <button
                  onClick={handleRunDataAnalysis}
                  disabled={isAnalyzingData || !dataQuery.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  {isAnalyzingData ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Table className="w-3.5 h-3.5" />}
                  <span>Run Secure Data Analysis</span>
                </button>

                {dataAnalysisResult && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Analysis Findings</div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {dataAnalysisResult}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. SAAS ACTIONS */}
            {activeTool === "saas_actions" && (
              <div className="max-w-3xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Share2 className="w-5 h-5 text-indigo-500" />
                    <span>SaaS Actions & Connectors</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Execute actions across Google Workspace, Slack, Discord, and Notion with approval gating and mock status transparency.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Provider
                    </label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    >
                      <option value="google_workspace">Google Workspace (Docs, Sheets, Calendar)</option>
                      <option value="slack">Slack Workspace</option>
                      <option value="discord">Discord Channel</option>
                      <option value="notion">Notion Database</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Operation
                    </label>
                    <select
                      value={selectedOperation}
                      onChange={(e) => setSelectedOperation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    >
                      <option value="create_calendar_event">create_calendar_event</option>
                      <option value="create_document">create_document</option>
                      <option value="append_spreadsheet_row">append_spreadsheet_row (Formula-Sanitized)</option>
                      <option value="send_channel_message">send_channel_message</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Parameters (JSON)
                  </label>
                  <textarea
                    rows={4}
                    value={actionParamsJson}
                    onChange={(e) => setActionParamsJson(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionApproved}
                      onChange={(e) => setActionApproved(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>I confirm and approve this action for execution</span>
                  </label>

                  <button
                    onClick={handleExecuteSaaSAction}
                    disabled={isExecutingAction || !actionApproved}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                  >
                    {isExecutingAction ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Execute SaaS Action</span>
                  </button>
                </div>

                {actionResult && (
                  <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs font-mono space-y-1">
                    <div className="font-bold text-emerald-800 dark:text-emerald-300">Execution Result:</div>
                    <pre className="text-slate-800 dark:text-slate-200 overflow-x-auto">
                      {JSON.stringify(actionResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* 7. WORKFLOWS */}
            {activeTool === "workflows" && (
              <div className="max-w-3xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    <span>Workflow Automation Engine</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Multi-step sequential automation with human approval pauses and bounded retries.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                  />
                </div>

                {/* Steps configuration */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Configured Steps
                  </span>
                  {workflowSteps.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">{s.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {s.action_type}
                        </span>
                      </div>
                      <span className={`text-[11px] font-medium ${s.requires_approval ? "text-amber-600" : "text-emerald-600"}`}>
                        {s.requires_approval ? "Approval Gate" : "Auto-Run"}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleRunWorkflow}
                  disabled={isExecutingWorkflow}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                >
                  {isExecutingWorkflow ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Run Workflow Pipeline</span>
                </button>

                {/* Workflow Status & Approval Pause View */}
                {workflowInstance && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Workflow: {workflowInstance.name} ({workflowInstance.workflow_id})
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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
                        <div key={idx} className="p-2.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold">{step.name}</span>
                            <span className="text-[10px] text-slate-400 ml-2">Status: {step.status}</span>
                          </div>
                          {step.status === "awaiting_approval" && (
                            <button
                              onClick={() => handleApproveWorkflowStep(step.step_id)}
                              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px]"
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
              <div className="max-w-3xl h-full flex flex-col space-y-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span>General AI Chat</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Conversational assistance and quick inquiries with automatic study note context injection.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 max-h-[50vh]">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-sm whitespace-pre-wrap leading-relaxed"
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={isChatSending || !chatInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1"
                  >
                    {isChatSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send</span>
                  </button>
                </div>
              </div>
            )}

            {/* 9. TASK HISTORY & ARTIFACTS */}
            {activeTool === "history" && (
              <div className="max-w-4xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-indigo-500" />
                      <span>Task Store & Artifacts History</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Durable history of executed tasks with direct artifact downloads.
                    </p>
                  </div>
                  <button
                    onClick={loadHistory}
                    disabled={isLoadingHistory}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {isLoadingHistory ? (
                  <div className="py-12 text-center text-slate-400 text-xs">Loading task records...</div>
                ) : taskHistory.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 text-xs">
                    No task history recorded yet. Launch an autonomous task from any studio tab!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {taskHistory.map((t) => (
                      <div
                        key={t.task_id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900 dark:text-white text-xs">
                              {t.goal || "Task"}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              t.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : t.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-3">
                            <span>ID: {t.task_id?.slice(0, 10)}...</span>
                            <span>Category: {t.category || "General"}</span>
                          </div>
                        </div>

                        {t.artifacts && t.artifacts.length > 0 && (
                          <div className="flex items-center space-x-1.5">
                            {t.artifacts.map((art: string, artIdx: number) => (
                              <span
                                key={artIdx}
                                className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-mono"
                              >
                                {art.split("/").pop()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIWorkspaceModal;
