'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Code2,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Quote,
  ShieldCheck,
} from 'lucide-react';
import { ExerciseState, ExerciseAction } from '@/lib/exerciseReducer';
import { RubricEvaluationItem } from '@/lib/reviewEvaluator';
import { findQuoteRange } from '@/lib/verify';
import { APPROACH_DETAILS, ApproachCategory } from '@/lib/fixClassifier';

interface ReviewScreenProps {
  state: ExerciseState;
  dispatch: React.Dispatch<ExerciseAction>;
  incidentId: string;
}

/**
 * Helper to render text with highlighted quotation if the active rubric item's quote is found within it.
 */
function HighlightableText({
  text,
  activeQuote,
}: {
  text: string;
  activeQuote: string | null;
}) {
  if (!activeQuote || !text) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  const range = findQuoteRange(text, activeQuote);
  if (!range) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  const before = text.slice(0, range.start);
  const match = text.slice(range.start, range.end);
  const after = text.slice(range.end);

  return (
    <span className="whitespace-pre-wrap">
      {before}
      <mark
        className="bg-[#F5A524]/25 text-[#F5A524] border border-[#F5A524]/60 px-1 py-0.5 rounded font-semibold font-mono"
        title="Quoted evidence matching selected rubric item"
      >
        {match}
      </mark>
      {after}
    </span>
  );
}

export function ReviewScreen({ state, dispatch }: ReviewScreenProps) {
  const {
    selectedLine,
    lineCheckResult,
    lineCheckExplanation,
    firstLineAttemptCorrect,
    lineCheckAttempts,
    mitigation,
    fix,
    defense,
    confirmedApproach,
    reviewResult,
    selectedRubricItem,
  } = state;

  const [expandedComparison, setExpandedComparison] = useState<string | null>('mitigation');

  if (!reviewResult) {
    return null;
  }

  const { items, referenceSolution } = reviewResult;
  const activeItem = items.find((i) => i.id === selectedRubricItem) || null;
  const activeQuote = activeItem?.quote || null;

  const handleSelectRubricItem = (id: string) => {
    if (selectedRubricItem === id) {
      dispatch({ type: 'SELECT_RUBRIC_ITEM', payload: null });
    } else {
      dispatch({ type: 'SELECT_RUBRIC_ITEM', payload: id });
    }
  };

  const statusIcons = {
    CAUGHT: <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />,
    PARTIAL: <AlertTriangle className="w-4 h-4 text-[#D29922] shrink-0" />,
    MISSED: <XCircle className="w-4 h-4 text-[#F85149] shrink-0" />,
  };

  const statusBadgeClasses = {
    CAUGHT: 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/40',
    PARTIAL: 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/40',
    MISSED: 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/40',
  };

  return (
    <div className="space-y-6 text-[#E8EAED] pb-6">
      {/* Top Banner */}
      <div className="p-4 rounded-[10px] bg-[#181C22] border border-[#262B33] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#F5A524] uppercase tracking-wider font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Investigation Review</span>
          </div>
          {state.isRecordedSession && (
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-[#58A6FF]/15 border border-[#58A6FF]/40 text-[#58A6FF] font-semibold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#58A6FF]" />
              <span>RECORDED SESSION</span>
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold text-[#E8EAED]">
          Engineering Assessment & Reference Comparison
        </h3>
        {state.isRecordedSession && (
          <div className="text-xs text-[#79C0FF] bg-[#388BFD]/10 p-2.5 rounded border border-[#388BFD]/25 font-mono leading-relaxed">
            <strong>Recorded session:</strong> Displaying verified evaluation generated for {state.recordedFixtureName || 'Fixture A (Strong Engineering Response)'}.
          </div>
        )}
        <p className="text-xs text-[#9AA3AE] leading-relaxed">
          Trace separates code-checked facts from AI rubric interpretation. Review your line fault accuracy, evidence criteria, and compare directly with the authoritative reference solution.
        </p>
      </div>

      {/* SECTION A: CHECKED BY CODE */}
      <section aria-labelledby="section-code-heading" className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#262B33] pb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-[#F5A524]/10 text-[#F5A524] border border-[#F5A524]/30">
              <Code2 className="w-3.5 h-3.5" />
            </div>
            <h4 id="section-code-heading" className="text-xs font-mono uppercase tracking-wider text-[#E8EAED] font-semibold">
              Section A: Checked by Code
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181C22] border border-[#262B33] text-[#9AA3AE]">
            DETERMINISTIC VERIFICATION
          </span>
        </div>

        <div className="p-4 rounded-[8px] bg-[#0B0D10] border border-[#262B33] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#9AA3AE]">
              Selected Fault Line: <strong className="text-[#E8EAED]">Line {selectedLine || 9}</strong>
            </span>
            <span
              className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded border ${
                lineCheckResult === 'correct'
                  ? 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/40'
                  : lineCheckResult === 'partial'
                  ? 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/40'
                  : 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/40'
              }`}
            >
              {lineCheckResult === 'correct' && '✓ CORRECT'}
              {lineCheckResult === 'partial' && '⚠ PARTIAL MATCH'}
              {lineCheckResult === 'incorrect' && '✕ INCORRECT'}
            </span>
          </div>

          <div className="text-xs text-[#9AA3AE] font-mono">
            First attempt accuracy:{' '}
            <span className={firstLineAttemptCorrect ? 'text-[#3FB950] font-semibold' : 'text-[#F85149] font-semibold'}>
              {firstLineAttemptCorrect ? 'Correct on first attempt' : 'Incorrect on first attempt'}
            </span>{' '}
            ({lineCheckAttempts} check{lineCheckAttempts !== 1 ? 's' : ''} total)
          </div>

          {lineCheckExplanation && (
            <p className="text-xs font-mono text-[#E8EAED] bg-[#181C22]/60 p-2.5 rounded border border-[#262B33] leading-relaxed">
              {lineCheckExplanation}
            </p>
          )}
        </div>
      </section>

      {/* SECTION B: INTERPRETED BY AI */}
      <section aria-labelledby="section-ai-heading" className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#262B33] pb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-[#388BFD]/10 text-[#388BFD] border border-[#388BFD]/30">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h4 id="section-ai-heading" className="text-xs font-mono uppercase tracking-wider text-[#E8EAED] font-semibold">
              Section B: Interpreted by AI
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            {state.isRecordedSession && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#58A6FF]/15 border border-[#58A6FF]/40 text-[#58A6FF] font-semibold">
                RECORDED SESSION
              </span>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181C22] border border-[#262B33] text-[#9AA3AE]">
              RUBRIC &amp; QUOTE VERIFIED
            </span>
          </div>
        </div>

        <p className="text-[11px] text-[#9AA3AE] leading-relaxed">
          Click any rubric criterion below to highlight its verified quotation in your responses. Unverified quotations are stripped of credit.
        </p>

        <div className="space-y-2.5">
          {items.map((item: RubricEvaluationItem) => {
            const isSelected = selectedRubricItem === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectRubricItem(item.id)}
                className={`w-full text-left p-3.5 rounded-[8px] border transition-calm space-y-2 ${
                  isSelected
                    ? 'bg-[#181C22] border-[#F5A524] ring-1 ring-[#F5A524]/40'
                    : 'bg-[#0B0D10] border-[#262B33] hover:border-[#9AA3AE]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {statusIcons[item.status]}
                    <span className="font-semibold text-xs text-[#E8EAED]">
                      {item.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      statusBadgeClasses[item.status]
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-[#9AA3AE] leading-relaxed">
                  {item.note}
                </p>

                {item.quote ? (
                  <div className="p-2 rounded bg-[#181C22] border border-[#262B33] text-[11px] font-mono text-[#E8EAED] flex items-start space-x-1.5">
                    <Quote className="w-3.5 h-3.5 text-[#F5A524] shrink-0 mt-0.5" />
                    <span className="italic truncate">&quot;{item.quote}&quot;</span>
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-[#9AA3AE]/70 italic flex items-center space-x-1">
                    <span>— No supporting quote found.</span>
                    {item.verificationFailed && (
                      <span className="text-[#F85149]">(unverified quote stripped)</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION C: YOUR ANSWERS VS. REFERENCE SOLUTION */}
      <section aria-labelledby="section-ref-heading" className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#262B33] pb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-[#3FB950]/10 text-[#3FB950] border border-[#3FB950]/30">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <h4 id="section-ref-heading" className="text-xs font-mono uppercase tracking-wider text-[#E8EAED] font-semibold">
              Section C: Your Answers vs. Reference Solution
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181C22] border border-[#262B33] text-[#9AA3AE]">
            CURATED REFERENCE
          </span>
        </div>

        {activeQuote && (
          <div className="p-2.5 rounded bg-[#F5A524]/10 border border-[#F5A524]/30 text-xs font-mono text-[#F5A524] flex items-center justify-between">
            <span>Showing verified quote for: {activeItem?.title}</span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SELECT_RUBRIC_ITEM', payload: null })}
              className="underline text-[11px] hover:text-[#E8EAED]"
            >
              Clear highlight
            </button>
          </div>
        )}

        <div className="space-y-3">
          {/* Comparison Item 1: Mitigation */}
          <div className="rounded-[8px] bg-[#0B0D10] border border-[#262B33] overflow-hidden text-xs">
            <button
              type="button"
              onClick={() =>
                setExpandedComparison(
                  expandedComparison === 'mitigation' ? null : 'mitigation'
                )
              }
              className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-[#181C22] transition-calm"
            >
              <span className="font-semibold text-[#E8EAED]">1. Immediate Mitigation</span>
              {expandedComparison === 'mitigation' ? (
                <ChevronUp className="w-4 h-4 text-[#9AA3AE]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#9AA3AE]" />
              )}
            </button>
            {expandedComparison === 'mitigation' && (
              <div className="p-3 border-t border-[#262B33] space-y-3 font-mono">
                <div>
                  <div className="text-[11px] text-[#F5A524] mb-1 font-semibold uppercase">
                    Your Response:
                  </div>
                  <div className="bg-[#181C22] p-2.5 rounded border border-[#262B33] text-[#E8EAED] text-xs leading-relaxed">
                    <HighlightableText text={mitigation} activeQuote={activeQuote} />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#3FB950] mb-1 font-semibold uppercase">
                    Curated Reference Solution:
                  </div>
                  <div className="bg-[#181C22] p-2.5 rounded border border-[#262B33] text-[#9AA3AE] text-xs leading-relaxed">
                    {referenceSolution.mitigation}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comparison Item 2: Root Cause */}
          <div className="rounded-[8px] bg-[#0B0D10] border border-[#262B33] overflow-hidden text-xs">
            <button
              type="button"
              onClick={() =>
                setExpandedComparison(
                  expandedComparison === 'rootCause' ? null : 'rootCause'
                )
              }
              className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-[#181C22] transition-calm"
            >
              <span className="font-semibold text-[#E8EAED]">2. Root Cause Analysis</span>
              {expandedComparison === 'rootCause' ? (
                <ChevronUp className="w-4 h-4 text-[#9AA3AE]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#9AA3AE]" />
              )}
            </button>
            {expandedComparison === 'rootCause' && (
              <div className="p-3 border-t border-[#262B33] space-y-3 font-mono">
                <div>
                  <div className="text-[11px] text-[#F5A524] mb-1 font-semibold uppercase">
                    Your Response:
                  </div>
                  <div className="bg-[#181C22] p-2.5 rounded border border-[#262B33] text-[#E8EAED] text-xs leading-relaxed">
                    <HighlightableText text={fix} activeQuote={activeQuote} />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#3FB950] mb-1 font-semibold uppercase">
                    Curated Reference Solution:
                  </div>
                  <div className="bg-[#181C22] p-2.5 rounded border border-[#262B33] text-[#9AA3AE] text-xs leading-relaxed">
                    {referenceSolution.rootCause}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comparison Item 3: Permanent Fix */}
          <div className="rounded-[8px] bg-[#0B0D10] border border-[#262B33] overflow-hidden text-xs">
            <button
              type="button"
              onClick={() =>
                setExpandedComparison(
                  expandedComparison === 'permanentFix' ? null : 'permanentFix'
                )
              }
              className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-[#181C22] transition-calm"
            >
              <span className="font-semibold text-[#E8EAED]">3. Permanent Fix</span>
              {expandedComparison === 'permanentFix' ? (
                <ChevronUp className="w-4 h-4 text-[#9AA3AE]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#9AA3AE]" />
              )}
            </button>
            {expandedComparison === 'permanentFix' && (
              <div className="p-3 border-t border-[#262B33] space-y-3 font-mono">
                <div>
                  <div className="text-[11px] text-[#F5A524] mb-1 font-semibold uppercase">
                    Your Fix:
                  </div>
                  <div className="bg-[#181C22] p-2.5 rounded border border-[#262B33] text-[#E8EAED] text-xs leading-relaxed">
                    <HighlightableText text={fix} activeQuote={activeQuote} />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#3FB950] mb-1 font-semibold uppercase">
                    Curated Fix Steps:
                  </div>
                  <ol className="bg-[#181C22] p-3 rounded border border-[#262B33] text-[#9AA3AE] text-xs space-y-1 list-decimal list-inside leading-relaxed">
                    {referenceSolution.permanentFix.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div className="text-[11px] text-[#3FB950] mb-1 font-semibold uppercase">
                    Required Constraint DDL:
                  </div>
                  <pre className="bg-[#181C22] p-2.5 rounded border border-[#262B33] text-[#7EE787] text-[11px] overflow-x-auto">
                    {referenceSolution.constraintSql}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Comparison Item 4: Trade-off & Follow-up Defense */}
          <div className="rounded-[8px] bg-[#0B0D10] border border-[#262B33] overflow-hidden text-xs">
            <button
              type="button"
              onClick={() =>
                setExpandedComparison(
                  expandedComparison === 'tradeOff' ? null : 'tradeOff'
                )
              }
              className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-[#181C22] transition-calm"
            >
              <span className="font-semibold text-[#E8EAED]">
                4. Trade-off Defense ({confirmedApproach ? APPROACH_DETAILS[confirmedApproach as ApproachCategory]?.name : 'Approach'})
              </span>
              {expandedComparison === 'tradeOff' ? (
                <ChevronUp className="w-4 h-4 text-[#9AA3AE]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#9AA3AE]" />
              )}
            </button>
            {expandedComparison === 'tradeOff' && (
              <div className="p-3 border-t border-[#262B33] space-y-3 font-mono">
                <div>
                  <div className="text-[11px] text-[#F5A524] mb-1 font-semibold uppercase">
                    Your Defense:
                  </div>
                  <div className="bg-[#181C22] p-2.5 rounded border border-[#262B33] text-[#E8EAED] text-xs leading-relaxed">
                    <HighlightableText text={defense} activeQuote={activeQuote} />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#3FB950] mb-1 font-semibold uppercase">
                    Curated Architectural Trade-offs:
                  </div>
                  <div className="space-y-1.5">
                    {referenceSolution.tradeOffs.map((to, idx) => (
                      <div key={idx} className="bg-[#181C22] p-2.5 rounded border border-[#262B33] text-xs leading-relaxed">
                        <strong className="text-[#E8EAED] block mb-0.5">{to.approach}:</strong>
                        <span className="text-[#9AA3AE]">{to.tradeOff}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comparison Item 5: Data Repair (Reconciliation of already affected accounts) */}
          <div className="rounded-[8px] bg-[#0B0D10] border border-[#262B33] overflow-hidden text-xs">
            <button
              type="button"
              onClick={() =>
                setExpandedComparison(
                  expandedComparison === 'dataRepair' ? null : 'dataRepair'
                )
              }
              className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-[#181C22] transition-calm"
            >
              <span className="font-semibold text-[#E8EAED]">5. Existing-Data Repair</span>
              {expandedComparison === 'dataRepair' ? (
                <ChevronUp className="w-4 h-4 text-[#9AA3AE]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#9AA3AE]" />
              )}
            </button>
            {expandedComparison === 'dataRepair' && (
              <div className="p-3 border-t border-[#262B33] space-y-3 font-mono">
                <p className="text-[#9AA3AE] text-xs leading-relaxed">
                  Before applying a unique constraint, an engineering team must detect and resolve existing duplicated ledger entries created while the bug was live.
                </p>
                <div>
                  <div className="text-[11px] text-[#3FB950] mb-1 font-semibold uppercase">
                    Reconciliation Query:
                  </div>
                  <pre className="bg-[#181C22] p-2.5 rounded border border-[#262B33] text-[#7EE787] text-[11px] overflow-x-auto">
                    {referenceSolution.dataRepairQuery}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Review Screen Footer */}
      <div className="pt-4 border-t border-[#262B33] space-y-4">
        <p className="text-[11px] text-[#9AA3AE] font-mono leading-relaxed bg-[#181C22]/50 p-3 rounded border border-[#262B33]">
          AI interpretation can be wrong. Quotes are verified to exist in your text, but that doesn&apos;t prove they satisfy the check.
        </p>

        <button
          type="button"
          onClick={() => dispatch({ type: 'RESET' })}
          className="w-full py-2.5 px-4 rounded-[8px] bg-[#181C22] border border-[#262B33] hover:border-[#F5A524] text-[#E8EAED] text-sm font-semibold transition-calm flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4 text-[#F5A524]" />
          <span>Try again</span>
        </button>
      </div>
    </div>
  );
}
