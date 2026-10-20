import { ReviewResult } from '@/lib/reviewEvaluator';
import { serverDuplicatePaymentIncident } from '@/data/server/incidents/duplicate-payment';
import { ApproachCategory } from '@/lib/fixClassifier';

export interface RecordedSession {
  incidentId: string;
  recordedAt: string;
  fixtureName: string;
  isRecorded: true;
  learnerAnswers: {
    mitigation: string;
    selectedLine: number;
    firstLineAttemptCorrect: boolean;
    fix: string;
    defense: string;
  };
  classification: {
    approach: ApproachCategory;
    reason: string;
    source: 'ai';
  };
  followUp: {
    question: string;
  };
  reviewResult: ReviewResult;
}

/**
 * Authentic recorded session based on Fixture A (Strong Engineering Response).
 * This session provides a reliable presentation demo fallback if live LLM endpoints
 * are unavailable during the Talent Nation AI Rebuild presentation on October 21.
 *
 * Essential Honesty Rule:
 * This recorded session is strictly associated with these exact inputs.
 * It is never displayed as if it evaluated arbitrary user input.
 */
export const recordedDuplicatePaymentSession: RecordedSession = {
  incidentId: 'duplicate-payment',
  recordedAt: '2026-10-20T12:00:00Z',
  fixtureName: 'Fixture A: Strong Engineering Response',
  isRecorded: true,
  learnerAnswers: {
    mitigation:
      'I would pause webhook processing or roll back PR #412 to prevent additional duplicate credits while preserving events for safe replay.',
    selectedLine: 9,
    firstLineAttemptCorrect: true,
    fix:
      'The SELECT-before-INSERT logic has a check-then-act race. Two workers can both observe no ledger row. I would reconcile existing duplicate references, add a unique constraint on ledger(reference), then use INSERT ON CONFLICT DO NOTHING within a database transaction. I would update the balance only if the insert succeeded.',
    defense:
      "Return the provider's documented successful acknowledgment for an already processed event so it does not retry unnecessarily. Log the duplicate reference and outcome without processing the credit again.",
  },
  classification: {
    approach: 'unique_constraint',
    reason: 'Proposes database-level unique constraint on reference with atomic ON CONFLICT DO NOTHING insertion.',
    source: 'ai',
  },
  followUp: {
    question:
      'A duplicate delivery now hits the constraint. What response should the endpoint return to the provider, and what should you log?',
  },
  reviewResult: {
    items: [
      {
        id: 'r1',
        title: 'Mitigation',
        status: 'CAUGHT',
        quote: 'pause webhook processing or roll back PR #412',
        note: 'Identifies immediate containment action before code changes.',
        verificationFailed: false,
      },
      {
        id: 'r2',
        title: 'Root Cause',
        status: 'CAUGHT',
        quote: 'The SELECT-before-INSERT logic has a check-then-act race. Two workers can both observe no ledger row.',
        note: 'Clearly identifies concurrent check-then-act race condition.',
        verificationFailed: false,
      },
      {
        id: 'r3',
        title: 'Permanent Fix',
        status: 'CAUGHT',
        quote: 'add a unique constraint on ledger(reference), then use INSERT ON CONFLICT DO NOTHING within a database transaction.',
        note: 'Enforces database-level atomic uniqueness constraint.',
        verificationFailed: false,
      },
      {
        id: 'r4',
        title: 'Data Repair',
        status: 'CAUGHT',
        quote: 'reconcile existing duplicate references',
        note: 'Explicitly identifies need to reconcile existing corrupted ledger rows.',
        verificationFailed: false,
      },
    ],
    referenceSolution: serverDuplicatePaymentIncident.referenceSolution,
  },
};
