'use client';

import React, { useState, useReducer, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Terminal, Cpu, Clock, ShieldAlert } from 'lucide-react';
import { PublicIncident } from '@/data/incidents/duplicate-payment';
import { exerciseReducer, initialExerciseState } from '@/lib/exerciseReducer';
import { EvidencePane, EvidenceTab } from './EvidencePane';
import { StepperPane } from './StepperPane';

import { loadExerciseSession, saveExerciseSession, clearExerciseSession } from '@/lib/storage';
import { recordedDuplicatePaymentSession } from '@/data/recorded/duplicate-payment';

interface WorkspaceShellProps {
  incident: PublicIncident;
}

export function WorkspaceShell({ incident }: WorkspaceShellProps) {
  const [activeTab, setActiveTab] = useState<EvidenceTab>('diff');
  const [state, dispatch] = useReducer(exerciseReducer, initialExerciseState);

  // 1. Initial mount: check for ?demo=1 query parameter or restore session from storage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const isDemo = params.get('demo') === '1' || params.get('demo_mode') === '1';

    if (isDemo) {
      dispatch({
        type: 'LOAD_RECORDED_SESSION',
        payload: recordedDuplicatePaymentSession,
      });
      return;
    }

    const saved = loadExerciseSession(incident.id);
    if (saved) {
      dispatch({ type: 'LOAD_SAVED_SESSION', payload: saved });
    }
  }, [incident.id]);

  // 2. Persist state changes to sessionStorage (clears on complete reset)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (
      state.currentStep === 1 &&
      !state.mitigation &&
      !state.selectedLine &&
      !state.fix &&
      !state.defense &&
      !state.isRecordedSession
    ) {
      clearExerciseSession(incident.id);
      return;
    }

    saveExerciseSession(incident.id, state);
  }, [state, incident.id]);

  // When step 2 is activated, automatically switch to diff tab so learner can inspect code
  useEffect(() => {
    if (state.currentStep === 2) {
      setActiveTab('diff');
    }
  }, [state.currentStep]);

  const handleSelectLine = (lineNum: number) => {
    dispatch({ type: 'SELECT_LINE', payload: lineNum });
  };

  const handleSwitchToDiff = () => {
    setActiveTab('diff');
  };

  const checkedResult =
    state.selectedLine && state.lineCheckResult && state.lineCheckExplanation
      ? {
          lineNum: state.selectedLine,
          status: state.lineCheckResult,
          explanation: state.lineCheckExplanation,
        }
      : null;

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#E8EAED] flex flex-col h-screen overflow-hidden">
      {/* Top Console Navigation */}
      <header className="border-b border-[#262B33] bg-[#12151A] px-4 md:px-6 h-14 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs font-mono text-[#9AA3AE] hover:text-[#E8EAED] transition-calm p-1.5 -ml-1.5 rounded-[6px] hover:bg-[#181C22]"
            aria-label="Back to Incident Library"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Library</span>
          </Link>

          <div className="h-4 w-px bg-[#262B33]" />

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-[4px] bg-[#181C22] border border-[#262B33] flex items-center justify-center text-[#F5A524]">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#E8EAED]">
              Trace
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-xs font-mono">
            <span className="text-[#9AA3AE]">/</span>
            <span className="text-[#E8EAED] font-medium">{incident.title}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-[#181C22] border border-[#262B33] text-[#9AA3AE] flex items-center space-x-1">
              <Cpu className="w-3 h-3 text-[#9AA3AE]" />
              <span>{incident.role}</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#181C22] border border-[#262B33] text-[#9AA3AE] flex items-center space-x-1">
              <Clock className="w-3 h-3 text-[#9AA3AE]" />
              <span>~{incident.estimatedMinutes}m</span>
            </span>
          </div>

          {state.isRecordedSession ? (
            <div className="text-xs font-mono px-2.5 py-1 rounded-[6px] bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center space-x-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>SAMPLE WALKTHROUGH (NO AI)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: 'LOAD_RECORDED_SESSION',
                  payload: recordedDuplicatePaymentSession,
                })
              }
              title="View illustrative sample walkthrough (AI evaluation not run)"
              className="text-xs font-mono px-2.5 py-1 rounded-[6px] bg-[#181C22] hover:bg-[#1f242c] border border-[#262B33] hover:border-amber-500/60 text-[#9AA3AE] hover:text-amber-300 transition-calm flex items-center space-x-1.5"
            >
              <span>Sample walkthrough</span>
            </button>
          )}

          <div className="text-xs font-mono px-2.5 py-1 rounded-[6px] bg-[#181C22] border border-[#262B33] text-[#F5A524] flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">TRIAGE ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Split Console Layout */}
      {/* Desktop: 55% Left (Evidence), 45% Right (Stepper); Mobile: Stacked with evidence above stepper */}
      <main className="flex-1 p-2 md:p-4 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 h-[calc(100vh-3.5rem)]">
        {/* Left Pane: Evidence (~55% width -> 7 cols on 12-col grid = 58.3%) */}
        <div className="lg:col-span-7 h-[500px] lg:h-full">
          <EvidencePane
            incident={incident}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedLine={state.selectedLine}
            onSelectLine={handleSelectLine}
            checkedResult={checkedResult}
          />
        </div>

        {/* Right Pane: Stepper (~45% width -> 5 cols on 12-col grid = 41.7%) */}
        <div className="lg:col-span-5 h-[600px] lg:h-full">
          <StepperPane
            state={state}
            dispatch={dispatch}
            onSwitchToDiffTab={handleSwitchToDiff}
            incidentId={incident.id}
          />
        </div>
      </main>
    </div>
  );
}
