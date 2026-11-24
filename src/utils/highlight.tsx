import React from 'react';

const KEYWORDS = new Set([
  'def',
  'class',
  'if',
  'elif',
  'else',
  'for',
  'while',
  'in',
  'not',
  'and',
  'or',
  'return',
  'break',
  'continue',
  'import',
  'from',
  'as',
  'with',
  'try',
  'except',
  'finally',
  'pass',
  'lambda',
  'yield',
  'is',
  'del',
  'global',
  'raise',
]);

const CONSTANTS = new Set(['True', 'False', 'None', 'self']);

const BUILTINS = new Set([
  'print',
  'input',
  'int',
  'float',
  'str',
  'bool',
  'len',
  'range',
  'map',
  'sum',
  'min',
  'max',
  'sorted',
  'list',
  'dict',
  'set',
  'tuple',
  'open',
  'ord',
  'chr',
  'abs',
  'type',
  'eval',
  'enumerate',
  'zip',
  'round',
]);

const TOKEN_RE =
  /(#.*$|f?"(?:\\.|[^"\\])*"|f?'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b)/gm;

export function highlightPythonLine(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;

  while ((match = TOKEN_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith('#')) {
      parts.push(
        <span key={key} className="text-zinc-400 dark:text-zinc-500 italic">
          {token}
        </span>
      );
    } else if (
      token.startsWith('"') ||
      token.startsWith("'") ||
      token.startsWith('f"') ||
      token.startsWith("f'")
    ) {
      parts.push(
        <span key={key} className="text-emerald-700 dark:text-[#ce9178]">
          {token}
        </span>
      );
    } else if (/^\d/.test(token)) {
      parts.push(
        <span key={key} className="text-amber-700 dark:text-[#b5cea8]">
          {token}
        </span>
      );
    } else if (KEYWORDS.has(token)) {
      parts.push(
        <span key={key} className="text-fuchsia-700 dark:text-[#c586c0] font-semibold">
          {token}
        </span>
      );
    } else if (CONSTANTS.has(token)) {
      parts.push(
        <span key={key} className="text-rose-600 dark:text-[#569cd6] font-medium">
          {token}
        </span>
      );
    } else if (BUILTINS.has(token)) {
      parts.push(
        <span key={key} className="text-sky-700 dark:text-[#dcdcaa]">
          {token}
        </span>
      );
    } else {
      parts.push(
        <span key={key} className="text-zinc-800 dark:text-zinc-200">
          {token}
        </span>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }
  return parts;
}

export function PythonCodeBlock({
  code,
  showLineNumbers = true,
  compact = false,
}: {
  code: string;
  showLineNumbers?: boolean;
  compact?: boolean;
}) {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  return (
    <pre
      className={`overflow-x-auto rounded-xl bg-zinc-50 dark:bg-[#111114] border border-zinc-200/90 dark:border-white/[0.08] font-mono text-zinc-800 dark:text-zinc-200 ${
        compact ? 'p-3 text-xs leading-5' : 'p-4 text-[13px] leading-6'
      }`}
    >
      <code>
        {lines.map((line, idx) => (
          <div key={idx} className="flex">
            {showLineNumbers && (
              <span className="select-none w-7 shrink-0 text-right pr-3 text-zinc-400 dark:text-zinc-600 text-[11px]">
                {idx + 1}
              </span>
            )}
            <span className="whitespace-pre">{highlightPythonLine(line)}</span>
          </div>
        ))}
      </code>
    </pre>
  );
}

/**
 * Renders inline markdown: `code` spans and **bold** spans cleanly.
 */
export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.startsWith('`') && seg.endsWith('`') && seg.length >= 2) {
          return (
            <code
              key={i}
              className="mx-0.5 px-1.5 py-0.5 rounded-md bg-zinc-900/[0.06] dark:bg-white/[0.07] text-zinc-800 dark:text-amber-200 font-mono text-[0.88em] border border-zinc-900/10 dark:border-white/10"
            >
              {seg.slice(1, -1)}
            </code>
          );
        }
        if (seg.startsWith('**') && seg.endsWith('**') && seg.length >= 4) {
          return (
            <strong key={i} className="font-bold text-slate-900 dark:text-white">
              {seg.slice(2, -2)}
            </strong>
          );
        }
        return <React.Fragment key={i}>{seg}</React.Fragment>;
      })}
    </span>
  );
}
