import React, { useState } from "react";
import { Sparkles, User, Copy, Check, ExternalLink } from "lucide-react";
import { AIChatMessage as AIChatMessageType } from "../../types";
import { MarkdownRenderer } from "../common/MarkdownRenderer";

interface AIChatMessageProps {
  message: AIChatMessageType;
  key?: React.Key;
}

export function AIChatMessage({ message }: AIChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex flex-col max-w-[90%] md:max-w-[85%] ${
        isUser ? "ml-auto items-end" : "mr-auto items-start"
      }`}
    >
      {/* Sender & Timestamp */}
      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-mono mb-1.5 px-1">
        {isUser ? (
          <>
            <span>You</span>
            <span>•</span>
            <span>{message.timestamp}</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Notsopedia AI</span>
            <span>•</span>
            <span>{message.timestamp}</span>
          </>
        )}
      </div>

      {/* Message Balloon */}
      <div
        className={`p-4 md:p-5 rounded-2xl shadow-xs text-sm leading-relaxed ${
          isUser
            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-tr-xs"
            : "bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/80"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.text}</p>
        ) : (
          <div className="space-y-3">
            <MarkdownRenderer content={message.text} />

            {/* Citations and sources */}
            {Array.isArray(message.sources) && message.sources.length > 0 && (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                <span className="block font-semibold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Referenced Study Notes & Sources:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {message.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.uri}
                      target={src.uri.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 text-[11px] transition shadow-2xs"
                      title={src.title}
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[160px]">{src.title || "Note Reference"}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Quick action: Copy response */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy answer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
