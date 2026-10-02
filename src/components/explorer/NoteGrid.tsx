import React from "react";
import { BookOpen } from "lucide-react";
import { UserNote } from "../../types";
import { NoteCard } from "./NoteCard";
import { SkeletonCard } from "../common/SkeletonCard";
import { EmptyState } from "../common/EmptyState";

interface NoteGridProps {
  notes: UserNote[];
  isLoading: boolean;
  searchQuery: string;
  selectedSubject: string;
  onClearFilters: () => void;
  onUploadNote: () => void;
  onAskAI: () => void;
  onLike: (id: string) => void;
  likedNoteIds: Set<string>;
  onRead: (note: UserNote) => void;
  onDownload: (note: UserNote) => void;
  onEdit?: (note: UserNote) => void;
  onDelete?: (id: string) => void;
  isAdmin: boolean;
}

export function NoteGrid({
  notes,
  isLoading,
  searchQuery,
  selectedSubject,
  onClearFilters,
  onUploadNote,
  onAskAI,
  onLike,
  likedNoteIds,
  onRead,
  onDownload,
  onEdit,
  onDelete,
  isAdmin
}: NoteGridProps) {
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-serif italic text-lg md:text-xl font-bold text-slate-900 dark:text-white">
            Academic Bulletin & Peer Lectures
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {isLoading ? "Syncing notes..." : `${notes.length} curated ${notes.length === 1 ? "document" : "documents"}`}
        </span>
      </div>

      {/* Grid content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          selectedSubject={selectedSubject}
          onClearFilters={onClearFilters}
          onUploadNote={onUploadNote}
          onAskAI={onAskAI}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onLike={onLike}
              isLiked={likedNoteIds.has(note.id)}
              onRead={onRead}
              onDownload={onDownload}
              onEdit={onEdit}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}





