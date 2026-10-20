import { describe, it, expect } from 'vitest';
import {
  exerciseReducer,
  initialExerciseState,
  ExerciseState,
} from '@/lib/exerciseReducer';

describe('Exercise State Machine (exerciseReducer)', () => {
  it('updates mitigation text', () => {
    const state = exerciseReducer(initialExerciseState, {
      type: 'UPDATE_MITIGATION',
      payload: 'Roll back PR #412 immediately to replicas: 1',
    });
    expect(state.mitigation).toBe('Roll back PR #412 immediately to replicas: 1');
  });

  it('prevents locking mitigation if length is less than 20 chars', () => {
    const shortState: ExerciseState = {
      ...initialExerciseState,
      mitigation: 'Too short',
    };
    const nextState = exerciseReducer(shortState, { type: 'LOCK_MITIGATION' });
    expect(nextState.mitigationLocked).toBe(false);
    expect(nextState.currentStep).toBe(1);
  });

  it('locks mitigation and advances to Step 2 when valid (>= 20 chars)', () => {
    const validState: ExerciseState = {
      ...initialExerciseState,
      mitigation: 'Roll back PR #412 immediately to replicas: 1 and pause consumer.',
    };
    const nextState = exerciseReducer(validState, { type: 'LOCK_MITIGATION' });
    expect(nextState.mitigationLocked).toBe(true);
    expect(nextState.currentStep).toBe(2);
  });

  it('preserves completed mitigation response and prevents edits once locked', () => {
    const lockedState: ExerciseState = {
      ...initialExerciseState,
      currentStep: 2,
      mitigation: 'Roll back PR #412 immediately to replicas: 1 and pause consumer.',
      mitigationLocked: true,
    };
    const attemptedEdit = exerciseReducer(lockedState, {
      type: 'UPDATE_MITIGATION',
      payload: 'Trying to overwrite locked mitigation',
    });
    expect(attemptedEdit.mitigation).toBe(lockedState.mitigation);
  });

  it('records line selection', () => {
    const state = exerciseReducer(initialExerciseState, {
      type: 'SELECT_LINE',
      payload: 9,
    });
    expect(state.selectedLine).toBe(9);
  });

  it('tracks first-attempt accuracy as true when first check is correct', () => {
    const step2State: ExerciseState = {
      ...initialExerciseState,
      currentStep: 2,
      selectedLine: 9,
    };

    const nextState = exerciseReducer(step2State, {
      type: 'LINE_CHECK_COMPLETED',
      payload: {
        result: 'correct',
        explanation: 'Check-then-act race flaw.',
      },
    });

    expect(nextState.lineCheckResult).toBe('correct');
    expect(nextState.lineCheckAttempts).toBe(1);
    expect(nextState.firstLineAttemptCorrect).toBe(true);
  });

  it('preserves first-attempt accuracy as false even if subsequent check is correct', () => {
    // Attempt 1: Learner checks Line 5 (incorrect)
    const step2State: ExerciseState = {
      ...initialExerciseState,
      currentStep: 2,
      selectedLine: 5,
    };

    const firstCheckState = exerciseReducer(step2State, {
      type: 'LINE_CHECK_COMPLETED',
      payload: {
        result: 'incorrect',
        explanation: 'Not root flaw.',
      },
    });

    expect(firstCheckState.firstLineAttemptCorrect).toBe(false);
    expect(firstCheckState.lineCheckAttempts).toBe(1);

    // Attempt 2: Learner then selects and checks Line 9 (correct)
    const secondCheckState = exerciseReducer(firstCheckState, {
      type: 'LINE_CHECK_COMPLETED',
      payload: {
        result: 'correct',
        explanation: 'Check-then-act race flaw.',
      },
    });

    expect(secondCheckState.lineCheckResult).toBe('correct');
    expect(secondCheckState.lineCheckAttempts).toBe(2);
    // Crucial requirement: firstLineAttemptCorrect MUST NOT be overwritten!
    expect(secondCheckState.firstLineAttemptCorrect).toBe(false);
  });

  it('prevents advancing to Step 3 if no line check was performed', () => {
    const unvalidatedState: ExerciseState = {
      ...initialExerciseState,
      currentStep: 2,
      lineCheckAttempts: 0,
    };

    const nextState = exerciseReducer(unvalidatedState, {
      type: 'ADVANCE_TO_FIX',
    });
    expect(nextState.currentStep).toBe(2);
  });

  it('allows advancing to Step 3 once at least one line check is completed (even if incorrect)', () => {
    const checkedState: ExerciseState = {
      ...initialExerciseState,
      currentStep: 2,
      lineCheckAttempts: 1,
      lineCheckResult: 'incorrect',
      firstLineAttemptCorrect: false,
    };

    const nextState = exerciseReducer(checkedState, {
      type: 'ADVANCE_TO_FIX',
    });
    expect(nextState.currentStep).toBe(3);
  });

  it('prevents submitting fix if length is less than 30 chars', () => {
    const step3State: ExerciseState = {
      ...initialExerciseState,
      currentStep: 3,
      fix: 'Short fix',
    };

    const nextState = exerciseReducer(step3State, { type: 'SUBMIT_FIX' });
    expect(nextState.fixSubmitted).toBe(false);
    expect(nextState.currentStep).toBe(3);
  });

  it('submits fix and advances to Step 4 when valid (>= 30 chars)', () => {
    const step3State: ExerciseState = {
      ...initialExerciseState,
      currentStep: 3,
      fix: 'I would add an ALTER TABLE ledger ADD CONSTRAINT ledger_ref_key UNIQUE (reference); and use ON CONFLICT DO NOTHING.',
    };

    const nextState = exerciseReducer(step3State, { type: 'SUBMIT_FIX' });
    expect(nextState.fixSubmitted).toBe(true);
    expect(nextState.currentStep).toBe(4);
  });

  it('preserves completed fix response and prevents edits once submitted', () => {
    const submittedState: ExerciseState = {
      ...initialExerciseState,
      currentStep: 4,
      fix: 'I would add an ALTER TABLE ledger ADD CONSTRAINT ledger_ref_key UNIQUE (reference); and use ON CONFLICT DO NOTHING.',
      fixSubmitted: true,
    };

    const attemptedEdit = exerciseReducer(submittedState, {
      type: 'UPDATE_FIX',
      payload: 'Attempting to overwrite submitted fix',
    });
    expect(attemptedEdit.fix).toBe(submittedState.fix);
  });
});
