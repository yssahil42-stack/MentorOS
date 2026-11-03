import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import DOMPurify from 'dompurify';
import { cn } from '../../utils/cn';

const ALLOWED_TAGS = [
  'b',
  'i',
  'em',
  'strong',
  'a',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'code',
  'pre',
  'blockquote',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'span',
  'br',
  'div',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'title'];

interface MarkdownRendererProps {
  content: string;
  className?: string;
  showCopyButton?: boolean;
  rawHtml?: boolean;
}

export function MarkdownRenderer({
  content,
  className,
  showCopyButton = true,
  rawHtml = false,
}: MarkdownRendererProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isTruncated = (content?.length ?? 0) > 10000;
  const displayContent = isTruncated && !isExpanded ? content.slice(0, 10000) : content;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (rawHtml) {
    const sanitized = DOMPurify.sanitize(displayContent, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    });
    return (
      <div className={cn('relative group', className)}>
        {showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-bg-surface/90 hover:bg-bg-elevated border border-border-base text-text-secondary hover:text-text-primary transition-all shadow-sm"
            title="Copy content"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
        <div
          className="space-y-1 font-sans text-xs text-text-secondary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
        {isTruncated && (
          <div className="pt-3 flex items-center justify-start">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-semibold text-solar-500 hover:text-solar-400 underline transition-colors cursor-pointer"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Helper to parse markdown lines into structured elements
  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    const flushTable = (key: number) => {
      if (tableHeaders.length > 0 || tableRows.length > 0) {
        elements.push(
          <div
            key={`table-${key}`}
            className="my-3 overflow-x-auto rounded-xl border border-border-base bg-bg-surface/60"
          >
            <table className="w-full text-left text-xs border-collapse">
              {tableHeaders.length > 0 && (
                <thead>
                  <tr className="bg-bg-elevated border-b border-border-base text-text-primary font-bold">
                    {tableHeaders.map((th, idx) => (
                      <th key={idx} className="p-2.5 font-semibold text-emerald-400">
                        {th.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-border-subtle">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-bg-elevated/40 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2.5 text-text-secondary">
                        {renderInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeaders = [];
        tableRows = [];
        inTable = false;
      }
    };

    const flushCodeBlock = (key: number) => {
      if (codeBuffer.length > 0) {
        elements.push(
          <pre
            key={`code-${key}`}
            className="my-3 p-3.5 rounded-xl bg-bg-base/90 border border-border-base text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed"
          >
            {codeBuffer.join('\n')}
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      }
    };

    const renderInline = (str: string): React.ReactNode => {
      // Split on bold (**text**), inline code (`code`), or arrow symbols
      const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
      return parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-text-primary">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={pIdx}
              className="px-1.5 py-0.5 rounded bg-bg-base border border-border-base text-[11px] font-mono text-emerald-400"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Handle Code Blocks
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock(index);
        } else {
          flushTable(index);
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Handle Table Rows
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

        // Check if it's separator row (|---|---|)
        if (cells.every((c) => /^:?-+:?$/.test(c))) {
          return;
        }

        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        flushTable(index);
      }

      // Horizontal separator
      if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={index} className="my-4 border-border-base/70" />);
        return;
      }

      // Headers
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h2
            key={index}
            className="text-base sm:text-lg font-black text-text-primary mt-4 mb-2 flex items-center gap-2"
          >
            <span className="w-1.5 h-4 rounded-full bg-emerald-500 inline-block" />
            {renderInline(trimmed.replace(/^#\s+/, ''))}
          </h2>
        );
        return;
      }

      if (trimmed.startsWith('## ')) {
        elements.push(
          <h3
            key={index}
            className="text-sm sm:text-base font-bold text-text-primary mt-3.5 mb-1.5 flex items-center gap-2"
          >
            <span className="w-1 h-3.5 rounded-full bg-amber-400 inline-block" />
            {renderInline(trimmed.replace(/^##\s+/, ''))}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={index} className="text-xs sm:text-sm font-bold text-emerald-400 mt-3 mb-1">
            {renderInline(trimmed.replace(/^###\s+/, ''))}
          </h4>
        );
        return;
      }

      if (trimmed.startsWith('#### ')) {
        elements.push(
          <h5 key={index} className="text-xs font-semibold text-text-primary mt-2 mb-1">
            {renderInline(trimmed.replace(/^####\s+/, ''))}
          </h5>
        );
        return;
      }

      // Blockquotes / Golden rule callouts
      if (
        trimmed.startsWith('> ') ||
        trimmed.startsWith('The most important rule:') ||
        trimmed.startsWith('Golden Rule:')
      ) {
        elements.push(
          <div
            key={index}
            className="my-3 p-3.5 rounded-xl border-l-4 border-emerald-500 bg-emerald-500/10 text-xs sm:text-sm text-text-primary font-medium italic shadow-sm"
          >
            {renderInline(trimmed.replace(/^>\s*/, ''))}
          </div>
        );
        return;
      }

      // Bullet list items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li
            key={index}
            className="text-xs text-text-secondary ml-4 list-disc marker:text-emerald-500 leading-relaxed py-0.5"
          >
            {renderInline(trimmed.replace(/^[-*]\s+/, ''))}
          </li>
        );
        return;
      }

      // Numbered list items
      if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <li
            key={index}
            className="text-xs text-text-secondary ml-4 list-decimal marker:text-amber-400 leading-relaxed py-0.5"
          >
            {renderInline(trimmed.replace(/^\d+\.\s+/, ''))}
          </li>
        );
        return;
      }

      // Empty lines
      if (!trimmed) {
        elements.push(<div key={index} className="h-1.5" />);
        return;
      }

      // Raw / inline HTML line (sanitized with DOMPurify)
      if (/<[a-z][\s\S]*>/i.test(trimmed)) {
        elements.push(
          <div
            key={index}
            className="text-xs text-text-secondary leading-relaxed my-1"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(trimmed, { ALLOWED_TAGS, ALLOWED_ATTR }),
            }}
          />
        );
        return;
      }

      // Standard paragraphs
      elements.push(
        <p key={index} className="text-xs text-text-secondary leading-relaxed my-1">
          {renderInline(trimmed)}
        </p>
      );
    });

    flushTable(lines.length);
    flushCodeBlock(lines.length);

    return elements;
  };

  return (
    <div className={cn('relative group', className)}>
      {showCopyButton && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-bg-surface/90 hover:bg-bg-elevated border border-border-base text-text-secondary hover:text-text-primary transition-all shadow-sm"
          title="Copy Roadmap text"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Roadmap</span>
            </>
          )}
        </button>
      )}

      <div className="space-y-1 font-sans">{renderFormattedMarkdown(displayContent)}</div>

      {isTruncated && (
        <div className="pt-3 flex items-center justify-start">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-solar-500 hover:text-solar-400 underline transition-colors cursor-pointer"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      )}
    </div>
  );
}

export default MarkdownRenderer;
