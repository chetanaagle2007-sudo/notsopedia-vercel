import React, { useState, useEffect } from "react";
import { Plus, X, UserCheck, AlertTriangle, Sparkles, BookOpen } from "lucide-react";
import { supabase } from "../../supabase";
import { SignedInUser, UserNote } from "../../types";
import { FileDropzone } from "./FileDropzone";

interface NoteUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  signedInUser: SignedInUser | null;
  enableSubmissions: boolean;
  onNoteCreated: (note: UserNote) => void;
  showToast: (message: string, type: "success" | "error") => void;
}

export function NoteUploadModal({
  isOpen,
  onClose,
  signedInUser,
  enableSubmissions,
  onNoteCreated,
  showToast
}: NoteUploadModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [noteType, setNoteType] = useState("Study Notes");
  const [tags, setTags] = useState("");
  const [language, setLanguage] = useState("English");
  const [sourceType, setSourceType] = useState("Self Written");

  // Uploader credentials
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderRole, setUploaderRole] = useState("Student");
  const [uploaderEmail, setUploaderEmail] = useState("");

  // Attachment state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill from signed-in user
  useEffect(() => {
    if (signedInUser) {
      setUploaderName(signedInUser.name || "");
      setUploaderRole(signedInUser.role || "Student");
      setUploaderEmail(signedInUser.email || "");
    }
  }, [signedInUser, isOpen]);

  if (!isOpen) return null;

  const handleFileSelected = (file: File) => {
    setAttachedFile(file);
  };

  const handleClearFile = () => {
    setAttachedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!enableSubmissions) {
      showToast("Note submissions are currently locked down by the administrator.", "error");
      return;
    }

    if (!title.trim() || (!content.trim() && !attachedFile) || !uploaderName.trim()) {
      showToast("Please provide a Title, Author Name, and either Note Content or an Attached File.", "error");
      return;
    }

    setIsSubmitting(true);

    const payload: any = {
      title: title.trim(),
      content: content.trim(),
      subjectName: subjectName.trim() || "General",
      subjectCode: "GEN-ACAD",
      topicName: topicName.trim() || "General Study Guide",
      uploaderName: uploaderName.trim(),
      uploaderRole: uploaderRole.trim() || "Student",
      uploaderEmail: uploaderEmail.trim(),
      noteType: noteType.trim() || "General",
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      language: language.trim(),
      sourceType: sourceType.trim() || (attachedFile ? "File Upload" : "Typed Note")
    };

    // Upload attached file to Supabase Storage bucket "Notesopedia"
    if (attachedFile) {
      try {
        const safeFileName = attachedFile.name.replace(/[^\w.\-() ]/g, "_");
        const storagePath = `${Date.now()}-${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("Notesopedia")
          .upload(storagePath, attachedFile, {
            contentType: attachedFile.type || "application/octet-stream",
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("Notesopedia")
          .getPublicUrl(storagePath);

        if (!publicUrlData?.publicUrl) {
          throw new Error("Supabase did not return a public file URL.");
        }

        payload.fileUrl = publicUrlData.publicUrl;
        payload.fileName = attachedFile.name;
        payload.fileSize = attachedFile.size;
      } catch (storageErr: any) {
        console.error("Supabase Storage upload failed:", storageErr);
        showToast("File upload to Supabase Storage failed. Note was not published.", "error");
        setIsSubmitting(false);
        return;
      }
    }

    // Publish note record to backend
    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        showToast("Your sign-in session has expired. Please sign in again.", "error");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdNote = await res.json();
        onNoteCreated(createdNote);
        showToast("Success! Your study note is stored permanently in Supabase.", "success");

        // Reset inputs
        setTitle("");
        setContent("");
        setTopicName("");
        setAttachedFile(null);
        onClose();
      } else {
        let errorMsg = "Failed to publish note.";
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch (_) {}
        showToast(`Server error: ${errorMsg}`, "error");
      }
    } catch (err: any) {
      console.error("Network error uploading note:", err);

      // Offline fallback
      const offlineNote: UserNote = {
        id: "offline-" + Date.now(),
        ...payload,
        uploadedAt: new Date().toISOString(),
        likes: 0
      };

      if (attachedFile) {
        offlineNote.fileName = attachedFile.name;
        offlineNote.fileUrl = "javascript:void(0)";
        offlineNote.fileSize = attachedFile.size;
      }

      onNoteCreated(offlineNote);
      showToast("Server unreachable. Note saved locally to your device.", "success");
      setAttachedFile(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif italic font-bold text-xl text-slate-900 dark:text-white">
                Publish Study Document
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share academic notes, exam blueprints, or lecture summaries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lockdown Warning if submissions are closed */}
        {!enableSubmissions && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center space-x-3 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>Note submissions are currently locked down by the administrator.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Uploader Credentials Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 p-4 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Author & Contributor Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Author Name *
                </label>
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  placeholder="e.g. Chetana Agle"
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={uploaderEmail}
                  onChange={(e) => setUploaderEmail(e.target.value)}
                  placeholder="e.g. chetan@university.edu"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Academic Role
                </label>
                <select
                  value={uploaderRole}
                  onChange={(e) => setUploaderRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Student">Student</option>
                  <option value="Representative">Class Rep (CR)</option>
                  <option value="Professor">Professor</option>
                  <option value="Lead TA">Teaching Assistant</option>
                </select>
              </div>
            </div>
          </div>

          {/* Title & Subject */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Note Title / Thesis *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Understanding Graph Traversal: BFS vs DFS Algorithms"
              required
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject / Course
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Data Structures, Quantum Physics"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chapter / Specific Topic
              </label>
              <input
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g. Graph Algorithms, Wave Functions"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Metadata tags, category, language */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Category
              </label>
              <input
                type="text"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                placeholder="e.g. Lecture, Revision"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. algorithms, trees, exam"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Origin / Source
              </label>
              <input
                type="text"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                placeholder="e.g. University Lecture, Book"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Note content (Markdown enabled) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Study Notes Body <span className="text-slate-400 font-normal">(Markdown supported)</span>
              </label>
              <span className="text-[10px] text-slate-400">Optional if attaching a file</span>
            </div>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write formulas, summary, key points, or code blocks here... (e.g. # Chapter 1&#10;- Point A&#10;```python&#10;def run(): pass&#10;```)"
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* File Upload Dropzone */}
          <FileDropzone
            fileName={attachedFile ? attachedFile.name : ""}
            fileSize={attachedFile ? attachedFile.size : 0}
            onFileSelected={handleFileSelected}
            onClearFile={handleClearFile}
          />

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !enableSubmissions}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-xs shadow-sm flex items-center space-x-2 transition"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Publishing to Supabase...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Publish Note</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

