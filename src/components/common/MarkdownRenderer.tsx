import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  fontSize?: "normal" | "large" | "xlarge";
}

function CodeBlock({ code, language }: { code: string; language: string; key?: React.Key }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 text-slate-100 text-xs font-mono shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-[11px] text-slate-400">
        <span className="uppercase font-semibold tracking-wider text-emerald-400">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-slate-700 text-slate-300 transition text-[10px]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content, className = "", fontSize = "normal" }: MarkdownRendererProps) {
  if (!content) return null;

  // Process markdown blocks: code blocks, headers, bullet lists, blockquotes, tables, paragraphs
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = "";

  const sizeClasses = {
    normal: "text-sm leading-relaxed",
    large: "text-base leading-relaxed",
    xlarge: "text-lg leading-relaxed",
  }[fontSize];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // Closing code block
        elements.push(
          <CodeBlock
            key={`code-${i}`}
            code={codeBuffer.join("\n")}
            language={codeLanguage}
          />
        );
        codeBuffer = [];
        codeLanguage = "";
        inCodeBlock = false;
      } else {
        // Opening code block
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2 tracking-tight">
          {formatInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2.5 pb-1 border-b border-slate-200 dark:border-slate-800 tracking-tight">
          {formatInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-xl font-extrabold text-slate-900 dark:text-white mt-6 mb-3 pb-1.5 border-b border-slate-200 dark:border-slate-800 tracking-tight">
          {formatInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-emerald-500 pl-3 py-1 my-2 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-700 dark:text-slate-300 italic text-xs rounded-r">
          {formatInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet item
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const indent = line.search(/\S/);
      elements.push(
        <div key={i} className="flex items-start my-1 text-slate-700 dark:text-slate-300" style={{ paddingLeft: `${indent * 4}px` }}>
          <span className="text-emerald-500 dark:text-emerald-400 mr-2 shrink-0 font-bold">•</span>
          <span>{formatInline(line.trim().slice(2))}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex items-start my-1 text-slate-700 dark:text-slate-300">
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold mr-2 shrink-0 text-xs">
            {numMatch[1]}.
          </span>
          <span>{formatInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Math block ($$...$$)
    if (line.trim().startsWith("$$") && line.trim().endsWith("$$") && line.trim().length > 4) {
      elements.push(
        <div key={i} className="my-3 py-2 px-3 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-center font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto border border-slate-200 dark:border-slate-700">
          {line.trim().slice(2, -2)}
        </div>
      );
      continue;
    }

    // Blank line
    if (!line.trim()) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="my-1 text-slate-700 dark:text-slate-300">
        {formatInline(line)}
      </p>
    );
  }

  // Flush any open code block
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <CodeBlock
        key="code-open-end"
        code={codeBuffer.join("\n")}
        language={codeLanguage}
      />
    );
  }

  return <div className={`space-y-1 ${sizeClasses} ${className}`}>{elements}</div>;
}

// Inline formatting: **bold**, `code`, $math$, *italic*
function formatInline(text: string): React.ReactNode {
  // Regex to split on bold, inline code, and math tokens
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$.*?\$|\*.*?\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-mono text-[0.85em] border border-slate-200 dark:border-slate-700 font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      return (
        <span
          key={index}
          className="px-1 py-0.5 font-mono text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded text-[0.9em]"
        >
          {part.slice(1, -1)}
        </span>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return (
        <em key={index} className="italic text-slate-800 dark:text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
