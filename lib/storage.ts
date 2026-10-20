import { ExerciseState, initialExerciseState } from './exerciseReducer';
import { approachCategories, ApproachCategory } from './fixClassifier';

const STORAGE_KEY_PREFIX = 'trace_exercise_session_v1_';

/**
 * Validates step progression invariants to prevent corrupted or tampered
 * session state from bypassing required investigation gates.
 */
export function sanitizeRestoredState(raw: Partial<ExerciseState>): ExerciseState {
  // Start with clean initial state
  const state: ExerciseState = {
    ...initialExerciseState,
    ...raw,
  };

  // Step 1 Invariant
  if (state.mitigationLocked && state.mitigation.trim().length < 20) {
    state.mitigationLocked = false;
  }

  const stepRank = state.currentStep === 'review' ? 6 : state.currentStep;

  // Step 2 Invariant
  if (stepRank >= 2) {
    if (!state.mitigationLocked) {
      state.currentStep = 1;
    }
  }

  // Step 3 Invariant
  if (stepRank >= 3) {
    if (state.lineCheckAttempts < 1) {
      state.currentStep = 2;
    }
  }

  // Step 4 Invariant
  if (stepRank >= 4) {
    if (!state.fixSubmitted || state.fix.trim().length < 30) {
      state.fixSubmitted = false;
      state.currentStep = 3;
    }
  }

  // Step 5 Invariant
  if (stepRank >= 5) {
    if (!state.confirmedApproach || !approachCategories.includes(state.confirmedApproach as ApproachCategory)) {
      state.currentStep = 4;
    }
  }

  // Review Step Invariant
  if (state.currentStep === 'review') {
    if (!state.defenseSubmitted || state.defense.trim().length < 20) {
      state.defenseSubmitted = false;
      state.currentStep = 5;
    }
  }

  return state;
}

/**
 * Serializes and saves current exercise state to sessionStorage.
 * Pure client-side operation. Does NOT store credentials or answer keys.
 */
export function saveExerciseSession(incidentId: string, state: ExerciseState): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false;
  }

  try {
    const key = `${STORAGE_KEY_PREFIX}${incidentId}`;
    const payload = JSON.stringify({
      currentStep: state.currentStep,
      mitigation: state.mitigation,
      mitigationLocked: state.mitigationLocked,
      selectedLine: state.selectedLine,
      lineCheckResult: state.lineCheckResult,
      lineCheckExplanation: state.lineCheckExplanation,
      firstLineAttemptCorrect: state.firstLineAttemptCorrect,
      lineCheckAttempts: state.lineCheckAttempts,
      fix: state.fix,
      fixSubmitted: state.fixSubmitted,
      classificationStatus: state.classificationStatus,
      classifiedApproach: state.classifiedApproach,
      classificationReason: state.classificationReason,
      confirmedApproach: state.confirmedApproach,
      classificationSource: state.classificationSource,
      followUpQuestion: state.followUpQuestion,
      defense: state.defense,
      defenseSubmitted: state.defenseSubmitted,
      reviewStatus: state.reviewStatus,
      reviewResult: state.reviewResult,
      selectedRubricItem: state.selectedRubricItem,
      isRecordedSession: state.isRecordedSession ?? false,
    });

    window.sessionStorage.setItem(key, payload);
    return true;
  } catch {
    // Gracefully handle storage quota exceeded or disabled storage
    return false;
  }
}

/**
 * Loads and restores exercise state from sessionStorage.
 * Validates progression constraints and gracefully handles malformed data.
 */
export function loadExerciseSession(incidentId: string): ExerciseState | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  try {
    const key = `${STORAGE_KEY_PREFIX}${incidentId}`;
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return sanitizeRestoredState(parsed);
  } catch {
    return null;
  }
}

/**
 * Completely clears stored session state for an incident (e.g. on Try Again reset).
 */
export function clearExerciseSession(incidentId: string): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false;
  }

  try {
    const key = `${STORAGE_KEY_PREFIX}${incidentId}`;
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
