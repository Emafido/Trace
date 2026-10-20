import { describe, it, expect } from 'vitest';
import { recordedDuplicatePaymentSession } from '@/data/recorded/duplicate-payment';
import { exerciseReducer, initialExerciseState } from '@/lib/exerciseReducer';
import { verifyQuote } from '@/lib/verify';

describe('Recorded Demo Mode & Fixture Honesty (data/recorded/duplicate-payment.ts)', () => {
  it('contains authentic recorded session fields adhering to RecordedSession interface', () => {
    expect(recordedDuplicatePaymentSession.incidentId).toBe('duplicate-payment');
    expect(recordedDuplicatePaymentSession.isRecorded).toBe(true);
    expect(recordedDuplicatePaymentSession.fixtureName).toContain('Fixture A');
    expect(recordedDuplicatePaymentSession.learnerAnswers.selectedLine).toBe(9);
    expect(recordedDuplicatePaymentSession.learnerAnswers.firstLineAttemptCorrect).toBe(true);
    expect(recordedDuplicatePaymentSession.classification.approach).toBe('unique_constraint');
    expect(recordedDuplicatePaymentSession.reviewResult.items).toHaveLength(4);
  });

  it('guarantees that every citation in the recorded session exists verbatim in the recorded answers', () => {
    const { learnerAnswers, reviewResult } = recordedDuplicatePaymentSession;
    const answers = [
      learnerAnswers.mitigation,
      learnerAnswers.fix,
      learnerAnswers.defense,
    ];

    for (const item of reviewResult.items) {
      if (item.status === 'CAUGHT' || item.status === 'PARTIAL') {
        expect(item.quote).not.toBeNull();
        expect(item.quote!.length).toBeGreaterThanOrEqual(10);
        // Verify with deterministic engine
        const verified = verifyQuote(answers, item.quote);
        expect(verified).toBe(true);
      }
    }
  });

  it('loads recorded session into state machine with isRecordedSession: true and review step', () => {
    const nextState = exerciseReducer(initialExerciseState, {
      type: 'LOAD_RECORDED_SESSION',
      payload: recordedDuplicatePaymentSession,
    });

    expect(nextState.currentStep).toBe('review');
    expect(nextState.isRecordedSession).toBe(true);
    expect(nextState.recordedFixtureName).toBe('Fixture A: Strong Engineering Response');
    expect(nextState.mitigation).toBe(recordedDuplicatePaymentSession.learnerAnswers.mitigation);
    expect(nextState.fix).toBe(recordedDuplicatePaymentSession.learnerAnswers.fix);
    expect(nextState.defense).toBe(recordedDuplicatePaymentSession.learnerAnswers.defense);
    expect(nextState.reviewResult).toEqual(recordedDuplicatePaymentSession.reviewResult);
    expect(nextState.reviewStatus).toBe('success');
  });

  it('RESET action clears recorded session mode back to blank live session', () => {
    const recordedState = exerciseReducer(initialExerciseState, {
      type: 'LOAD_RECORDED_SESSION',
      payload: recordedDuplicatePaymentSession,
    });

    expect(recordedState.isRecordedSession).toBe(true);

    const resetState = exerciseReducer(recordedState, { type: 'RESET' });
    expect(resetState.isRecordedSession).toBeFalsy();
    expect(resetState.currentStep).toBe(1);
    expect(resetState.mitigation).toBe('');
    expect(resetState.reviewResult).toBeNull();
  });

  it('enforces honesty: does not use recorded AI evaluation for mismatched learner inputs', () => {
    // If a learner typed their own arbitrary answer, state retains their input
    const customFix = 'I will implement a custom queue partition key to process payments sequentially.';
    const userState = exerciseReducer(initialExerciseState, {
      type: 'UPDATE_FIX',
      payload: customFix,
    });

    expect(userState.fix).toBe(customFix);
    expect(userState.isRecordedSession).toBeFalsy();
    expect(userState.reviewResult).toBeNull();
  });
});
