import React from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface ToastNotificationProps {
  error?: string;
  success?: string;
  onClearError?: () => void;
  onClearSuccess?: () => void;
}

export function ToastNotification({
  error,
  success,
  onClearError,
  onClearSuccess
}: ToastNotificationProps) {
  if (!error && !success) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {error && (
        <div className="pointer-events-auto bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200 px-4 py-3 rounded-xl shadow-lg flex items-start space-x-3 text-xs font-sans animate-in slide-in-from-top-2 duration-200 backdrop-blur-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{error}</div>
          {onClearError && (
            <button
              onClick={onClearError}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-800 p-0.5 rounded transition"
              title="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {success && (
        <div className="pointer-events-auto bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 px-4 py-3 rounded-xl shadow-lg flex items-start space-x-3 text-xs font-sans animate-in slide-in-from-top-2 duration-200 backdrop-blur-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{success}</div>
          {onClearSuccess && (
            <button
              onClick={onClearSuccess}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 p-0.5 rounded transition"
              title="Dismiss message"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
