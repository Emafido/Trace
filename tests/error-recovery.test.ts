import { describe, it, expect } from 'vitest';
import { exerciseReducer, initialExerciseState, ExerciseState } from '@/lib/exerciseReducer';

describe('Error Recovery & Non-Destructive Fallbacks (lib/exerciseReducer.ts)', () => {
  const step4State: ExerciseState = {
    ...initialExerciseState,
    currentStep: 4,
    mitigation: 'Pause webhook processing and scale down workers immediately.',
    mitigationLocked: true,
    selectedLine: 9,
    lineCheckResult: 'correct',
    firstLineAttemptCorrect: true,
    lineCheckAttempts: 1,
    fix: 'ALTER TABLE ledger ADD CONSTRAINT uq_ref UNIQUE (reference);',
    fixSubmitted: true,
    classificationStatus: 'loading',
  };

  const step5ReviewState: ExerciseState = {
    ...step4State,
    currentStep: 'review',
    confirmedApproach: 'unique_constraint',
    defense: 'Database uniqueness guarantees idempotency across all concurrent instances.',
    defenseSubmitted: true,
    reviewStatus: 'loading',
  };

  it('preserves submitted fix when AI classification encounters an error', () => {
    const errorState = exerciseReducer(step4State, {
      type: 'CLASSIFICATION_FAILED',
      payload: 'Provider rate limit exceeded or timeout after 20s',
    });

    expect(errorState.classificationStatus).toBe('error');
    expect(errorState.classificationError).toContain('Provider rate limit');
    expect(errorState.fix).toBe(step4State.fix);
    expect(errorState.mitigation).toBe(step4State.mitigation);
  });

  it('allows retrying classification without clearing fix or user progress', () => {
    const errorState = exerciseReducer(step4State, {
      type: 'CLASSIFICATION_FAILED',
      payload: 'Network error',
    });

    const retriedState = exerciseReducer(errorState, {
      type: 'RETRY_CLASSIFICATION',
    });

    expect(retriedState.classificationStatus).toBe('idle');
    expect(retriedState.classificationError).toBeNull();
    expect(retriedState.fix).toBe(step4State.fix);
  });

  it('allows manual approach selection when AI classification fails', () => {
    const errorState = exerciseReducer(step4State, {
      type: 'CLASSIFICATION_FAILED',
      payload: 'LLM API key is not configured',
    });

    const manualConfirmedState = exerciseReducer(errorState, {
      type: 'CONFIRM_APPROACH',
      payload: {
        approach: 'unique_constraint',
        followUpQuestion: 'What response should the endpoint return to the provider?',
        source: 'manual',
      },
    });

    expect(manualConfirmedState.currentStep).toBe(5);
    expect(manualConfirmedState.confirmedApproach).toBe('unique_constraint');
    expect(manualConfirmedState.classificationSource).toBe('manual');
    expect(manualConfirmedState.fix).toBe(step4State.fix);
  });

  it('preserves submitted defense when review evaluation encounters an error', () => {
    const errorState = exerciseReducer(step5ReviewState, {
      type: 'REVIEW_FAILED',
      payload: 'LLM timeout after 20s',
    });

    expect(errorState.reviewStatus).toBe('error');
    expect(errorState.reviewError).toContain('LLM timeout');
    expect(errorState.defense).toBe(step5ReviewState.defense);
    expect(errorState.fix).toBe(step5ReviewState.fix);
  });

  it('allows retrying review without clearing defense or earlier steps', () => {
    const errorState = exerciseReducer(step5ReviewState, {
      type: 'REVIEW_FAILED',
      payload: 'Provider unavailable',
    });

    const retriedState = exerciseReducer(errorState, {
      type: 'RETRY_REVIEW',
    });

    expect(retriedState.reviewStatus).toBe('idle');
    expect(retriedState.reviewError).toBeNull();
    expect(retriedState.defense).toBe(step5ReviewState.defense);
  });

  it('prevents modifying locked mitigation once locked in Step 2', () => {
    const lockedState: ExerciseState = {
      ...initialExerciseState,
      currentStep: 2,
      mitigation: 'Initial valid mitigation text',
      mitigationLocked: true,
    };

    const attemptEdit = exerciseReducer(lockedState, {
      type: 'UPDATE_MITIGATION',
      payload: 'Tampered mitigation text',
    });

    expect(attemptEdit.mitigation).toBe('Initial valid mitigation text');
  });

  it('prevents modifying submitted fix once submitted in Step 4', () => {
    const submittedState: ExerciseState = {
      ...initialExerciseState,
      currentStep: 4,
      fix: 'Initial valid permanent fix text',
      fixSubmitted: true,
    };

    const attemptEdit = exerciseReducer(submittedState, {
      type: 'UPDATE_FIX',
      payload: 'Tampered fix text',
    });

    expect(attemptEdit.fix).toBe('Initial valid permanent fix text');
  });

  it('prevents modifying submitted defense once submitted in Review step', () => {
    const submittedDefenseState: ExerciseState = {
      ...initialExerciseState,
      currentStep: 'review',
      defense: 'Initial valid defense text',
      defenseSubmitted: true,
    };

    const attemptEdit = exerciseReducer(submittedDefenseState, {
      type: 'UPDATE_DEFENSE',
      payload: 'Tampered defense text',
    });

    expect(attemptEdit.defense).toBe('Initial valid defense text');
  });
});
