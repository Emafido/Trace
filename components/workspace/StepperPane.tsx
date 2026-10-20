'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Wrench,
  Send,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  MessageSquareCheck,
  RotateCcw,
  Check,
  Layers,
} from 'lucide-react';
import {
  ExerciseState,
  ExerciseAction,
  MIN_MITIGATION_LENGTH,
  MIN_FIX_LENGTH,
  MIN_DEFENSE_LENGTH,
} from '@/lib/exerciseReducer';
import {
  approachCategories,
  ApproachCategory,
  APPROACH_DETAILS,
} from '@/lib/fixClassifier';
import { ReviewScreen } from './ReviewScreen';
import { recordedDuplicatePaymentSession } from '@/data/recorded/duplicate-payment';

interface StepperPaneProps {
  state: ExerciseState;
  dispatch: React.Dispatch<ExerciseAction>;
  onSwitchToDiffTab: () => void;
  incidentId: string;
}

export function StepperPane({
  state,
  dispatch,
  onSwitchToDiffTab,
  incidentId,
}: StepperPaneProps) {
  const [isCheckingLine, setIsCheckingLine] = useState(false);
  const [lineCheckError, setLineCheckError] = useState<string | null>(null);
  const [expandedCompletedStep, setExpandedCompletedStep] = useState<number | null>(null);

  // Step 4 state
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);
  const [manualSelectedApproach, setManualSelectedApproach] = useState<ApproachCategory>('unique_constraint');
  const [isConfirmingApproach, setIsConfirmingApproach] = useState(false);

  const {
    currentStep,
    mitigation,
    selectedLine,
    lineCheckResult,
    lineCheckExplanation,
    firstLineAttemptCorrect,
    lineCheckAttempts,
    fix,
    classificationStatus,
    classificationError,
    classifiedApproach,
    classificationReason,
    confirmedApproach,
    classificationSource,
    followUpQuestion,
    defense,
    reviewStatus,
    reviewError,
    reviewResult,
  } = state;

  // Auto-trigger review evaluation upon entering Review step
  useEffect(() => {
    if (currentStep === 'review' && reviewStatus === 'idle') {
      let isCancelled = false;

      const triggerReview = async () => {
        dispatch({ type: 'START_REVIEW' });

        try {
          const res = await fetch('/api/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              incidentId,
              mitigation,
              fix,
              defense,
            }),
          });

          const data = await res.json();

          if (isCancelled) return;

          if (!res.ok) {
            dispatch({
              type: 'REVIEW_FAILED',
              payload: data.error || 'Failed to complete review evaluation.',
            });
            return;
          }

          dispatch({
            type: 'REVIEW_SUCCESS',
            payload: data,
          });
        } catch {
          if (!isCancelled) {
            dispatch({
              type: 'REVIEW_FAILED',
              payload: 'Network connection failure while evaluating review.',
            });
          }
        }
      };

      triggerReview();

      return () => {
        isCancelled = true;
      };
    }
  }, [currentStep, reviewStatus, incidentId, mitigation, fix, defense, dispatch]);

  // Auto-trigger classification upon entering Step 4
  useEffect(() => {
    if (currentStep === 4 && classificationStatus === 'idle') {
      let isCancelled = false;

      const triggerClassification = async () => {
        dispatch({ type: 'START_CLASSIFICATION' });

        try {
          const res = await fetch('/api/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'classify',
              incidentId,
              mitigation,
              fix,
            }),
          });

          const data = await res.json();

          if (isCancelled) return;

          if (!res.ok) {
            dispatch({
              type: 'CLASSIFICATION_FAILED',
              payload: data.error || 'Failed to classify fix',
            });
            return;
          }

          dispatch({
            type: 'CLASSIFICATION_SUCCESS',
            payload: {
              approach: data.approach,
              reason: data.reason,
              followUpQuestion: data.followUpQuestion,
            },
          });
        } catch {
          if (!isCancelled) {
            dispatch({
              type: 'CLASSIFICATION_FAILED',
              payload: 'Network connection failure while interpreting fix. Please retry or choose your approach manually.',
            });
          }
        }
      };

      triggerClassification();

      return () => {
        isCancelled = true;
      };
    }
  }, [currentStep, classificationStatus, incidentId, mitigation, fix, dispatch]);

  const handleLockMitigation = () => {
    if (mitigation.trim().length >= MIN_MITIGATION_LENGTH) {
      dispatch({ type: 'LOCK_MITIGATION' });
      onSwitchToDiffTab();
    }
  };

  const handleCheckLine = async () => {
    if (!selectedLine || isCheckingLine) return;

    setIsCheckingLine(true);
    setLineCheckError(null);

    try {
      const response = await fetch('/api/check-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId,
          selectedLine,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLineCheckError(data.error || 'Line check failed');
        return;
      }

      dispatch({
        type: 'LINE_CHECK_COMPLETED',
        payload: {
          result: data.status,
          explanation: data.explanation,
        },
      });
    } catch {
      setLineCheckError('Network error checking line. Please retry.');
    } finally {
      setIsCheckingLine(false);
    }
  };

  const handleAdvanceToFix = () => {
    if (lineCheckAttempts > 0) {
      dispatch({ type: 'ADVANCE_TO_FIX' });
    }
  };

  const handleSubmitFix = () => {
    if (fix.trim().length >= MIN_FIX_LENGTH) {
      dispatch({ type: 'SUBMIT_FIX' });
    }
  };

  // Step 4: Accept AI classification
  const handleAcceptAIClassification = () => {
    if (classifiedApproach && followUpQuestion) {
      dispatch({
        type: 'CONFIRM_APPROACH',
        payload: {
          approach: classifiedApproach,
          followUpQuestion,
          source: 'ai',
        },
      });
    }
  };

  // Step 4: Confirm manual selection (overrides AI or handles fallback)
  const handleConfirmManualSelection = async () => {
    setIsConfirmingApproach(true);
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          incidentId,
          confirmedApproach: manualSelectedApproach,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm approach');
      }

      dispatch({
        type: 'CONFIRM_APPROACH',
        payload: {
          approach: manualSelectedApproach,
          followUpQuestion: data.followUpQuestion,
          source: 'manual',
        },
      });
      setShowOverrideMenu(false);
    } catch {
      // Fallback in case of server failure: use default question
      dispatch({
        type: 'CONFIRM_APPROACH',
        payload: {
          approach: manualSelectedApproach,
          followUpQuestion: 'Walk through, step by step, what happens when two deliveries of the same event arrive 4 ms apart under your fix.',
          source: 'manual',
        },
      });
      setShowOverrideMenu(false);
    } finally {
      setIsConfirmingApproach(false);
    }
  };

  // Step 5: Submit defense
  const handleSubmitDefense = () => {
    if (defense.trim().length >= MIN_DEFENSE_LENGTH) {
      dispatch({ type: 'SUBMIT_DEFENSE' });
    }
  };

  const stepLabels: Record<number | string, string> = {
    1: 'Mitigate',
    2: 'Find the fault',
    3: 'Permanent fix',
    4: 'Confirm approach',
    5: 'Defend',
    review: 'Ready for Review',
  };

  const numericStep = typeof currentStep === 'number' ? currentStep : 5;

  return (
    <section
      aria-label="Incident Investigation Stepper"
      className="flex flex-col h-full bg-[#12151A] rounded-[12px] border border-[#262B33] overflow-hidden"
    >
      {/* Header with Step Progress */}
      <div className="border-b border-[#262B33] bg-[#181C22] px-5 py-3.5 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono text-[#9AA3AE] uppercase tracking-wider">
            Investigation Progress
          </div>
          <div className="text-base font-semibold text-[#E8EAED] flex items-center space-x-2">
            <span>
              {typeof currentStep === 'number'
                ? `Step ${currentStep} of 5`
                : 'Review Ready'}
            </span>
            <span className="text-[#9AA3AE] font-normal text-xs font-mono">
              ({stepLabels[currentStep]})
            </span>
          </div>
        </div>

        {/* 5 Step Indicator Segments */}
        <div
          className="flex items-center space-x-1.5"
          role="progressbar"
          aria-valuenow={numericStep}
          aria-valuemin={1}
          aria-valuemax={5}
          aria-label={`Step ${numericStep} of 5: ${stepLabels[currentStep]}`}
        >
          {[1, 2, 3, 4, 5].map((stepNum) => (
            <div
              key={stepNum}
              className={`h-2.5 rounded-full transition-calm ${
                stepNum === numericStep && currentStep !== 'review'
                  ? 'w-7 bg-[#F5A524]'
                  : stepNum < numericStep || currentStep === 'review'
                  ? 'w-3.5 bg-[#3FB950]'
                  : 'w-3.5 bg-[#262B33]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Interactive Step Content Area with Internal Scroll */}
      <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5">
        {/* Completed Steps (Collapsible summaries) */}
        {(numericStep > 1 || currentStep === 'review') && (
          <div className="space-y-2 border-b border-[#262B33]/80 pb-4">
            <div className="text-xs font-mono text-[#9AA3AE] uppercase tracking-wider mb-2">
              Completed Steps
            </div>

            {/* Collapsed Step 1: Mitigation */}
            <div className="rounded-[8px] bg-[#181C22]/60 border border-[#262B33] overflow-hidden text-xs">
              <button
                type="button"
                onClick={() =>
                  setExpandedCompletedStep(
                    expandedCompletedStep === 1 ? null : 1
                  )
                }
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#181C22] transition-calm"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
                  <span className="font-semibold text-[#E8EAED]">
                    Step 1: Mitigate
                  </span>
                  <span className="text-[#9AA3AE] truncate max-w-xs font-mono">
                    — &quot;{mitigation.slice(0, 42)}...&quot;
                  </span>
                </div>
                {expandedCompletedStep === 1 ? (
                  <ChevronUp className="w-4 h-4 text-[#9AA3AE]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#9AA3AE]" />
                )}
              </button>
              {expandedCompletedStep === 1 && (
                <div className="p-3 bg-[#0B0D10] border-t border-[#262B33] text-[#E8EAED] font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {mitigation}
                </div>
              )}
            </div>

            {/* Collapsed Step 2: Fault Line */}
            {(numericStep > 2 || currentStep === 'review') && (
              <div className="rounded-[8px] bg-[#181C22]/60 border border-[#262B33] overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCompletedStep(
                      expandedCompletedStep === 2 ? null : 2
                    )
                  }
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#181C22] transition-calm"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
                    <span className="font-semibold text-[#E8EAED]">
                      Step 2: Fault Line
                    </span>
                    <span className="text-[#9AA3AE] font-mono">
                      — Line {selectedLine || 9}
                      {firstLineAttemptCorrect !== null && (
                        <span className="ml-2 text-[10px] text-[#9AA3AE]">
                          (First attempt:{' '}
                          {firstLineAttemptCorrect ? 'Correct' : 'Incorrect'})
                        </span>
                      )}
                    </span>
                  </div>
                  {expandedCompletedStep === 2 ? (
                    <ChevronUp className="w-4 h-4 text-[#9AA3AE]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9AA3AE]" />
                  )}
                </button>
                {expandedCompletedStep === 2 && lineCheckExplanation && (
                  <div className="p-3 bg-[#0B0D10] border-t border-[#262B33] text-[#9AA3AE] font-mono text-xs leading-relaxed">
                    {lineCheckExplanation}
                  </div>
                )}
              </div>
            )}

            {/* Collapsed Step 3: Fix */}
            {(numericStep > 3 || currentStep === 'review') && (
              <div className="rounded-[8px] bg-[#181C22]/60 border border-[#262B33] overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCompletedStep(
                      expandedCompletedStep === 3 ? null : 3
                    )
                  }
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#181C22] transition-calm"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
                    <span className="font-semibold text-[#E8EAED]">
                      Step 3: Permanent Fix
                    </span>
                    <span className="text-[#9AA3AE] truncate max-w-xs font-mono">
                      — &quot;{fix.slice(0, 38)}...&quot;
                    </span>
                  </div>
                  {expandedCompletedStep === 3 ? (
                    <ChevronUp className="w-4 h-4 text-[#9AA3AE]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9AA3AE]" />
                  )}
                </button>
                {expandedCompletedStep === 3 && (
                  <div className="p-3 bg-[#0B0D10] border-t border-[#262B33] text-[#E8EAED] font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {fix}
                  </div>
                )}
              </div>
            )}

            {/* Collapsed Step 4: Confirmed Approach */}
            {(numericStep > 4 || currentStep === 'review') && confirmedApproach && (
              <div className="rounded-[8px] bg-[#181C22]/60 border border-[#262B33] overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCompletedStep(
                      expandedCompletedStep === 4 ? null : 4
                    )
                  }
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#181C22] transition-calm"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
                    <span className="font-semibold text-[#E8EAED]">
                      Step 4: Approach
                    </span>
                    <span className="text-[#9AA3AE] font-mono">
                      — {APPROACH_DETAILS[confirmedApproach as ApproachCategory]?.name || confirmedApproach}
                      <span className="ml-2 text-[10px] text-[#9AA3AE]">
                        ({classificationSource === 'ai' ? 'AI interpreted' : 'Manual selection'})
                      </span>
                    </span>
                  </div>
                  {expandedCompletedStep === 4 ? (
                    <ChevronUp className="w-4 h-4 text-[#9AA3AE]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9AA3AE]" />
                  )}
                </button>
                {expandedCompletedStep === 4 && (
                  <div className="p-3 bg-[#0B0D10] border-t border-[#262B33] text-[#9AA3AE] font-mono text-xs space-y-2 leading-relaxed">
                    {classificationReason && (
                      <p className="text-[#E8EAED]">
                        <span className="text-[#9AA3AE]">Reason: </span>
                        {classificationReason}
                      </p>
                    )}
                    {followUpQuestion && (
                      <p className="border-t border-[#262B33] pt-2 text-[#9AA3AE]">
                        <span className="text-[#F5A524]">Follow-up branch: </span>
                        {followUpQuestion}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Collapsed Step 5: Defense (if on review) */}
            {currentStep === 'review' && (
              <div className="rounded-[8px] bg-[#181C22]/60 border border-[#262B33] overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCompletedStep(
                      expandedCompletedStep === 5 ? null : 5
                    )
                  }
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#181C22] transition-calm"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
                    <span className="font-semibold text-[#E8EAED]">
                      Step 5: Defend
                    </span>
                    <span className="text-[#9AA3AE] truncate max-w-xs font-mono">
                      — &quot;{defense.slice(0, 38)}...&quot;
                    </span>
                  </div>
                  {expandedCompletedStep === 5 ? (
                    <ChevronUp className="w-4 h-4 text-[#9AA3AE]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9AA3AE]" />
                  )}
                </button>
                {expandedCompletedStep === 5 && (
                  <div className="p-3 bg-[#0B0D10] border-t border-[#262B33] text-[#E8EAED] font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {defense}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 1: MITIGATION */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#F5A524]">
                <ShieldAlert className="w-4 h-4" />
                <span>Immediate Containment</span>
              </div>
              <h3 className="text-lg font-semibold text-[#E8EAED]">
                It&apos;s 14:14 and customers are being credited twice. What do
                you do in the next two minutes to stop the damage, before writing
                any code?
              </h3>
              <p className="text-xs text-[#9AA3AE] leading-relaxed">
                Be specific: what action, on what, and why it is safe.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="mitigation-input" className="sr-only">
                Mitigation proposal
              </label>
              <textarea
                id="mitigation-input"
                rows={5}
                value={mitigation}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_MITIGATION',
                    payload: e.target.value,
                  })
                }
                placeholder="Describe your emergency containment action (e.g. roll back PR #412 or pause the webhook consumer)..."
                className="w-full bg-[#0B0D10] border border-[#262B33] rounded-[8px] p-3 text-sm text-[#E8EAED] placeholder-[#9AA3AE]/50 focus:border-[#F5A524] transition-calm focus:outline-none"
              />
              <div className="flex items-center justify-between text-xs text-[#9AA3AE] font-mono">
                <span>Min {MIN_MITIGATION_LENGTH} characters</span>
                <span
                  className={
                    mitigation.trim().length < MIN_MITIGATION_LENGTH
                      ? 'text-[#F85149]'
                      : 'text-[#3FB950]'
                  }
                >
                  {mitigation.trim().length} / {MIN_MITIGATION_LENGTH} chars
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={mitigation.trim().length < MIN_MITIGATION_LENGTH}
              onClick={handleLockMitigation}
              className="w-full py-2.5 px-4 rounded-[8px] bg-[#F5A524] hover:bg-[#e09419] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0D10] font-semibold text-sm transition-calm flex items-center justify-center space-x-2"
            >
              <span>Lock in mitigation</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: FIND THE FAULT */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#F5A524]">
                <FileSearch className="w-4 h-4" />
                <span>Deterministic Fault Inspection</span>
              </div>
              <h3 className="text-lg font-semibold text-[#E8EAED]">
                Select the faulty line in{' '}
                <code className="text-xs font-mono bg-[#181C22] px-1.5 py-0.5 rounded text-[#F5A524]">
                  deploy.diff
                </code>
                .
              </h3>
              <p className="text-xs text-[#9AA3AE] leading-relaxed">
                Click a line row in the diff pane on the left or use keyboard
                navigation to select it. Locate the exact line introducing the
                concurrency race condition.
              </p>
            </div>

            <div className="p-4 rounded-[8px] bg-[#0B0D10] border border-[#262B33] space-y-2">
              <div className="text-xs font-mono text-[#9AA3AE]">
                Selected Code Line:
              </div>
              <div className="text-sm font-mono text-[#E8EAED]">
                {selectedLine ? (
                  <span className="text-[#F5A524] font-semibold">
                    Line {selectedLine} selected
                  </span>
                ) : (
                  <span className="text-[#9AA3AE] italic">
                    None selected yet — click a line in deploy.diff
                  </span>
                )}
              </div>
            </div>

            {lineCheckError && (
              <div className="p-3 rounded-[6px] bg-[#F85149]/15 border border-[#F85149]/40 text-xs font-mono text-[#FFA198]">
                {lineCheckError}
              </div>
            )}

            {/* Verification Result Feedback */}
            {lineCheckResult && lineCheckExplanation && (
              <div
                className={`p-3.5 rounded-[8px] border text-xs ${
                  lineCheckResult === 'correct'
                    ? 'bg-[#3FB950]/10 border-[#3FB950]/40 text-[#3FB950]'
                    : lineCheckResult === 'partial'
                    ? 'bg-[#D29922]/10 border-[#D29922]/40 text-[#D29922]'
                    : 'bg-[#F85149]/10 border-[#F85149]/40 text-[#F85149]'
                }`}
                role="status"
                aria-live="polite"
              >
                <div className="font-semibold mb-1 flex items-center justify-between font-mono">
                  <span className="flex items-center space-x-1.5 uppercase tracking-wider">
                    {lineCheckResult === 'correct' && (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Correct Line Identified</span>
                      </>
                    )}
                    {lineCheckResult === 'partial' && (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>⚠ Partial Match</span>
                      </>
                    )}
                    {lineCheckResult === 'incorrect' && (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>✕ Not the Root Fault Line</span>
                      </>
                    )}
                  </span>
                  <span className="text-[10px] text-[#9AA3AE]">
                    Attempt {lineCheckAttempts}
                    {firstLineAttemptCorrect !== null && (
                      <span className="ml-1">
                        (First:{' '}
                        {firstLineAttemptCorrect ? 'Correct' : 'Incorrect'})
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-[#E8EAED] font-mono leading-relaxed mt-1">
                  {lineCheckExplanation}
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={!selectedLine || isCheckingLine}
                onClick={handleCheckLine}
                className="w-full py-2.5 px-4 rounded-[8px] bg-[#F5A524] hover:bg-[#e09419] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0D10] font-semibold text-sm transition-calm flex items-center justify-center space-x-2"
              >
                {isCheckingLine ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying on server...</span>
                  </>
                ) : (
                  <span>Check my line</span>
                )}
              </button>

              {/* Progress button enabled only AFTER at least 1 line check has completed */}
              {lineCheckAttempts > 0 && (
                <button
                  type="button"
                  onClick={handleAdvanceToFix}
                  className="w-full py-2.5 px-4 rounded-[8px] bg-[#181C22] border border-[#262B33] hover:border-[#9AA3AE] text-[#E8EAED] text-sm font-semibold transition-calm flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Step 3: Permanent Fix</span>
                  <ArrowRight className="w-4 h-4 text-[#F5A524]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: FIX */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#F5A524]">
                <Wrench className="w-4 h-4" />
                <span>Engineering Solution</span>
              </div>
              <h3 className="text-lg font-semibold text-[#E8EAED]">
                Explain the root cause and the fix you&apos;d ship. Prose or
                code is fine.
              </h3>
              <p className="text-xs text-[#9AA3AE] leading-relaxed">
                Describe how your solution permanently stops duplicate
                processing under concurrent delivery.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="fix-input" className="sr-only">
                Fix proposal
              </label>
              <textarea
                id="fix-input"
                rows={7}
                value={fix}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_FIX', payload: e.target.value })
                }
                placeholder={`Example:
I would add a UNIQUE constraint on ledger(reference) and wrap the handler in a single transaction with ON CONFLICT (reference) DO NOTHING...`}
                className="w-full bg-[#0B0D10] border border-[#262B33] rounded-[8px] p-3 text-xs md:text-sm font-mono text-[#E8EAED] placeholder-[#9AA3AE]/50 focus:border-[#F5A524] transition-calm focus:outline-none"
              />
              <div className="flex items-center justify-between text-xs text-[#9AA3AE] font-mono">
                <span>Min {MIN_FIX_LENGTH} characters</span>
                <span
                  className={
                    fix.trim().length < MIN_FIX_LENGTH
                      ? 'text-[#F85149]'
                      : 'text-[#3FB950]'
                  }
                >
                  {fix.trim().length} / {MIN_FIX_LENGTH} chars
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={fix.trim().length < MIN_FIX_LENGTH}
              onClick={handleSubmitFix}
              className="w-full py-2.5 px-4 rounded-[8px] bg-[#F5A524] hover:bg-[#e09419] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0D10] font-semibold text-sm transition-calm flex items-center justify-center space-x-2"
            >
              <span>Submit fix</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 4: CONFIRM INTERPRETATION */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#F5A524]">
                <Sparkles className="w-4 h-4" />
                <span>Fix Classification</span>
              </div>
              <h3 className="text-lg font-semibold text-[#E8EAED]">
                We read your fix as:
              </h3>
            </div>

            {/* Loading State */}
            {classificationStatus === 'loading' && (
              <div className="p-8 rounded-[8px] bg-[#0B0D10] border border-[#262B33] space-y-3 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#F5A524] mx-auto" />
                <div className="font-semibold text-sm text-[#E8EAED]">
                  Reading your fix…
                </div>
                <p className="text-xs text-[#9AA3AE] max-w-sm mx-auto leading-relaxed">
                  Analyzing duplicate-prevention mechanism and isolating technical trade-offs...
                </p>
              </div>
            )}

            {/* Error State with Retry & Manual Fallback */}
            {classificationStatus === 'error' && (
              <div className="p-4 rounded-[8px] bg-[#F85149]/10 border border-[#F85149]/30 space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-[#F85149] font-mono font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>AI Classification Unavailable</span>
                </div>
                <p className="text-[#FFA198] leading-relaxed">
                  {classificationError || 'Unable to connect to the classification provider.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'RETRY_CLASSIFICATION' })}
                    className="py-2 px-3 rounded-[6px] bg-[#181C22] border border-[#262B33] hover:border-[#9AA3AE] text-[#E8EAED] transition-calm flex items-center justify-center space-x-1.5 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry classification</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOverrideMenu(true)}
                    className="py-2 px-3 rounded-[6px] bg-[#F5A524] hover:bg-[#e09419] text-[#0B0D10] font-semibold transition-calm flex items-center justify-center space-x-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Select approach manually</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: 'LOAD_RECORDED_SESSION',
                        payload: recordedDuplicatePaymentSession,
                      })
                    }
                    className="py-2 px-3 rounded-[6px] bg-[#181C22] border border-[#262B33] hover:border-[#58A6FF] text-[#58A6FF] font-semibold transition-calm flex items-center justify-center space-x-1.5"
                  >
                    <span>Replay recorded example</span>
                  </button>
                </div>
              </div>
            )}

            {/* Successful AI Classification Card */}
            {classificationStatus === 'success' && classifiedApproach && !showOverrideMenu && (
              <div className="space-y-4">
                <div className="p-4 rounded-[8px] bg-[#0B0D10] border border-[#262B33] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#F5A524] font-mono">
                      {APPROACH_DETAILS[classifiedApproach as ApproachCategory]?.name || classifiedApproach}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181C22] border border-[#262B33] text-[#9AA3AE]">
                      AI INTERPRETATION
                    </span>
                  </div>
                  {classificationReason && (
                    <p className="text-xs text-[#E8EAED] leading-relaxed font-sans">
                      {classificationReason}
                    </p>
                  )}
                  <p className="text-[11px] text-[#9AA3AE] italic">
                    {APPROACH_DETAILS[classifiedApproach as ApproachCategory]?.description}
                  </p>
                </div>

                <p className="text-xs text-[#9AA3AE]">
                  Does this accurately capture the primary mechanism of your proposed fix?
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleAcceptAIClassification}
                    className="flex-1 py-2.5 px-4 rounded-[8px] bg-[#F5A524] hover:bg-[#e09419] text-[#0B0D10] font-semibold text-sm transition-calm flex items-center justify-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Yes, that&apos;s right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setManualSelectedApproach(classifiedApproach as ApproachCategory);
                      setShowOverrideMenu(true);
                    }}
                    className="py-2.5 px-4 rounded-[8px] bg-[#181C22] border border-[#262B33] hover:border-[#9AA3AE] text-[#E8EAED] text-sm transition-calm"
                  >
                    <span>Not quite</span>
                  </button>
                </div>
              </div>
            )}

            {/* Manual Selection / Override Menu */}
            {showOverrideMenu && (
              <div className="p-4 rounded-[8px] bg-[#181C22] border border-[#262B33] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-[#F5A524] uppercase tracking-wider font-semibold">
                    Select Your Intended Approach:
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B0D10] border border-[#262B33] text-[#9AA3AE]">
                    MANUAL OVERRIDE
                  </span>
                </div>
                <div className="space-y-1.5" role="radiogroup" aria-label="Fix approaches">
                  {approachCategories.map((category) => {
                    const info = APPROACH_DETAILS[category];
                    const isSelected = manualSelectedApproach === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setManualSelectedApproach(category)}
                        className={`w-full text-left p-3 rounded-[6px] text-xs transition-calm flex flex-col border ${
                          isSelected
                            ? 'bg-[#F5A524]/15 border-[#F5A524]/60 text-[#F5A524]'
                            : 'bg-[#0B0D10]/80 border-[#262B33] hover:border-[#9AA3AE]/60 text-[#E8EAED]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{info.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#F5A524]" />}
                        </div>
                        <span className="text-[11px] text-[#9AA3AE] mt-0.5 leading-snug">
                          {info.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isConfirmingApproach}
                    onClick={handleConfirmManualSelection}
                    className="flex-1 py-2.5 px-4 rounded-[8px] bg-[#F5A524] hover:bg-[#e09419] disabled:opacity-50 text-[#0B0D10] font-semibold text-sm transition-calm flex items-center justify-center space-x-1.5"
                  >
                    {isConfirmingApproach ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <span>Confirm selection</span>
                    )}
                  </button>

                  {classificationStatus === 'success' && (
                    <button
                      type="button"
                      onClick={() => setShowOverrideMenu(false)}
                      className="py-2.5 px-3 rounded-[8px] bg-[#0B0D10] border border-[#262B33] hover:border-[#9AA3AE] text-[#9AA3AE] text-xs transition-calm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: DEFEND */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#F5A524]">
                <MessageSquareCheck className="w-4 h-4" />
                <span>Follow-up Defense</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#181C22] border border-[#262B33] text-[#9AA3AE]">
                  Follow-up — prewritten, not AI-generated
                </span>
                {confirmedApproach && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5A524]/10 border border-[#F5A524]/30 text-[#F5A524]">
                    Branch: {confirmedApproach}
                  </span>
                )}
              </div>

              <h3 className="text-base font-semibold text-[#E8EAED] leading-snug pt-1">
                {followUpQuestion ||
                  'Walk through, step by step, what happens when two deliveries of the same event arrive 4 ms apart under your fix.'}
              </h3>
              <p className="text-xs text-[#9AA3AE] leading-relaxed">
                Explain how your architecture holds up against this trade-off or boundary condition.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="defense-input" className="sr-only">
                Defense response
              </label>
              <textarea
                id="defense-input"
                rows={6}
                value={defense}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_DEFENSE', payload: e.target.value })
                }
                placeholder="Explain and defend your engineering decision..."
                className="w-full bg-[#0B0D10] border border-[#262B33] rounded-[8px] p-3 text-sm text-[#E8EAED] placeholder-[#9AA3AE]/50 focus:border-[#F5A524] transition-calm focus:outline-none"
              />
              <div className="flex items-center justify-between text-xs text-[#9AA3AE] font-mono">
                <span>Min {MIN_DEFENSE_LENGTH} characters</span>
                <span
                  className={
                    defense.trim().length < MIN_DEFENSE_LENGTH
                      ? 'text-[#F85149]'
                      : 'text-[#3FB950]'
                  }
                >
                  {defense.trim().length} / {MIN_DEFENSE_LENGTH} chars
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={defense.trim().length < MIN_DEFENSE_LENGTH}
              onClick={handleSubmitDefense}
              className="w-full py-2.5 px-4 rounded-[8px] bg-[#F5A524] hover:bg-[#e09419] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0D10] font-semibold text-sm transition-calm flex items-center justify-center space-x-2"
            >
              <span>Submit for review</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* REVIEW STEP (PHASE 4) */}
        {currentStep === 'review' && (
          <div className="space-y-4">
            {reviewStatus === 'loading' && (
              <div className="p-6 rounded-[8px] bg-[#181C22]/90 border border-[#262B33] space-y-4 text-center">
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#F5A524]/10 border border-[#F5A524]/30 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#F5A524] animate-spin" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[#E8EAED]">
                    Evaluating Engineering Review...
                  </h4>
                  <p className="text-xs text-[#9AA3AE]">
                    Analyzing your responses against the 4-item rubric with deterministic quote verification.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-[#9AA3AE] pt-3 border-t border-[#262B33]">
                  Checking line selection &bull; Verifying verbatim citations &bull; Loading curated solution
                </div>
              </div>
            )}

            {reviewStatus === 'error' && (
              <div className="p-4 rounded-[8px] bg-[#181C22]/90 border border-[#F85149]/40 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-mono text-[#F85149]">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="uppercase tracking-wider font-semibold">
                    Review Evaluation Unavailable
                  </span>
                </div>
                <p className="text-xs text-[#E8EAED] leading-relaxed">
                  {reviewError || 'Unable to complete AI evaluation at this time.'}
                </p>
                <p className="text-xs text-[#9AA3AE] leading-relaxed">
                  Your answers are fully preserved. You can retry the review evaluation without losing any work.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'RETRY_REVIEW' })}
                    className="py-2 px-4 rounded-[8px] bg-[#F5A524] hover:bg-[#e09419] text-[#0B0D10] font-semibold text-xs transition-calm flex items-center justify-center space-x-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Review</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: 'LOAD_RECORDED_SESSION',
                        payload: recordedDuplicatePaymentSession,
                      })
                    }
                    className="py-2 px-3 rounded-[8px] bg-[#181C22] border border-[#262B33] hover:border-[#58A6FF] text-[#58A6FF] font-semibold text-xs transition-calm flex items-center justify-center space-x-2"
                  >
                    <span>Replay recorded example</span>
                  </button>
                </div>
              </div>
            )}

            {reviewStatus === 'success' && reviewResult && (
              <ReviewScreen state={state} dispatch={dispatch} incidentId={incidentId} />
            )}
          </div>
        )}
      </div>

      {/* Console Status Bar */}
      <div className="border-t border-[#262B33] bg-[#181C22]/80 px-4 py-2.5 flex items-center justify-between text-[11px] text-[#9AA3AE] font-mono">
        <div className="flex items-center space-x-2">
          {state.isRecordedSession ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#58A6FF] inline-block animate-pulse" />
              <span className="text-[#58A6FF] font-semibold">RECORDED DEMO MODE</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[#3FB950] inline-block" />
              <span>SESSION ACTIVE</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <span>LINE ATTEMPTS: {lineCheckAttempts}</span>
          <span>•</span>
          <span>STEP: {numericStep}/5</span>
        </div>
      </div>
    </section>
  );
}
