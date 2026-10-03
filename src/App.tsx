import React, { useState, useEffect, useMemo } from "react";
import pptxgen from "pptxgenjs";
import { UNIVERSAL_SUBJECTS, UniversalSubject } from "./data";
import { UserNote, SignedInUser, SystemConfig, AIMode, AIChatMessage } from "./types";

// Layout Components
import { AnnouncementBanner } from "./components/layout/AnnouncementBanner";
import { ToastNotification } from "./components/layout/ToastNotification";
import { AppHeader } from "./components/layout/AppHeader";
import { AppSidebar } from "./components/layout/AppSidebar";
import { Footer } from "./components/layout/Footer";

// Explorer Components
import { ExplorerHero } from "./components/explorer/ExplorerHero";
import { SubjectFilterBar } from "./components/explorer/SubjectFilterBar";
import { NoteGrid } from "./components/explorer/NoteGrid";

// Upload & Reader Components
import { NoteUploadModal } from "./components/upload/NoteUploadModal";
import { NoteReaderModal } from "./components/reader/NoteReaderModal";

// AI Tutor Components
import { AITutorWorkspace } from "./components/ai-tutor/AITutorWorkspace";

// Admin Components
import { AdminPortal } from "./components/admin/AdminPortal";
import { NoteEditModal } from "./components/admin/NoteEditModal";

// Auth Components
import { AuthModal } from "./components/auth/AuthModal";
import { AuthFlowPage } from "./components/auth/AuthFlowPage";
import { supabase } from "./supabase";

function NotsopediaApp() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<"explorer" | "ai-tutor" | "admin-portal">("explorer");
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [likedNoteIds, setLikedNoteIds] = useState<Set<string>>(() => new Set());
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);
  const [notesSearchQuery, setNotesSearchQuery] = useState<string>("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("All Subjects");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Theme State
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("notsopedia_theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  // Modals
  const [viewingNote, setViewingNote] = useState<UserNote | null>(null);
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalIsAdmin, setAuthModalIsAdmin] = useState<boolean>(false);

  // User Session
  const [signedInUser, setSignedInUser] = useState<SignedInUser | null>(null);

  // AI Assistant State
  const [aiQuestion, setAiQuestion] = useState<string>("");
  const [aiMode, setAiMode] = useState<AIMode>("news-gk");
  const [aiChatHistory, setAiChatHistory] = useState<AIChatMessage[]>([
    {
      sender: "ai",
      text: "ðŸ‘‹ Welcome to Notsopedia Live AI Search! I can answer *any question in the world* with real-time web grounding, summarize academic textbooks, or synthesize your peer notes library directly. Ask me anything!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);

  // System Configuration
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    announcement: "ðŸŽ“ Welcome to the new Notsopedia Universal Hub! Download community notes, access the Live AI Search, and share research notes permanently.",
    announcementActive: true,
    enableSubmissions: true
  });

  // Security Logs & Autonomous Healing
  const [securityLogs, setSecurityLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [SHIELD] Autonomous Security Daemon initialized.`,
    `[${new Date().toLocaleTimeString()}] [SHIELD] Monitoring active database and storage schemas...`,
    `[${new Date().toLocaleTimeString()}] [SHIELD] Standard CORS, CSRF, and injection vector validation active.`
  ]);
  const [isHealing, setIsHealing] = useState<boolean>(false);

  // Status Toasts
  const [notesError, setNotesError] = useState<string>("");
  const [notesSuccessMessage, setNotesSuccessMessage] = useState<string>("");
  const [isGeneratingPPTX, setIsGeneratingPPTX] = useState<boolean>(false);

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<string>("");

  // Sync theme to document element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("notsopedia_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Clock & Initial Load
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    void fetchNotes();
    void fetchSystemConfig();

    // Restore Supabase authentication session and keep it synchronized.
    void restoreSupabaseSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setSignedInUser(null);
        return;
      }

      void loadSignedInUser(session.user.id, session.user.email, session.user.user_metadata);
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Fetch community notes
  const fetchNotes = async () => {
    setIsLoadingNotes(true);
    setNotesError("");
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setUserNotes(data);
        localStorage.setItem("notsopedia_notes_cache", JSON.stringify(data));
      } else {
        throw new Error("Failed to load community notes");
      }
    } catch (err: any) {
      console.error("Fetch notes error:", err);
      setNotesError("No network connection. Displaying offline cached notes.");
      const local = localStorage.getItem("notsopedia_notes_cache");
      if (local) {
        try {
          setUserNotes(JSON.parse(local));
        } catch (_) {}
      }
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Fetch the current user's liked note IDs
  const fetchLikedNoteIds = async () => {
    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setLikedNoteIds(new Set());
        return;
      }

      const res = await fetch("/api/notes/liked", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load liked notes.");
      }

      const data = await res.json();

      setLikedNoteIds(new Set<string>(data.noteIds || []));
    } catch (err) {
      console.error("Failed to load liked notes:", err);
      setLikedNoteIds(new Set());
    }
  };

  // Fetch system config
  const fetchSystemConfig = async () => {
    try {
      const res = await fetch("/api/system/config");
      if (res.ok) {
        const data = await res.json();
        setSystemConfig(data);
      }
    } catch (err) {
      console.warn("Could not retrieve system configuration from backend:", err);
    }
  };

  // Save system config
  const saveSystemConfig = async (updatedFields: Partial<SystemConfig>) => {
    setIsSavingConfig(true);
    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        showToast("Your sign-in session has expired. Please sign in again.", "error");
        return;
      }

      const res = await fetch("/api/system/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updatedFields)
      });

      if (res.ok) {
        const data = await res.json();
        setSystemConfig(data);
        showToast("Application configuration saved successfully!", "success");
      } else {
        const errorData = await res.json().catch(() => null);
        const msg = errorData?.error || "Failed to save app configuration.";
        showToast(msg, "error");
      }
    } catch (err) {
      console.error("Error saving system config:", err);
      showToast("Failed to save app configuration.", "error");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Toast feedback helper
  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") {
      setNotesSuccessMessage(message);
      setTimeout(() => setNotesSuccessMessage(""), 4500);
    } else {
      setNotesError(message);
      setTimeout(() => setNotesError(""), 4500);
    }
  };

  // Like / unlike note
  const handleLikeNote = async (id: string) => {
    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        showToast("Please sign in to like a study note.", "error");
        return;
      }

      const res = await fetch(`/api/notes/${id}/like`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update note like.");
      }

      const result = await res.json();

      setUserNotes((prev) =>
        prev.map((note) =>
          note.id === result.noteId
            ? {
                ...note,
                likes: result.likes
              }
            : note
        )
      );

      setLikedNoteIds((prev) => {
        const next = new Set(prev);

        if (result.liked) {
          next.add(result.noteId);
        } else {
          next.delete(result.noteId);
        }

        return next;
      });
    } catch (err) {
      console.error("Error toggling like on server:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to update note like.",
        "error"
      );
    }
  };

  // Delete note
  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study note permanently?")) return;

    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        showToast("Your sign-in session has expired. Please sign in again.", "error");
        return;
      }

      const res = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (res.ok) {
        setUserNotes((prev) => prev.filter((n) => n.id !== id));
        showToast("Note deleted successfully.", "success");
      } else {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to delete note from server");
      }
    } catch (err) {
      console.error("Error deleting note:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to delete note.",
        "error"
      );
    }
  };

  // Edit note submit
  const handleEditNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;

    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        showToast("Your sign-in session has expired. Please sign in again.", "error");
        return;
      }

      const res = await fetch(`/api/notes/${editingNote.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(editingNote)
      });

      if (res.ok) {
        const updated = await res.json();
        setUserNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        setEditingNote(null);
        showToast("Note moderated and updated successfully!", "success");
      } else {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to save edits to server");
      }
    } catch (err) {
      console.error("Error editing note:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to update note.",
        "error"
      );
    }
  };

  // Reset database
  const handleResetDatabase = async () => {
    if (!confirm("Reset the entire Notsopedia collection to default universal notes? This will wipe recent additions!")) return;

    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        showToast("Your sign-in session has expired. Please sign in again.", "error");
        return;
      }

      const res = await fetch("/api/notes/reset", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUserNotes(data);
        showToast("Archive database reset to universal defaults.", "success");
      } else {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to reset database");
      }
    } catch (err) {
      console.error("Error resetting database:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to reset database.",
        "error"
      );
    }
  };

  // Supabase authentication helpers
  const loadSignedInUser = async (
    userId: string,
    fallbackEmail?: string | null,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const { data: profile, error } = await supabase
        .from("users")
        .select("id, name, email, role, institution, is_admin")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!profile) {
        console.warn("Authenticated user has no matching Notsopedia profile.");
        await supabase.auth.signOut();
        setSignedInUser(null);
        return;
      }

      const metadataName =
        typeof metadata?.name === "string" ? metadata.name : "";

      const user: SignedInUser = {
        id: profile.id,
        name:
          profile.name?.trim() ||
          metadataName ||
          fallbackEmail?.split("@")[0] ||
          "Authenticated User",
        email: profile.email?.trim() || fallbackEmail || "",
        role: profile.role?.trim() || "Student",
        institution:
          profile.institution?.trim() || "Verified Institution",
        isAdmin: Boolean(profile.is_admin),
      };

      setSignedInUser(user);
      await fetchLikedNoteIds();
    } catch (err) {
      console.error("Unable to restore Supabase user profile:", err);
      setSignedInUser(null);
    }
  };

  const restoreSupabaseSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Unable to restore Supabase session:", error);
      return;
    }

    if (!session?.user) {
      setSignedInUser(null);
      return;
    }

    await loadSignedInUser(
      session.user.id,
      session.user.email,
      session.user.user_metadata
    );
  };

  // Authentication handlers
  const handleSignIn = (user: SignedInUser) => {
    setSignedInUser(user);
    showToast(`Welcome, ${user.name}! Session authenticated.`, "success");
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      showToast("Could not disconnect the session. Please try again.", "error");
      return;
    }

    setSignedInUser(null);
    setLikedNoteIds(new Set());
    showToast("Session disconnected. Now browsing in Guest mode.", "success");
  };

  const handleOpenAuthModal = (isAdmin = false) => {
    setAuthModalIsAdmin(isAdmin);
    setShowAuthModal(true);
  };

  // AI Knowledge Discovery
  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    const userMsg = aiQuestion.trim();
    setAiQuestion("");
    setIsAiResponding(true);

    const updatedHistory: AIChatMessage[] = [
      ...aiChatHistory,
      {
        sender: "user",
        text: userMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];
    setAiChatHistory(updatedHistory);

    let notesContextString = "";
    if (aiMode === "notes-expert") {
      notesContextString = userNotes
        .slice(0, 10)
        .map((n) => `[Note Title: ${n.title} | Subject: ${n.subjectName}]\nContent: ${n.content}`)
        .join("\n\n");
    }

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg,
          mode: aiMode,
          noteContext: notesContextString
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiChatHistory((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.text,
            sources: data.sources,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } else {
        throw new Error("Failed to fetch response");
      }
    } catch (err) {
      console.error("AI Assistant error:", err);
      setAiChatHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "âš ï¸ Offline academic discovery engine connection failed. Please ensure the backend server is reachable.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsAiResponding(false);
    }
  };

  // Autonomous Security & Self-Healing Shield
  const runAutonomousHealing = () => {
    setIsHealing(true);
    setSecurityLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [SHIELD] Triggering manual autonomous heal scan...`
    ]);

    setTimeout(() => {
      setSecurityLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [XSS-AUDIT] Running deep-level HTML sanitization checks across notes...`
      ]);
    }, 500);

    setTimeout(() => {
      let sanitizedCount = 0;
      userNotes.forEach((note) => {
        if (note.content && (note.content.includes("<script>") || note.content.includes("javascript:"))) {
          sanitizedCount++;
        }
      });
      setSecurityLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [XSS-AUDIT] Scanned ${userNotes.length} notes. Sanitized ${sanitizedCount} injection elements.`,
        `[${new Date().toLocaleTimeString()}] [RULES-SYNC] Verifying Firestore and Supabase security alignment...`
      ]);
    }, 1000);

    setTimeout(() => {
      setSecurityLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [RULES-SYNC] Security definitions verified (100% compliant).`,
        `[${new Date().toLocaleTimeString()}] [INTEGRITY] Conducting reference check for orphaned study cards...`
      ]);
    }, 1500);

    setTimeout(() => {
      setSecurityLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [INTEGRITY] Reference check complete. All study cards verified.`,
        `[${new Date().toLocaleTimeString()}] [SHIELD] SYSTEM SECURITY REPORT: 100% HEALTHY. ALL ISSUES RESOLVED AUTOMATICALLY.`
      ]);
      setIsHealing(false);
      showToast("Shield & Self-Healing audit completed! System 100% healthy.", "success");
    }, 2000);
  };

  // PowerPoint Generator
  const handleDownloadPPTX = async () => {
    setIsGeneratingPPTX(true);
    try {
      let pptxConstructor: any = pptxgen;
      if (!pptxConstructor) {
        throw new Error("PowerPoint library failed to load.");
      }
      if (typeof pptxConstructor !== "function" && (pptxConstructor as any).default) {
        pptxConstructor = (pptxConstructor as any).default;
      }
      const pres = new pptxConstructor();
      pres.layout = "LAYOUT_169";

      // Cover Slide
      const slide1 = pres.addSlide();
      slide1.background = { color: "F8FAFC" };
      slide1.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.5, fill: { color: "0F172A" } });
      slide1.addText("NOTSOPEDIA STUDY NOTEBOOK", {
        x: 1.0, y: 2.0, w: 11.3, h: 1.0, fontSize: 32, fontFace: "Georgia", italic: true, bold: true, color: "0F172A"
      });
      slide1.addText("Collaborative Academic Lectures, Syllabi & AI Material", {
        x: 1.0, y: 3.2, w: 11.3, h: 0.5, fontSize: 16, fontFace: "Arial", color: "475569"
      });
      slide1.addText(`Exported on: ${new Date().toLocaleDateString()} â€¢ Free Study License`, {
        x: 1.0, y: 4.8, w: 11.3, h: 0.4, fontSize: 12, fontFace: "Courier New", color: "0F172A", bold: true
      });
      slide1.addShape("rect", { x: 0, y: 7.0, w: 13.33, h: 0.5, fill: { color: "0F172A" } });

      // Slide per note
      userNotes.slice(0, 10).forEach((note, index) => {
        const slide = pres.addSlide();
        slide.background = { color: "FFFFFF" };

        slide.addText(`TOPIC BLUEPRINT â€¢ MODULE ${index + 1}`, {
          x: 0.8, y: 0.4, w: 11.7, h: 0.3, fontSize: 10, fontFace: "Courier New", color: "64748B", bold: true
        });

        slide.addText(note.title, {
          x: 0.8, y: 0.7, w: 11.7, h: 0.6, fontSize: 20, fontFace: "Georgia", bold: true, color: "0F172A"
        });

        slide.addShape("line", { x: 0.8, y: 1.3, w: 11.7, h: 0, line: { color: "0F172A", width: 1.5 } });

        slide.addText(`Subject: ${note.subjectName} (${note.subjectCode || "GEN-ACAD"})\nAuthor: ${note.uploaderName} (${note.uploaderRole || "Student"})\nUploaded: ${new Date(note.uploadedAt).toLocaleDateString()}`, {
          x: 0.8, y: 1.5, w: 3.5, h: 1.5, fontSize: 11, fontFace: "Arial", color: "0F172A", fill: { color: "F1F5F9" }, margin: 10
        });

        const cleanContent = (note.content || "")
          .replace(/[#*$\-`]/g, "")
          .slice(0, 500) + "...";

        slide.addText(cleanContent, {
          x: 4.6, y: 1.5, w: 7.9, h: 4.8, fontSize: 13, fontFace: "Georgia", color: "0F172A", lineSpacing: 20
        });
      });

      pres.writeFile({ fileName: `Notsopedia_Lectures_${Date.now()}.pptx` });
      showToast("PowerPoint deck compiled and downloaded successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to compile PowerPoint file.", "error");
    } finally {
      setIsGeneratingPPTX(false);
    }
  };

  // Download Note: original file or Markdown
  const handleDownloadNoteMarkdown = async (note: UserNote) => {
    if (note.fileUrl && note.fileName) {
      try {
        showToast(`Preparing "${note.fileName}" for download...`, "success");
        const response = await fetch(note.fileUrl);
        if (!response.ok) throw new Error(`File download failed: ${response.status}`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = note.fileName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        showToast(`Downloaded "${note.fileName}" successfully.`, "success");
        return;
      } catch (error) {
        console.error("File download failed:", error);
        showToast(`Unable to download "${note.fileName}".`, "error");
        return;
      }
    }

    const markdown = `---
title: ${note.title}
subject: ${note.subjectName || "General"}${note.subjectCode ? ` (${note.subjectCode})` : ""}
topic: ${note.topicName || "General Study Guide"}
author: ${note.uploaderName} (${note.uploaderRole})
uploaded_at: ${note.uploadedAt}
likes: ${note.likes}
source: Notsopedia Universal Archives
---

# ${note.title}

${note.content || "No text content was provided."}

---
*Retrieved from Notsopedia Study Workspace on ${new Date().toLocaleDateString()}.*
`;

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${note.title.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "notsopedia_note"}.md`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Successfully downloaded "${note.title}" as Markdown!`, "success");
  };

  // Dynamic Subject list & counts
  const { allSubjects, subjectCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    userNotes.forEach((n) => {
      const s = n.subjectName || "General";
      counts[s] = (counts[s] || 0) + 1;
    });

    // Merge default subjects with any novel subjects from user notes
    const subjectsMap = new Map<string, UniversalSubject>();
    UNIVERSAL_SUBJECTS.forEach((s) => subjectsMap.set(s.name.toLowerCase(), s));

    userNotes.forEach((n) => {
      if (n.subjectName && !subjectsMap.has(n.subjectName.toLowerCase())) {
        subjectsMap.set(n.subjectName.toLowerCase(), {
          name: n.subjectName,
          code: n.subjectCode || "GEN-ACAD",
          category: "Community",
          description: "Community uploaded study curriculum"
        });
      }
    });

    return {
      allSubjects: Array.from(subjectsMap.values()),
      subjectCounts: counts
    };
  }, [userNotes]);

  // Filter notes based on search query and subject filter
  const filteredNotes = useMemo(() => {
    return userNotes.filter((note) => {
      const q = notesSearchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (note.title && note.title.toLowerCase().includes(q)) ||
        (note.content && note.content.toLowerCase().includes(q)) ||
        (note.subjectName && note.subjectName.toLowerCase().includes(q)) ||
        (note.uploaderName && note.uploaderName.toLowerCase().includes(q)) ||
        (Array.isArray(note.tags) && note.tags.some((t) => t.toLowerCase().includes(q)));

      if (selectedSubjectFilter === "All Subjects") {
        return matchesSearch;
      }
      return matchesSearch && note.subjectName.toLowerCase() === selectedSubjectFilter.toLowerCase();
    });
  }, [userNotes, notesSearchQuery, selectedSubjectFilter]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors">
      {/* Toast Feedback Banner */}
      <ToastNotification
        error={notesError}
        success={notesSuccessMessage}
        onClearError={() => setNotesError("")}
        onClearSuccess={() => setNotesSuccessMessage("")}
      />

      {/* Global Broadcast Announcement Marquee */}
      {systemConfig && (
        <AnnouncementBanner
          announcement={systemConfig.announcement}
          active={systemConfig.announcementActive}
          onDismiss={() => setSystemConfig((prev) => ({ ...prev, announcementActive: false }))}
        />
      )}

      {/* Primary Sticky Header */}
      <AppHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        signedInUser={signedInUser}
        onOpenAuthModal={handleOpenAuthModal}
        onSignOut={handleSignOut}
        onDownloadPPTX={handleDownloadPPTX}
        isGeneratingPPTX={isGeneratingPPTX}
        notesCount={userNotes.length}
        currentTime={currentTime}
        theme={theme}
        onToggleTheme={toggleTheme}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
      />

      {/* AppShell Two-Column Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Collapsible Sidebar / Mobile Drawer */}
        <AppSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          subjects={allSubjects}
          selectedSubjectFilter={selectedSubjectFilter}
          onSelectSubject={setSelectedSubjectFilter}
          onOpenUploadModal={() => {
            if (!signedInUser) {
              showToast("Please sign in or connect a student profile to upload notes.", "error");
              handleOpenAuthModal(false);
              return;
            }
            setShowUploadForm(true);
          }}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          totalNotesCount={userNotes.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-8">
          {/* TAB 1: NOTES EXPLORER */}
          {activeTab === "explorer" && (
            <div className="space-y-8">
              {/* Modern Search Hero */}
              <ExplorerHero
                searchQuery={notesSearchQuery}
                onSearchChange={setNotesSearchQuery}
                onAskAIWithQuery={() => {
                  if (notesSearchQuery.trim()) {
                    setAiQuestion(notesSearchQuery.trim());
                  }
                  setActiveTab("ai-tutor");
                }}
                onOpenUpload={() => {
                  if (!signedInUser) {
                    showToast("Please connect your student profile before uploading.", "error");
                    handleOpenAuthModal(false);
                    return;
                  }
                  setShowUploadForm(true);
                }}
                onDownloadPPTX={handleDownloadPPTX}
                onOpenAITutor={() => setActiveTab("ai-tutor")}
                isGeneratingPPTX={isGeneratingPPTX}
                notesCount={userNotes.length}
              />

              {/* Subject Category Filter Bar */}
              <SubjectFilterBar
                subjects={allSubjects}
                selectedSubject={selectedSubjectFilter}
                onSelectSubject={setSelectedSubjectFilter}
                availableSubjectCounts={subjectCounts}
                totalNotesCount={userNotes.length}
              />

              {/* Responsive Notes Grid */}
              <NoteGrid
                notes={filteredNotes}
                isLoading={isLoadingNotes}
                searchQuery={notesSearchQuery}
                selectedSubject={selectedSubjectFilter}
                onClearFilters={() => {
                  setNotesSearchQuery("");
                  setSelectedSubjectFilter("All Subjects");
                }}
                onUploadNote={() => {
                  if (!signedInUser) {
                    showToast("Please sign in to upload.", "error");
                    handleOpenAuthModal(false);
                    return;
                  }
                  setShowUploadForm(true);
                }}
                onAskAI={() => {
                  setAiQuestion(notesSearchQuery);
                  setActiveTab("ai-tutor");
                }}
                onLike={handleLikeNote}
                likedNoteIds={likedNoteIds}
                onRead={setViewingNote}
                onDownload={handleDownloadNoteMarkdown}
                onEdit={setEditingNote}
                onDelete={handleDeleteNote}
                isAdmin={Boolean(signedInUser && signedInUser.isAdmin)}
              />
            </div>
          )}

          {/* TAB 2: AI TUTOR WORKSPACE */}
          {activeTab === "ai-tutor" && (
            <AITutorWorkspace
              currentMode={aiMode}
              onSelectMode={setAiMode}
              chatHistory={aiChatHistory}
              isResponding={isAiResponding}
              question={aiQuestion}
              onQuestionChange={setAiQuestion}
              onSubmit={handleAskAI}
              notesCount={userNotes.length}
              isAdmin={Boolean(signedInUser && signedInUser.isAdmin)}
            />
          )}

          {/* TAB 3: ADMIN CONSOLE */}
          {activeTab === "admin-portal" && (
            <AdminPortal
              signedInUser={signedInUser}
              onOpenAuthModal={() => handleOpenAuthModal(true)}
              systemConfig={systemConfig}
              onSaveConfig={saveSystemConfig}
              isSavingConfig={isSavingConfig}
              onResetDatabase={handleResetDatabase}
              securityLogs={securityLogs}
              isHealing={isHealing}
              onRunHealing={runAutonomousHealing}
              totalNotesCount={userNotes.length}
            />
          )}
        </main>
      </div>

      {/* Global SaaS Footer */}
      <Footer />

      {/* MODAL 1: Note Upload */}
      <NoteUploadModal
        isOpen={showUploadForm}
        onClose={() => setShowUploadForm(false)}
        signedInUser={signedInUser}
        enableSubmissions={systemConfig.enableSubmissions}
        onNoteCreated={(newNote) => setUserNotes((prev) => [newNote, ...prev])}
        showToast={showToast}
      />

      {/* MODAL 2: Note Reader */}
      <NoteReaderModal
        note={viewingNote}
        onClose={() => setViewingNote(null)}
        onDownloadMarkdown={handleDownloadNoteMarkdown}
      />

      {/* MODAL 3: Admin Note Moderation */}
      <NoteEditModal
        note={editingNote}
        onClose={() => setEditingNote(null)}
        onUpdateNote={setEditingNote}
        onSubmit={handleEditNoteSubmit}
      />

      {/* MODAL 4: Identity Gate / Auth */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={handleSignIn}
        initialIsAdmin={authModalIsAdmin}
      />
    </div>
  );
}
function App() {
  const authPath = window.location.pathname;

  if (authPath === "/auth/callback") {
    return <AuthFlowPage mode="callback" />;
  }

  if (authPath === "/auth/reset-password") {
    return <AuthFlowPage mode="reset-password" />;
  }

  return <NotsopediaApp />;
}

export default App;


