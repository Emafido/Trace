'use client';

import React from 'react';
import { DiffLine } from '@/data/incidents/duplicate-payment';

interface DiffViewerProps {
  lines: DiffLine[];
  selectedLine: number | null;
  onSelectLine: (lineNum: number) => void;
  checkedResult?: {
    lineNum: number;
    status: 'correct' | 'partial' | 'incorrect';
    explanation: string;
  } | null;
}

export function DiffViewer({
  lines,
  selectedLine,
  onSelectLine,
  checkedResult,
}: DiffViewerProps) {
  return (
    <div className="font-mono text-[13px] md:text-[14px] leading-relaxed bg-[#0B0D10] rounded-[8px] border border-[#262B33] overflow-x-auto select-text focus-within:ring-1 focus-within:ring-[#F5A524]/50">
      <div className="min-w-[540px]">
        {lines.map((line) => {
          const isSelected = selectedLine === line.lineNum;
          const isAdd = line.type === 'add';
          const isDel = line.type === 'del';

          let bgClass = 'hover:bg-[#181C22]/80 text-[#E8EAED]';
          let borderClass = 'border-l-2 border-transparent';

          if (isAdd) {
            bgClass = 'bg-[rgba(63,185,80,0.12)] text-[#7EE787] hover:bg-[rgba(63,185,80,0.18)]';
          } else if (isDel) {
            bgClass = 'bg-[rgba(248,81,73,0.12)] text-[#FFA198] hover:bg-[rgba(248,81,73,0.18)]';
          }

          if (isSelected) {
            bgClass = 'bg-[rgba(245,165,36,0.18)] text-[#F5A524]';
            borderClass = 'border-l-2 border-[#F5A524]';
          }

          return (
            <button
              key={line.lineNum}
              type="button"
              onClick={() => onSelectLine(line.lineNum)}
              aria-pressed={isSelected}
              aria-label={`Line ${line.lineNum}: ${line.prefix} ${line.text}`}
              className={`w-full flex items-stretch text-left transition-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A524] focus-visible:z-10 ${borderClass} ${bgClass}`}
            >
              {/* Line number gutter */}
              <span className="w-12 py-1 px-2.5 text-right text-[12px] text-[#9AA3AE] select-none border-r border-[#262B33]/60 shrink-0 font-mono">
                {line.lineNum}
              </span>

              {/* Diff marker (+, -, or blank) */}
              <span className="w-6 py-1 text-center font-bold select-none shrink-0 text-xs">
                {line.prefix !== ' ' ? line.prefix : ''}
              </span>

              {/* Code text */}
              <span className="py-1 pr-4 whitespace-pre font-mono flex-1 text-left">
                {line.text}
              </span>
            </button>
          );
        })}
      </div>

      {checkedResult && (
        <div
          className={`p-3.5 m-3 rounded-[6px] border text-xs font-sans ${
            checkedResult.status === 'correct'
              ? 'bg-[#3FB950]/10 border-[#3FB950]/40 text-[#3FB950]'
              : checkedResult.status === 'partial'
              ? 'bg-[#D29922]/10 border-[#D29922]/40 text-[#D29922]'
              : 'bg-[#F85149]/10 border-[#F85149]/40 text-[#F85149]'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="font-semibold mb-1 flex items-center space-x-1.5 uppercase font-mono tracking-wider">
            <span>
              {checkedResult.status === 'correct' && '✓ Correct Line Identified'}
              {checkedResult.status === 'partial' && '⚠ Partial Match'}
              {checkedResult.status === 'incorrect' && '✕ Not the Root Fault Line'}
            </span>
          </div>
          <p className="text-[#E8EAED] font-mono leading-relaxed">
            {checkedResult.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
