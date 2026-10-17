import React, { useState, useEffect } from "react";
import {
  X,
  FolderPlus,
  Trash2,
  Edit2,
  Folder,
  BookOpen,
  Plus,
  Check,
  AlertTriangle,
  Layers,
  Calendar,
  Sparkles
} from "lucide-react";
import { StudyCollection, UserNote } from "../../types";
import { UI_LABELS } from "../../constants/labels";

interface StudyCollectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allNotes: UserNote[];
  userId?: string;
  onSelectCollectionFilter?: (noteIds: string[], collectionName: string) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function StudyCollectionsModal({
  isOpen,
  onClose,
  allNotes,
  userId,
  onSelectCollectionFilter,
  showToast
}: StudyCollectionsModalProps) {
  const storageKey = `notsopedia_collections_${userId || "guest"}`;

  const [collections, setCollections] = useState<StudyCollection[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [nameInput, setNameInput] = useState<string>("");
  const [descInput, setDescInput] = useState<string>("");
  const [categoryInput, setCategoryInput] = useState<StudyCollection["category"]>("subject");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(collections));
    } catch (err) {
      console.warn("Failed to persist study collections:", err);
    }
  }, [collections, storageKey]);

  const activeCollection = collections.find((c) => c.id === activeCollectionId) || null;

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      if (showToast) showToast("Collection name cannot be empty.", "error");
      return;
    }

    if (editingId) {
      // Edit existing
      setCollections((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, name: trimmed, description: descInput.trim() || undefined, category: categoryInput, updatedAt: new Date().toISOString() }
            : c
        )
      );
      if (showToast) showToast("Collection updated successfully.", "success");
      setEditingId(null);
    } else {
      // Create new
      const newCol: StudyCollection = {
        id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed,
        description: descInput.trim() || undefined,
        category: categoryInput,
        noteIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCollections((prev) => [newCol, ...prev]);
      setActiveCollectionId(newCol.id);
      if (showToast) showToast(`Created collection "${trimmed}".`, "success");
    }

    setNameInput("");
    setDescInput("");
    setIsCreating(false);
  };

  const handleStartEdit = (col: StudyCollection) => {
    setEditingId(col.id);
    setNameInput(col.name);
    setDescInput(col.description || "");
    setCategoryInput(col.category);
    setIsCreating(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingId) return;
    setCollections((prev) => prev.filter((c) => c.id !== deletingId));
    if (activeCollectionId === deletingId) {
      setActiveCollectionId(null);
    }
    if (showToast) showToast("Collection deleted.", "info");
    setDeletingId(null);
  };

  const handleToggleNoteInCollection = (noteId: string) => {
    if (!activeCollectionId) return;

    setCollections((prev) =>
      prev.map((c) => {
        if (c.id !== activeCollectionId) return c;
        const exists = c.noteIds.includes(noteId);
        const newIds = exists ? c.noteIds.filter((id) => id !== noteId) : [...c.noteIds, noteId];
        return { ...c, noteIds: newIds, updatedAt: new Date().toISOString() };
      })
    );
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collections-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="collections-modal-title"
                className="font-serif italic font-bold text-base text-slate-900 dark:text-white"
              >
                {UI_LABELS.collections.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {UI_LABELS.collections.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close collections modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Collection List */}
          <div className="md:col-span-1 border-r border-slate-100 dark:border-slate-800 pr-0 md:pr-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                Collections ({collections.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setNameInput("");
                  setDescInput("");
                  setCategoryInput("subject");
                  setIsCreating(true);
                }}
                className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition flex items-center space-x-1 text-xs font-semibold"
                aria-label="Create new study collection"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New</span>
              </button>
            </div>

            {collections.length === 0 && !isCreating ? (
              <div className="py-8 text-center space-y-2">
                <Folder className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {UI_LABELS.collections.emptyCollections}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {collections.map((col) => {
                  const isSelected = activeCollectionId === col.id;

                  return (
                    <div
                      key={col.id}
                      className={`group p-2.5 rounded-2xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 font-bold text-emerald-900 dark:text-emerald-200"
                          : "border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                      }`}
                      onClick={() => {
                        setActiveCollectionId(col.id);
                        setIsCreating(false);
                      }}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <Folder className={`h-4 w-4 shrink-0 ${isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                        <span className="truncate">{col.name}</span>
                      </div>

                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(col);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title="Rename/Edit"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(col.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-500"
                          title="Delete Collection"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Creation Form or Collection Details */}
          <div className="md:col-span-2 space-y-4">
            {isCreating ? (
              <form onSubmit={handleCreateCollection} className="space-y-4">
                <h3 className="font-serif italic font-bold text-sm text-slate-900 dark:text-white">
                  {editingId ? "Edit Collection" : "Create New Study Collection"}
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. CS-201 Finals Review, Microeconomics Exam"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="subject">Subject</option>
                    <option value="course">Course</option>
                    <option value="semester">Semester</option>
                    <option value="exam">Exam</option>
                    <option value="revision">Personal Revision List</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder="Brief notes about goals, syllabus chapters, or exam dates..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    {editingId ? "Save Changes" : "Create Collection"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : activeCollection ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif italic font-bold text-base text-slate-900 dark:text-white">
                      {activeCollection.name}
                    </h3>
                    {activeCollection.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {activeCollection.description}
                      </p>
                    )}
                    <span className="inline-block mt-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Category: {activeCollection.category}
                    </span>
                  </div>

                  {onSelectCollectionFilter && activeCollection.noteIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCollectionFilter(activeCollection.noteIds, activeCollection.name);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      Filter Notes by Collection
                    </button>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Include Study Notes ({activeCollection.noteIds.length} included)
                  </span>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {allNotes.map((note) => {
                      const isIncluded = activeCollection.noteIds.includes(note.id);

                      return (
                        <div
                          key={note.id}
                          onClick={() => handleToggleNoteInCollection(note.id)}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                            isIncluded
                              ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                              : "border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold truncate">{note.title}</p>
                            <p className="text-[10px] text-slate-400">{note.subjectName}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                            isIncluded
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          }`}>
                            {isIncluded && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-2">
                <Folder className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a collection on the left or create a new one to organize study notes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal for Deletion */}
        {deletingId && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Confirm Deletion</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Are you sure you want to delete this study collection? The notes inside will not be affected.
              </p>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
