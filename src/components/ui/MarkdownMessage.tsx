'use client';

import React from 'react';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  if (!content) return null;

  // Split content by code blocks or tables or paragraphs
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let tableBuffer: string[] = [];
  let inTable = false;
  let listBuffer: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  const flushTable = (key: string) => {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer
      .map((row) => row.trim())
      .filter((row) => row.startsWith('|') && row.endsWith('|'))
      .map((row) =>
        row
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim())
      );

    if (rows.length >= 2) {
      const headerRow = rows[0];
      // Row 1 is usually separator (| :--- | :--- |)
      const dataRows = rows.slice(rows[1].some((c) => c.includes('---')) ? 2 : 1);

      elements.push(
        <div key={key} className="my-3 overflow-x-auto rounded-xl border border-stone-200 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#143D2A]/5 border-b border-stone-200">
                {headerRow.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5 font-bold text-[#143D2A]">
                    {formatInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {dataRows.map((r, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                  {r.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-stone-700 leading-relaxed">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableBuffer = [];
    inTable = false;
  };

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    if (listType === 'ol') {
      elements.push(
        <ol key={key} className="my-2.5 list-decimal list-outside pl-5 space-y-1 text-xs text-stone-700 leading-relaxed">
          {listBuffer.map((item, idx) => (
            <li key={idx}>{formatInline(item)}</li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={key} className="my-2.5 list-disc list-outside pl-5 space-y-1 text-xs text-stone-700 leading-relaxed">
          {listBuffer.map((item, idx) => (
            <li key={idx}>{formatInline(item)}</li>
          ))}
        </ul>
      );
    }
    listBuffer = [];
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for Markdown table line
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (inList) flushList(`list-${i}`);
      inTable = true;
      tableBuffer.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable(`table-${i}`);
    }

    // Check for ordered list line (e.g. "1. ")
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (inList && listType !== 'ol') flushList(`list-${i}`);
      inList = true;
      listType = 'ol';
      listBuffer.push(olMatch[2]);
      continue;
    }

    // Check for unordered list line (e.g. "- " or "* ")
    const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (ulMatch) {
      if (inList && listType !== 'ul') flushList(`list-${i}`);
      inList = true;
      listType = 'ul';
      listBuffer.push(ulMatch[1]);
      continue;
    }

    // Non-list line: flush existing list
    if (inList) {
      flushList(`list-${i}`);
    }

    // Blank line
    if (!trimmed) {
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-sm font-bold text-[#143D2A] mt-3.5 mb-1.5 flex items-center gap-1.5">
          {formatInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-extrabold text-[#143D2A] mt-4 mb-2">
          {formatInline(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-black text-[#143D2A] mt-4 mb-2">
          {formatInline(trimmed.slice(2))}
        </h2>
      );
    } else if (trimmed === '---') {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-stone-200" />);
    } else {
      // Normal paragraph
      elements.push(
        <p key={`p-${i}`} className="my-2 text-xs sm:text-sm text-stone-800 leading-relaxed">
          {formatInline(trimmed)}
        </p>
      );
    }
  }

  if (inTable) flushTable('table-end');
  if (inList) flushList('list-end');

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
}

/**
 * Formats inline bold (**text**), italics (*text*), and code (`code`)
 */
function formatInline(text: string): React.ReactNode {
  // Pattern matching **bold**, *italic*, `code`, [link](url)
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-[#143D2A]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-stone-700">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-stone-100 text-[#143D2A] font-mono text-[11px]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2F7D4F] font-semibold underline hover:text-[#143D2A]"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
