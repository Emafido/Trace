import { describe, it, expect } from 'vitest';
import {
  exerciseReducer,
  initialExerciseState,
  ExerciseState,
} from '@/lib/exerciseReducer';

describe('Exercise State Machine: Phase 3 Extensions', () => {
  const basePhase2CompletedState: ExerciseState = {
    ...initialExerciseState,
    currentStep: 4,
    mitigation: 'Roll back PR #412 immediately to replicas: 1',
    mitigationLocked: true,
    selectedLine: 9,
    lineCheckResult: 'correct',
    lineCheckExplanation: 'Lines 9-10 introduce check-then-act race flaw.',
    firstLineAttemptCorrect: true,
    lineCheckAttempts: 1,
    fix: 'I would add a unique constraint on ledger(reference) and wrap insert in ON CONFLICT DO NOTHING.',
    fixSubmitted: true,
  };

  it('sets classificationStatus to loading upon START_CLASSIFICATION without losing prior answers', () => {
    const loadingState = exerciseReducer(basePhase2CompletedState, {
      type: 'START_CLASSIFICATION',
    });

    expect(loadingState.classificationStatus).toBe('loading');
    expect(loadingState.classificationError).toBe(null);
    expect(loadingState.mitigation).toBe(basePhase2CompletedState.mitigation);
    expect(loadingState.selectedLine).toBe(9);
    expect(loadingState.firstLineAttemptCorrect).toBe(true);
    expect(loadingState.fix).toBe(basePhase2CompletedState.fix);
  });

  it('records successful AI classification', () => {
    const successState = exerciseReducer(basePhase2CompletedState, {
      type: 'CLASSIFICATION_SUCCESS',
      payload: {
        approach: 'unique_constraint',
        reason: 'The learner uses database-enforced uniqueness.',
        followUpQuestion: 'A duplicate delivery now hits the constraint...',
      },
    });

    expect(successState.classificationStatus).toBe('success');
    expect(successState.classifiedApproach).toBe('unique_constraint');
    expect(successState.confirmedApproach).toBe('unique_constraint');
    expect(successState.classificationSource).toBe('ai');
    expect(successState.classificationReason).toBe(
      'The learner uses database-enforced uniqueness.'
    );
    expect(successState.followUpQuestion).toContain('A duplicate delivery now hits the constraint');
  });

  it('records classification failure and preserves all previous user submissions', () => {
    const failedState = exerciseReducer(basePhase2CompletedState, {
      type: 'CLASSIFICATION_FAILED',
      payload: 'LLM request timed out after 20 seconds.',
    });

    expect(failedState.classificationStatus).toBe('error');
    expect(failedState.classificationError).toBe(
      'LLM request timed out after 20 seconds.'
    );
    // User responses remain completely intact
    expect(failedState.fix).toBe(basePhase2CompletedState.fix);
    expect(failedState.mitigation).toBe(basePhase2CompletedState.mitigation);
  });

  it('allows RETRY_CLASSIFICATION without losing fix or progress', () => {
    const errorState: ExerciseState = {
      ...basePhase2CompletedState,
      classificationStatus: 'error',
      classificationError: 'Network error',
    };

    const retryState = exerciseReducer(errorState, {
      type: 'RETRY_CLASSIFICATION',
    });

    expect(retryState.classificationStatus).toBe('idle');
    expect(retryState.classificationError).toBe(null);
    expect(retryState.fix).toBe(basePhase2CompletedState.fix);
  });

  it('confirms AI approach and advances to Step 5', () => {
    const classifiedState: ExerciseState = {
      ...basePhase2CompletedState,
      classificationStatus: 'success',
      classifiedApproach: 'unique_constraint',
      confirmedApproach: 'unique_constraint',
      classificationSource: 'ai',
      followUpQuestion: 'A duplicate delivery now hits the constraint...',
    };

    const step5State = exerciseReducer(classifiedState, {
      type: 'CONFIRM_APPROACH',
      payload: {
        approach: 'unique_constraint',
        followUpQuestion: 'A duplicate delivery now hits the constraint...',
        source: 'ai',
      },
    });

    expect(step5State.currentStep).toBe(5);
    expect(step5State.confirmedApproach).toBe('unique_constraint');
    expect(step5State.classificationSource).toBe('ai');
  });

  it('handles user manual override of AI classification with clear manual source tracking', () => {
    // AI read it as unique_constraint, but learner clarifies they used a row_lock
    const classifiedState: ExerciseState = {
      ...basePhase2CompletedState,
      classificationStatus: 'success',
      classifiedApproach: 'unique_constraint',
      confirmedApproach: 'unique_constraint',
      classificationSource: 'ai',
      followUpQuestion: 'A duplicate delivery now hits the constraint...',
    };

    const overrideState = exerciseReducer(classifiedState, {
      type: 'CONFIRM_APPROACH',
      payload: {
        approach: 'row_lock',
        followUpQuestion:
          'If the notification call runs inside your locked transaction and the notification service slows to 8 seconds, what happens to your connection pool?',
        source: 'manual',
      },
    });

    expect(overrideState.currentStep).toBe(5);
    expect(overrideState.classifiedApproach).toBe('unique_constraint'); // Preserves what AI read
    expect(overrideState.confirmedApproach).toBe('row_lock'); // Learner override recorded
    expect(overrideState.classificationSource).toBe('manual'); // Labeled as manual
    expect(overrideState.followUpQuestion).toContain('connection pool');
  });

  it('updates defense text in Step 5', () => {
    const step5State: ExerciseState = {
      ...basePhase2CompletedState,
      currentStep: 5,
      confirmedApproach: 'unique_constraint',
    };

    const nextState = exerciseReducer(step5State, {
      type: 'UPDATE_DEFENSE',
      payload: 'The provider receives HTTP 200 to acknowledge the delivery and stop retries.',
    });

    expect(nextState.defense).toBe(
      'The provider receives HTTP 200 to acknowledge the delivery and stop retries.'
    );
  });

  it('prevents submitting defense if length is less than 20 chars', () => {
    const step5State: ExerciseState = {
      ...basePhase2CompletedState,
      currentStep: 5,
      defense: 'Too short',
    };

    const nextState = exerciseReducer(step5State, { type: 'SUBMIT_DEFENSE' });
    expect(nextState.defenseSubmitted).toBe(false);
    expect(nextState.currentStep).toBe(5);
  });

  it('submits defense and advances to review step when valid (>= 20 chars)', () => {
    const step5State: ExerciseState = {
      ...basePhase2CompletedState,
      currentStep: 5,
      defense: 'The endpoint returns HTTP 200 on duplicate constraint violations so the provider knows it was delivered safely.',
    };

    const nextState = exerciseReducer(step5State, { type: 'SUBMIT_DEFENSE' });
    expect(nextState.defenseSubmitted).toBe(true);
    expect(nextState.currentStep).toBe('review');
  });

  it('preserves completed defense and prevents edits once submitted', () => {
    const submittedState: ExerciseState = {
      ...basePhase2CompletedState,
      currentStep: 'review',
      defense: 'The endpoint returns HTTP 200 on duplicate constraint violations so the provider knows it was delivered safely.',
      defenseSubmitted: true,
    };

    const attemptedEdit = exerciseReducer(submittedState, {
      type: 'UPDATE_DEFENSE',
      payload: 'Attempting to overwrite submitted defense',
    });
    expect(attemptedEdit.defense).toBe(submittedState.defense);
  });
});
