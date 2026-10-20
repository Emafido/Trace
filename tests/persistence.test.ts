import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveExerciseSession,
  loadExerciseSession,
  clearExerciseSession,
  sanitizeRestoredState,
} from '@/lib/storage';
import { ExerciseState, initialExerciseState } from '@/lib/exerciseReducer';

describe('Session Persistence (lib/storage.ts)', () => {
  const incidentId = 'duplicate-payment';

  // Mock in-memory sessionStorage
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    (globalThis as { window?: unknown }).window = {
      sessionStorage: {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          mockStorage = {};
        },
      },
    };
  });

  it('saves and loads a valid exercise state to/from sessionStorage', () => {
    const state: ExerciseState = {
      ...initialExerciseState,
      currentStep: 3,
      mitigation: 'Pause webhook processing and scale down workers immediately.',
      mitigationLocked: true,
      selectedLine: 9,
      lineCheckResult: 'correct',
      lineCheckExplanation: 'Lines 9-10 are faulty.',
      firstLineAttemptCorrect: true,
      lineCheckAttempts: 1,
      fix: 'ALTER TABLE ledger ADD CONSTRAINT uq_ref UNIQUE (reference);',
      fixSubmitted: false,
    };

    const saved = saveExerciseSession(incidentId, state);
    expect(saved).toBe(true);

    const loaded = loadExerciseSession(incidentId);
    expect(loaded).not.toBeNull();
    expect(loaded?.currentStep).toBe(3);
    expect(loaded?.mitigation).toBe(state.mitigation);
    expect(loaded?.selectedLine).toBe(9);
    expect(loaded?.lineCheckResult).toBe('correct');
    expect(loaded?.firstLineAttemptCorrect).toBe(true);
    expect(loaded?.fix).toBe(state.fix);
  });

  it('clears stored session state when clearExerciseSession is called', () => {
    const state: ExerciseState = {
      ...initialExerciseState,
      currentStep: 2,
      mitigation: 'Valid mitigation text with >= 20 characters.',
      mitigationLocked: true,
    };

    saveExerciseSession(incidentId, state);
    expect(loadExerciseSession(incidentId)).not.toBeNull();

    clearExerciseSession(incidentId);
    expect(loadExerciseSession(incidentId)).toBeNull();
  });

  it('handles malformed JSON in sessionStorage gracefully without crashing', () => {
    mockStorage['trace_exercise_session_v1_duplicate-payment'] = '{ malformed json: not valid';
    const loaded = loadExerciseSession(incidentId);
    expect(loaded).toBeNull();
  });

  it('enforces step progression invariants: demotes Step 2 if mitigation is not locked', () => {
    const invalidStep2: Partial<ExerciseState> = {
      currentStep: 2,
      mitigation: 'Short',
      mitigationLocked: false,
    };

    const sanitized = sanitizeRestoredState(invalidStep2);
    expect(sanitized.currentStep).toBe(1);
    expect(sanitized.mitigationLocked).toBe(false);
  });

  it('enforces step progression invariants: demotes Step 3 if no line check was performed', () => {
    const invalidStep3: Partial<ExerciseState> = {
      currentStep: 3,
      mitigation: 'Valid mitigation text with sufficient length.',
      mitigationLocked: true,
      lineCheckAttempts: 0, // No check attempted!
    };

    const sanitized = sanitizeRestoredState(invalidStep3);
    expect(sanitized.currentStep).toBe(2);
  });

  it('enforces step progression invariants: demotes Step 4 if fix was not submitted', () => {
    const invalidStep4: Partial<ExerciseState> = {
      currentStep: 4,
      mitigation: 'Valid mitigation text with sufficient length.',
      mitigationLocked: true,
      lineCheckAttempts: 1,
      fix: 'Fix text that was never submitted',
      fixSubmitted: false, // Fix not submitted!
    };

    const sanitized = sanitizeRestoredState(invalidStep4);
    expect(sanitized.currentStep).toBe(3);
  });

  it('enforces step progression invariants: demotes Step 5 if approach was not confirmed', () => {
    const invalidStep5: Partial<ExerciseState> = {
      currentStep: 5,
      mitigation: 'Valid mitigation text with sufficient length.',
      mitigationLocked: true,
      lineCheckAttempts: 1,
      fix: 'Valid permanent fix text with >= 30 characters in length.',
      fixSubmitted: true,
      confirmedApproach: null, // No confirmed approach!
    };

    const sanitized = sanitizeRestoredState(invalidStep5);
    expect(sanitized.currentStep).toBe(4);
  });

  it('enforces step progression invariants: demotes review step if defense was not submitted', () => {
    const invalidReview: Partial<ExerciseState> = {
      currentStep: 'review',
      mitigation: 'Valid mitigation text with sufficient length.',
      mitigationLocked: true,
      lineCheckAttempts: 1,
      fix: 'Valid permanent fix text with >= 30 characters in length.',
      fixSubmitted: true,
      confirmedApproach: 'unique_constraint',
      defense: 'Too short',
      defenseSubmitted: false,
    };

    const sanitized = sanitizeRestoredState(invalidReview);
    expect(sanitized.currentStep).toBe(5);
  });
});
