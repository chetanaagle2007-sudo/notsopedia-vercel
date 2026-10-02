import React from "react";
import { Shield, X, Save } from "lucide-react";
import { UserNote } from "../../types";

interface NoteEditModalProps {
  note: UserNote | null;
  onClose: () => void;
  onUpdateNote: (note: UserNote) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function NoteEditModal({
  note,
  onClose,
  onUpdateNote,
  onSubmit
}: NoteEditModalProps) {
  if (!note) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl p-6 md:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
            <Shield className="h-5 w-5" />
            <h3 className="font-serif italic font-bold text-xl text-slate-900 dark:text-white">
              Moderate Study Document
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Document Title
            </label>
            <input
              type="text"
              value={note.title}
              onChange={(e) => onUpdateNote({ ...note, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Moderated Body Content (Markdown Supported)
            </label>
            <textarea
              rows={8}
              value={note.content || ""}
              onChange={(e) => onUpdateNote({ ...note, content: e.target.value })}
              placeholder="Leave blank if this is an attachment-only study resource."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
            <div>
              <label className="block text-[11px] font-semibold text-amber-950 dark:text-amber-300 mb-1">
                Assign Subject
              </label>
              <input
                type="text"
                value={note.subjectName}
                onChange={(e) => onUpdateNote({ ...note, subjectName: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-amber-950 dark:text-amber-300 mb-1">
                Topic / Chapter Tag
              </label>
              <input
                type="text"
                value={note.topicName}
                onChange={(e) => onUpdateNote({ ...note, topicName: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Action buttons */}
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
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Save Moderated Overrides</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
