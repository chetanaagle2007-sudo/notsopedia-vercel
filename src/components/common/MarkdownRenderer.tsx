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
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-slate-700 text-slate-300 transition text-[10px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
          title="Copy code"
          aria-label={copied ? "Code copied to clipboard" : "Copy code block to clipboard"}
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
    if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={i} className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1.5 tracking-tight">
          {formatInline(line.slice(5))}
        </h4>
      );
      continue;
    }
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

    // Horizontal rule (--- or *** or ___ with optional spaces)
    if (/^(\s*[-*_]){3,}\s*$/.test(line)) {
      elements.push(
        <hr key={i} className="my-3 border-t border-slate-200 dark:border-slate-700" />
      );
      continue;
    }

    // Table detection: line starting and ending with | and followed by a divider |---|
    if (line.trim().startsWith("|") && line.trim().endsWith("|") && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const isDivider = /^\|(\s*:?-+:?\s*\|)+$/.test(nextLine);
      if (isDivider) {
        const headerRow = line.trim().slice(1, -1).split("|").map((c) => c.trim());
        const bodyRows: string[][] = [];
        let j = i + 2;
        while (j < lines.length && lines[j].trim().startsWith("|") && lines[j].trim().endsWith("|")) {
          const rowCells = lines[j].trim().slice(1, -1).split("|").map((c) => c.trim());
          bodyRows.push(rowCells);
          j++;
        }
        elements.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-3.5 py-2">
                      {formatInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bodyRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={
                      rIdx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/60 dark:bg-slate-800/40"
                    }
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-slate-700 dark:text-slate-300">
                        {formatInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = j - 1;
        continue;
      }
    }

    // Bullet item (- , * , + )
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ") || line.trim().startsWith("+ ")) {
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

    // Multiple-Choice Quiz Option (e.g. A) Option, B. Option, (C) Option)
    const mcqMatch = line.trim().match(/^([A-D])[\).\:]\s+(.*)/i) || line.trim().match(/^\(([A-D])\)\s+(.*)/i);
    if (mcqMatch) {
      elements.push(
        <div
          key={i}
          className="my-1.5 flex items-start gap-2.5 p-2 sm:p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition shadow-2xs"
        >
          <span className="h-5 w-5 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 font-mono mt-0.5 border border-emerald-300/40 dark:border-emerald-700/40">
            {mcqMatch[1].toUpperCase()}
          </span>
          <span className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
            {formatInline(mcqMatch[2])}
          </span>
        </div>
      );
      continue;
    }

    // Correct Answer Highlight Card
    const answerMatch = line.trim().match(/^(\*\*|)?(Correct Answer|Answer):?(\*\*|)?\s*(.*)/i);
    if (answerMatch && answerMatch[4].trim()) {
      elements.push(
        <div
          key={i}
          className="my-3 p-3 rounded-xl border border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-medium flex items-start gap-2.5 shadow-2xs"
        >
          <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5">
            Correct Answer
          </span>
          <div className="flex-1">
            {formatInline(answerMatch[4])}
          </div>
        </div>
      );
      continue;
    }

    // Explanation Callout Card
    const expMatch = line.trim().match(/^(\*\*|)?(Explanation):?(\*\*|)?\s*(.*)/i);
    if (expMatch && expMatch[4].trim()) {
      elements.push(
        <div
          key={i}
          className="my-3 p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/30 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed shadow-2xs"
        >
          <div className="font-semibold text-indigo-700 dark:text-indigo-400 text-xs uppercase font-mono tracking-wider mb-1">
            Explanation
          </div>
          <div>
            {formatInline(expMatch[4])}
          </div>
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

// Inline formatting: **bold**, `code`, $math$, *italic*, [link](url)
function formatInline(text: string): React.ReactNode {
  // Regex to split on markdown links, bold, inline code, and math tokens
  const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`|\$.*?\$|\*.*?\*)/g);

  return parts.map((part, index) => {
    // Markdown link: [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const linkLabel = linkMatch[1];
      const linkUrl = linkMatch[2];
      const isExternal = linkUrl.startsWith("http://") || linkUrl.startsWith("https://");
      return (
        <a
          key={index}
          href={linkUrl}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-emerald-600 dark:text-emerald-400 font-semibold underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
        >
          {linkLabel}
        </a>
      );
    }
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

