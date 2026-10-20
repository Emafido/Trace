import { describe, it, expect } from 'vitest';
import {
  exerciseReducer,
  initialExerciseState,
  ExerciseState,
} from '@/lib/exerciseReducer';
import { ReviewResult } from '@/lib/reviewEvaluator';
import { serverDuplicatePaymentIncident } from '@/data/server/incidents/duplicate-payment';

describe('Exercise State Machine: Phase 4 Review Extensions', () => {
  const completedState: ExerciseState = {
    ...initialExerciseState,
    currentStep: 5,
    mitigation: 'Pause webhook processing and scale down consumers.',
    mitigationLocked: true,
    selectedLine: 9,
    lineCheckResult: 'correct',
    firstLineAttemptCorrect: true,
    lineCheckAttempts: 1,
    fix: 'ALTER TABLE ledger ADD CONSTRAINT uq_ledger_ref UNIQUE (reference);',
    fixSubmitted: true,
    classificationStatus: 'success',
    classifiedApproach: 'unique_constraint',
    confirmedApproach: 'unique_constraint',
    defense: 'Database constraints enforce atomicity across all nodes even during cluster failovers.',
    defenseSubmitted: true,
  };

  const sampleReviewResult: ReviewResult = {
    items: [
      {
        id: 'r1',
        title: 'Immediate Mitigation',
        status: 'CAUGHT',
        quote: 'Pause webhook processing',
        note: 'Identifies containment action.',
      },
      {
        id: 'r2',
        title: 'Root Cause',
        status: 'MISSED',
        quote: null,
        note: 'Check-then-act race omitted.',
      },
      {
        id: 'r3',
        title: 'Permanent Fix',
        status: 'CAUGHT',
        quote: 'UNIQUE (reference)',
        note: 'Applies database uniqueness.',
      },
      {
        id: 'r4',
        title: 'Data Repair',
        status: 'MISSED',
        quote: null,
        note: 'Ledger reconciliation omitted.',
      },
    ],
    referenceSolution: serverDuplicatePaymentIncident.referenceSolution,
  };

  it('SUBMIT_DEFENSE transitions currentStep to "review" and initializes reviewStatus to "idle"', () => {
    const preSubmitState: ExerciseState = {
      ...completedState,
      currentStep: 5,
      defenseSubmitted: false,
      defense: 'Valid defense string with sufficient length for validation.',
    };

    const nextState = exerciseReducer(preSubmitState, { type: 'SUBMIT_DEFENSE' });
    expect(nextState.currentStep).toBe('review');
    expect(nextState.defenseSubmitted).toBe(true);
    expect(nextState.reviewStatus).toBe('idle');
  });

  it('START_REVIEW sets reviewStatus to loading without altering user answers', () => {
    const reviewInitState: ExerciseState = {
      ...completedState,
      currentStep: 'review',
      reviewStatus: 'idle',
      reviewError: 'old error',
    };

    const nextState = exerciseReducer(reviewInitState, { type: 'START_REVIEW' });
    expect(nextState.reviewStatus).toBe('loading');
    expect(nextState.reviewError).toBeNull();
    // Prior answers remain completely untouched
    expect(nextState.mitigation).toBe(completedState.mitigation);
    expect(nextState.fix).toBe(completedState.fix);
    expect(nextState.defense).toBe(completedState.defense);
  });

  it('REVIEW_SUCCESS stores reviewResult and sets reviewStatus to success', () => {
    const loadingState: ExerciseState = {
      ...completedState,
      currentStep: 'review',
      reviewStatus: 'loading',
    };

    const nextState = exerciseReducer(loadingState, {
      type: 'REVIEW_SUCCESS',
      payload: sampleReviewResult,
    });

    expect(nextState.reviewStatus).toBe('success');
    expect(nextState.reviewResult).toEqual(sampleReviewResult);
    expect(nextState.reviewError).toBeNull();
  });

  it('REVIEW_FAILED records error and preserves all learner answers for retry', () => {
    const loadingState: ExerciseState = {
      ...completedState,
      currentStep: 'review',
      reviewStatus: 'loading',
    };

    const nextState = exerciseReducer(loadingState, {
      type: 'REVIEW_FAILED',
      payload: 'Provider rate limit exceeded',
    });

    expect(nextState.reviewStatus).toBe('error');
    expect(nextState.reviewError).toBe('Provider rate limit exceeded');
    expect(nextState.mitigation).toBe(completedState.mitigation);
    expect(nextState.fix).toBe(completedState.fix);
    expect(nextState.defense).toBe(completedState.defense);
  });

  it('RETRY_REVIEW resets reviewStatus to idle for clean re-evaluation', () => {
    const errorState: ExerciseState = {
      ...completedState,
      currentStep: 'review',
      reviewStatus: 'error',
      reviewError: 'Temporary network failure',
    };

    const nextState = exerciseReducer(errorState, { type: 'RETRY_REVIEW' });
    expect(nextState.reviewStatus).toBe('idle');
    expect(nextState.reviewError).toBeNull();
    expect(nextState.defense).toBe(completedState.defense);
  });

  it('SELECT_RUBRIC_ITEM updates active rubric item for evidence highlighting', () => {
    const successState: ExerciseState = {
      ...completedState,
      currentStep: 'review',
      reviewStatus: 'success',
      reviewResult: sampleReviewResult,
      selectedRubricItem: null,
    };

    const stateWithR1 = exerciseReducer(successState, {
      type: 'SELECT_RUBRIC_ITEM',
      payload: 'r1',
    });
    expect(stateWithR1.selectedRubricItem).toBe('r1');

    const stateDeselected = exerciseReducer(stateWithR1, {
      type: 'SELECT_RUBRIC_ITEM',
      payload: null,
    });
    expect(stateDeselected.selectedRubricItem).toBeNull();
  });

  it('RESET restores initialExerciseState completely', () => {
    const completedReviewState: ExerciseState = {
      ...completedState,
      currentStep: 'review',
      reviewStatus: 'success',
      reviewResult: sampleReviewResult,
      selectedRubricItem: 'r3',
    };

    const resetState = exerciseReducer(completedReviewState, { type: 'RESET' });
    expect(resetState).toEqual(initialExerciseState);
    expect(resetState.currentStep).toBe(1);
    expect(resetState.mitigation).toBe('');
    expect(resetState.fix).toBe('');
    expect(resetState.defense).toBe('');
    expect(resetState.reviewResult).toBeNull();
  });
});
