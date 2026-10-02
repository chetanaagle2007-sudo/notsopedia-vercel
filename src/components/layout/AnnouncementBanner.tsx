import React from "react";
import { Megaphone, X } from "lucide-react";

interface AnnouncementBannerProps {
  announcement: string;
  active: boolean;
  onDismiss: () => void;
}

export function AnnouncementBanner({ announcement, active, onDismiss }: AnnouncementBannerProps) {
  if (!active || !announcement) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white px-4 py-2.5 text-xs font-sans tracking-wide flex items-center justify-between border-b border-emerald-800/40 select-none shadow-xs">
      <div className="flex items-center space-x-2.5 overflow-hidden truncate max-w-5xl mx-auto">
        <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Megaphone className="h-3 w-3" />
          <span>Notice</span>
        </span>
        <span className="truncate font-medium">{announcement}</span>
      </div>
      <button
        onClick={onDismiss}
        className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-md transition shrink-0 ml-3"
        title="Dismiss announcement"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
