import { LineCheckStatus } from './lineChecker';
import { ReviewResult } from './reviewEvaluator';

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 'review';

export interface ExerciseState {
  currentStep: StepNumber;

  mitigation: string;
  mitigationLocked: boolean;

  selectedLine: number | null;
  lineCheckResult: LineCheckStatus | null;
  lineCheckExplanation: string | null;
  firstLineAttemptCorrect: boolean | null;
  lineCheckAttempts: number;

  fix: string;
  fixSubmitted: boolean;

  classificationStatus: 'idle' | 'loading' | 'success' | 'error';
  classificationError: string | null;
  classifiedApproach: string | null;
  classificationReason: string | null;
  confirmedApproach: string | null;
  classificationSource: 'ai' | 'manual' | null;

  followUpQuestion: string | null;

  defense: string;
  defenseSubmitted: boolean;

  reviewStatus: 'idle' | 'loading' | 'success' | 'error';
  reviewResult: ReviewResult | null;
  reviewError: string | null;
  selectedRubricItem: string | null;

  isRecordedSession?: boolean;
  recordedFixtureName?: string;
}

export const initialExerciseState: ExerciseState = {
  currentStep: 1,

  mitigation: '',
  mitigationLocked: false,

  selectedLine: null,
  lineCheckResult: null,
  lineCheckExplanation: null,
  firstLineAttemptCorrect: null,
  lineCheckAttempts: 0,

  fix: '',
  fixSubmitted: false,

  classificationStatus: 'idle',
  classificationError: null,
  classifiedApproach: null,
  classificationReason: null,
  confirmedApproach: null,
  classificationSource: null,

  followUpQuestion: null,

  defense: '',
  defenseSubmitted: false,

  reviewStatus: 'idle',
  reviewResult: null,
  reviewError: null,
  selectedRubricItem: null,
};

export type ExerciseAction =
  | { type: 'UPDATE_MITIGATION'; payload: string }
  | { type: 'LOCK_MITIGATION' }
  | { type: 'SELECT_LINE'; payload: number | null }
  | {
      type: 'LINE_CHECK_COMPLETED';
      payload: { result: LineCheckStatus; explanation: string };
    }
  | { type: 'ADVANCE_TO_FIX' }
  | { type: 'UPDATE_FIX'; payload: string }
  | { type: 'SUBMIT_FIX' }
  | { type: 'START_CLASSIFICATION' }
  | {
      type: 'CLASSIFICATION_SUCCESS';
      payload: {
        approach: string;
        reason: string;
        followUpQuestion: string;
      };
    }
  | { type: 'CLASSIFICATION_FAILED'; payload: string }
  | { type: 'RETRY_CLASSIFICATION' }
  | { type: 'CLASSIFICATION_COMPLETED'; payload: string } // Backwards compatible alias
  | {
      type: 'CONFIRM_APPROACH';
      payload:
        | string
        | {
            approach: string;
            followUpQuestion: string;
            source: 'ai' | 'manual';
          };
    }
  | { type: 'UPDATE_DEFENSE'; payload: string }
  | { type: 'SUBMIT_DEFENSE' }
  | { type: 'START_REVIEW' }
  | { type: 'REVIEW_SUCCESS'; payload: ReviewResult }
  | { type: 'REVIEW_FAILED'; payload: string }
  | { type: 'RETRY_REVIEW' }
  | { type: 'SELECT_RUBRIC_ITEM'; payload: string | null }
  | { type: 'LOAD_SAVED_SESSION'; payload: ExerciseState }
  | { type: 'LOAD_RECORDED_SESSION'; payload: import('@/data/recorded/duplicate-payment').RecordedSession }
  | { type: 'RESET' };

export const MIN_MITIGATION_LENGTH = 20;
export const MIN_FIX_LENGTH = 30;
export const MIN_DEFENSE_LENGTH = 20;

export function exerciseReducer(
  state: ExerciseState,
  action: ExerciseAction
): ExerciseState {
  switch (action.type) {
    case 'UPDATE_MITIGATION': {
      if (state.mitigationLocked) return state;
      return {
        ...state,
        mitigation: action.payload,
      };
    }

    case 'LOCK_MITIGATION': {
      if (state.mitigation.trim().length < MIN_MITIGATION_LENGTH) {
        return state;
      }
      return {
        ...state,
        mitigationLocked: true,
        currentStep: 2,
      };
    }

    case 'SELECT_LINE': {
      return {
        ...state,
        selectedLine: action.payload,
      };
    }

    case 'LINE_CHECK_COMPLETED': {
      const isFirst = state.firstLineAttemptCorrect === null;
      const isCorrect = action.payload.result === 'correct';

      return {
        ...state,
        lineCheckResult: action.payload.result,
        lineCheckExplanation: action.payload.explanation,
        lineCheckAttempts: state.lineCheckAttempts + 1,
        // Crucial requirement: firstLineAttemptCorrect is preserved from the 1st check and never overwritten
        firstLineAttemptCorrect: isFirst ? isCorrect : state.firstLineAttemptCorrect,
      };
    }

    case 'ADVANCE_TO_FIX': {
      // Must have checked at least one line before advancing to Step 3
      if (state.lineCheckAttempts === 0) {
        return state;
      }
      return {
        ...state,
        currentStep: 3,
      };
    }

    case 'UPDATE_FIX': {
      if (state.fixSubmitted) return state;
      return {
        ...state,
        fix: action.payload,
      };
    }

    case 'SUBMIT_FIX': {
      if (state.fix.trim().length < MIN_FIX_LENGTH) {
        return state;
      }
      return {
        ...state,
        fixSubmitted: true,
        currentStep: 4,
        classificationStatus: 'idle',
      };
    }

    case 'START_CLASSIFICATION': {
      return {
        ...state,
        classificationStatus: 'loading',
        classificationError: null,
      };
    }

    case 'CLASSIFICATION_SUCCESS': {
      return {
        ...state,
        classificationStatus: 'success',
        classificationError: null,
        classifiedApproach: action.payload.approach,
        classificationReason: action.payload.reason,
        confirmedApproach: action.payload.approach,
        classificationSource: 'ai',
        followUpQuestion: action.payload.followUpQuestion,
      };
    }

    case 'CLASSIFICATION_FAILED': {
      return {
        ...state,
        classificationStatus: 'error',
        classificationError: action.payload,
      };
    }

    case 'RETRY_CLASSIFICATION': {
      return {
        ...state,
        classificationStatus: 'idle',
        classificationError: null,
      };
    }

    case 'CLASSIFICATION_COMPLETED': {
      return {
        ...state,
        classifiedApproach: action.payload,
        confirmedApproach: action.payload,
        classificationStatus: 'success',
        classificationSource: 'ai',
      };
    }

    case 'CONFIRM_APPROACH': {
      if (typeof action.payload === 'string') {
        return {
          ...state,
          confirmedApproach: action.payload,
          currentStep: 5,
        };
      }
      return {
        ...state,
        confirmedApproach: action.payload.approach,
        followUpQuestion: action.payload.followUpQuestion,
        classificationSource: action.payload.source,
        currentStep: 5,
      };
    }

    case 'UPDATE_DEFENSE': {
      if (state.defenseSubmitted) return state;
      return {
        ...state,
        defense: action.payload,
      };
    }

    case 'SUBMIT_DEFENSE': {
      if (state.defense.trim().length < MIN_DEFENSE_LENGTH) {
        return state;
      }
      return {
        ...state,
        defenseSubmitted: true,
        currentStep: 'review',
        reviewStatus: 'idle',
      };
    }

    case 'START_REVIEW': {
      return {
        ...state,
        reviewStatus: 'loading',
        reviewError: null,
      };
    }

    case 'REVIEW_SUCCESS': {
      return {
        ...state,
        reviewStatus: 'success',
        reviewResult: action.payload,
        reviewError: null,
      };
    }

    case 'REVIEW_FAILED': {
      return {
        ...state,
        reviewStatus: 'error',
        reviewError: action.payload,
      };
    }

    case 'RETRY_REVIEW': {
      return {
        ...state,
        reviewStatus: 'idle',
        reviewError: null,
      };
    }

    case 'SELECT_RUBRIC_ITEM': {
      return {
        ...state,
        selectedRubricItem: action.payload,
      };
    }

    case 'LOAD_SAVED_SESSION': {
      return {
        ...state,
        ...action.payload,
      };
    }

    case 'LOAD_RECORDED_SESSION': {
      const rec = action.payload;
      return {
        ...initialExerciseState,
        currentStep: 'review',
        mitigation: rec.learnerAnswers.mitigation,
        mitigationLocked: true,
        selectedLine: rec.learnerAnswers.selectedLine,
        lineCheckResult: 'correct',
        lineCheckExplanation:
          'Lines 9–10 introduce a classic check-then-act race condition. Concurrent webhook deliveries both execute SELECT 1, both observe zero rows, and both proceed to insert duplicate ledger entries and credit the customer twice.',
        firstLineAttemptCorrect: rec.learnerAnswers.firstLineAttemptCorrect,
        lineCheckAttempts: 1,
        fix: rec.learnerAnswers.fix,
        fixSubmitted: true,
        classificationStatus: 'success',
        classifiedApproach: rec.classification.approach,
        classificationReason: rec.classification.reason,
        confirmedApproach: rec.classification.approach,
        classificationSource: rec.classification.source,
        followUpQuestion: rec.followUp.question,
        defense: rec.learnerAnswers.defense,
        defenseSubmitted: true,
        reviewStatus: 'success',
        reviewResult: rec.reviewResult,
        isRecordedSession: true,
        recordedFixtureName: rec.fixtureName,
      };
    }

    case 'RESET': {
      return initialExerciseState;
    }

    default:
      return state;
  }
}
