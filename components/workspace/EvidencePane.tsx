'use client';

import React from 'react';
import { AlertTriangle, FileCode, Terminal, BookOpen } from 'lucide-react';
import { DiffViewer } from './DiffViewer';
import { TelemetryViewer } from './TelemetryViewer';
import { ContextViewer } from './ContextViewer';
import { PublicIncident } from '@/data/incidents/duplicate-payment';

export type EvidenceTab = 'diff' | 'telemetry' | 'context';

interface EvidencePaneProps {
  incident: PublicIncident;
  activeTab: EvidenceTab;
  onTabChange: (tab: EvidenceTab) => void;
  selectedLine: number | null;
  onSelectLine: (lineNum: number) => void;
  checkedResult?: {
    lineNum: number;
    status: 'correct' | 'partial' | 'incorrect';
    explanation: string;
  } | null;
}

export function EvidencePane({
  incident,
  activeTab,
  onTabChange,
  selectedLine,
  onSelectLine,
  checkedResult,
}: EvidencePaneProps) {
  return (
    <section 
      aria-label="Incident Evidence Console" 
      className="flex flex-col h-full bg-[#12151A] rounded-[12px] border border-[#262B33] overflow-hidden"
    >
      {/* Incident Alert Banner */}
      <div 
        role="region" 
        aria-label="Active Incident Alert"
        className="bg-[#181C22] border-b border-[#262B33] px-4 py-3 flex items-start space-x-3 text-xs md:text-sm text-[#E8EAED]"
      >
        <div className="p-1 rounded-[4px] bg-[#F85149]/15 text-[#F85149] shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 font-mono">
          <span className="text-[#F85149] font-semibold mr-2">[ALERT]</span>
          <span className="text-[#E8EAED]">{incident.alert}</span>
        </div>
      </div>

      {/* Evidence Tabs Header */}
      <div className="border-b border-[#262B33] bg-[#0B0D10]/60 px-3 pt-2 flex items-center justify-between">
        <div 
          role="tablist" 
          aria-label="Evidence File Tabs"
          className="flex space-x-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'diff'}
            aria-controls="tabpanel-diff"
            id="tab-diff"
            onClick={() => onTabChange('diff')}
            className={`inline-flex items-center space-x-2 px-3 py-2 text-xs font-mono rounded-t-[6px] border-t border-x transition-calm focus-visible:outline-2 focus-visible:outline-[#F5A524] ${
              activeTab === 'diff'
                ? 'bg-[#12151A] border-[#262B33] text-[#F5A524] font-semibold border-b-transparent'
                : 'border-transparent text-[#9AA3AE] hover:text-[#E8EAED] hover:bg-[#181C22]/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>deploy.diff</span>
            {selectedLine && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-[#F5A524]/20 text-[#F5A524] rounded-full">
                L{selectedLine}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'telemetry'}
            aria-controls="tabpanel-telemetry"
            id="tab-telemetry"
            onClick={() => onTabChange('telemetry')}
            className={`inline-flex items-center space-x-2 px-3 py-2 text-xs font-mono rounded-t-[6px] border-t border-x transition-calm focus-visible:outline-2 focus-visible:outline-[#F5A524] ${
              activeTab === 'telemetry'
                ? 'bg-[#12151A] border-[#262B33] text-[#F5A524] font-semibold border-b-transparent'
                : 'border-transparent text-[#9AA3AE] hover:text-[#E8EAED] hover:bg-[#181C22]/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>telemetry.log</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'context'}
            aria-controls="tabpanel-context"
            id="tab-context"
            onClick={() => onTabChange('context')}
            className={`inline-flex items-center space-x-2 px-3 py-2 text-xs font-mono rounded-t-[6px] border-t border-x transition-calm focus-visible:outline-2 focus-visible:outline-[#F5A524] ${
              activeTab === 'context'
                ? 'bg-[#12151A] border-[#262B33] text-[#F5A524] font-semibold border-b-transparent'
                : 'border-transparent text-[#9AA3AE] hover:text-[#E8EAED] hover:bg-[#181C22]/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>context.md</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-[#9AA3AE] pb-2 hidden sm:block">
          READ-ONLY EVIDENCE
        </div>
      </div>

      {/* Tab Panels with internal scrolling */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto">
        <div
          role="tabpanel"
          id="tabpanel-diff"
          aria-labelledby="tab-diff"
          hidden={activeTab !== 'diff'}
          className={activeTab === 'diff' ? 'block' : 'hidden'}
        >
          <DiffViewer
            lines={incident.diffLines}
            selectedLine={selectedLine}
            onSelectLine={onSelectLine}
            checkedResult={checkedResult}
          />
        </div>

        <div
          role="tabpanel"
          id="tabpanel-telemetry"
          aria-labelledby="tab-telemetry"
          hidden={activeTab !== 'telemetry'}
          className={activeTab === 'telemetry' ? 'block' : 'hidden'}
        >
          <TelemetryViewer log={incident.telemetryLog} />
        </div>

        <div
          role="tabpanel"
          id="tabpanel-context"
          aria-labelledby="tab-context"
          hidden={activeTab !== 'context'}
          className={activeTab === 'context' ? 'block' : 'hidden'}
        >
          <ContextViewer content={incident.contextMarkdown} />
        </div>
      </div>
    </section>
  );
}
