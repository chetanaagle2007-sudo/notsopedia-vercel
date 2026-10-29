import React, { useState, useEffect } from "react";
import { Sparkles, Copy, Check, ExternalLink, Volume2, Square, Cpu } from "lucide-react";
import { AIChatMessage as AIChatMessageType } from "../../types";
import { MarkdownRenderer } from "../common/MarkdownRenderer";

interface AIChatMessageProps {
  message: AIChatMessageType;
  key?: React.Key;
}

function cleanSpeechText(text: string): string {
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove Markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove headers (# Header)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italics
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    // Remove blockquotes (> quote)
    .replace(/^>\s+/gm, "")
    // Remove bullet points
    .replace(/^[-*+]\s+/gm, "")
    // Remove LaTeX math $$...$$ and $...$
    .replace(/\$\$[\s\S]*?\$\$/g, "Mathematical formula.")
    .replace(/\$([^$]+)\$/g, "$1")
    // Collapse excess whitespace
    .replace(/\s+/g, " ")
    .trim();
}

export function AIChatMessage({ message }: AIChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isUser = message.sender === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const clean = cleanSpeechText(message.text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (isPlaying && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);

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
            {message.provider && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                  <Cpu className="h-2.5 w-2.5" />
                  <span>
                    {message.provider === "mind-ai" ? "MIND-AI" : message.provider}
                    {message.executionMode ? ` (${message.executionMode})` : ""}
                  </span>
                </span>
              </>
            )}
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

            {/* Quick Actions: Read Aloud & Copy */}
            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={handleToggleSpeak}
                className={`flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded transition ${
                  isPlaying
                    ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40"
                    : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                }`}
                title={isPlaying ? "Stop speaking" : "Read aloud"}
                aria-label={isPlaying ? "Stop speech" : "Read AI response aloud"}
              >
                {isPlaying ? (
                  <>
                    <Square className="h-3 w-3 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3 w-3" />
                    <span>Read Aloud</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition rounded px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                title="Copy response"
                aria-label={copied ? "AI response copied to clipboard" : "Copy AI response to clipboard"}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
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
