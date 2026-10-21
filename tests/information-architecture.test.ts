import { describe, it, expect, beforeEach } from 'bun:test';
import { getAllPublicIncidents, getPublicIncident } from '@/data/incidents';
import {
  saveExerciseSession,
  clearExerciseSession,
  getIncidentSessionInfo,
} from '@/lib/storage';
import { initialExerciseState, ExerciseState } from '@/lib/exerciseReducer';

// In-memory mock for sessionStorage in test environment
class MockSessionStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe('Information Architecture & Practice Hub Verification', () => {
  beforeEach(() => {
    // Inject mock sessionStorage into global window
    (globalThis as unknown as { window: { sessionStorage: MockSessionStorage } }).window = {
      sessionStorage: new MockSessionStorage(),
    };
  });

  describe('Practice Hub Metadata & Incident Ordering', () => {
    it('returns both incidents with broken-profile-api recommended as first entry', () => {
      const incidents = getAllPublicIncidents();
      expect(incidents.length).toBe(2);

      const [first, second] = incidents;
      expect(first.id).toBe('broken-profile-api');
      expect(first.isRecommended).toBe(true);
      expect(first.difficulty).toBe('Beginner');
      expect(first.skills).toContain('API Design');
      expect(first.skills).toContain('Backward Compatibility');

      expect(second.id).toBe('duplicate-payment');
      expect(second.isRecommended).toBe(false);
      expect(second.difficulty).toBe('Intermediate');
      expect(second.skills).toContain('Distributed Systems');
      expect(second.skills).toContain('Concurrency & Locks');
    });

    it('provides valid direct lookups for each challenge', () => {
      expect(getPublicIncident('broken-profile-api')).not.toBeNull();
      expect(getPublicIncident('duplicate-payment')).not.toBeNull();
      expect(getPublicIncident('unknown-incident')).toBeNull();
    });
  });

  describe('Session Continuity & Resume Affordance (getIncidentSessionInfo)', () => {
    it('returns null when no session has been recorded for the incident', () => {
      const info = getIncidentSessionInfo('broken-profile-api');
      expect(info).toBeNull();
    });

    it('returns null when session exists but has zero user progress', () => {
      saveExerciseSession('broken-profile-api', initialExerciseState);
      const info = getIncidentSessionInfo('broken-profile-api');
      expect(info).toBeNull();
    });

    it('detects active in-progress state at Step 2 after mitigation is locked', () => {
      const state: ExerciseState = {
        ...initialExerciseState,
        currentStep: 2,
        mitigation: 'Roll back PR #248 immediately to restore the old route.',
        mitigationLocked: true,
      };

      saveExerciseSession('broken-profile-api', state);
      const info = getIncidentSessionInfo('broken-profile-api');

      expect(info).not.toBeNull();
      expect(info?.inProgress).toBe(true);
      expect(info?.stepLabel).toBe('Step 2: Line Check');
      expect(info?.stepNumber).toBe(2);
      expect(info?.isCompleted).toBe(false);
    });

    it('detects active in-progress state at Step 3 after line check', () => {
      const state: ExerciseState = {
        ...initialExerciseState,
        currentStep: 3,
        mitigation: 'Roll back PR #248 immediately to restore the old route.',
        mitigationLocked: true,
        selectedLine: 8,
        lineCheckResult: 'correct',
        lineCheckAttempts: 1,
      };

      saveExerciseSession('broken-profile-api', state);
      const info = getIncidentSessionInfo('broken-profile-api');

      expect(info).not.toBeNull();
      expect(info?.inProgress).toBe(true);
      expect(info?.stepLabel).toBe('Step 3: Fix');
      expect(info?.stepNumber).toBe(3);
      expect(info?.isCompleted).toBe(false);
    });

    it('detects completed investigation state at review screen', () => {
      const state: ExerciseState = {
        ...initialExerciseState,
        currentStep: 'review',
        mitigation: 'Roll back PR #248 immediately to restore the old route.',
        mitigationLocked: true,
        selectedLine: 8,
        lineCheckResult: 'correct',
        lineCheckAttempts: 1,
        fix: 'Support both routes concurrently using dual router.get registrations.',
        fixSubmitted: true,
        confirmedApproach: 'dual_route',
        defense: 'Dual routing avoids breaking older mobile builds.',
        defenseSubmitted: true,
        reviewStatus: 'success',
        reviewResult: {
          items: [
            { id: 'r1', status: 'CAUGHT', quote: 'Roll back PR #248', note: 'Accurate rollback' },
            { id: 'r2', status: 'CAUGHT', quote: 'Support both routes', note: 'Root cause understood' },
            { id: 'r3', status: 'CAUGHT', quote: 'dual router.get', note: 'Proper dual route fix' },
            { id: 'r4', status: 'CAUGHT', quote: 'older mobile builds', note: 'Contract testing prevention' },
          ],
        },
      };

      saveExerciseSession('broken-profile-api', state);
      const info = getIncidentSessionInfo('broken-profile-api');

      expect(info).not.toBeNull();
      expect(info?.inProgress).toBe(true);
      expect(info?.stepLabel).toBe('Review');
      expect(info?.isCompleted).toBe(true);
    });

    it('clears session information cleanly when reset is requested', () => {
      const state: ExerciseState = {
        ...initialExerciseState,
        currentStep: 2,
        mitigation: 'Roll back PR #248 immediately to restore the old route.',
        mitigationLocked: true,
      };

      saveExerciseSession('broken-profile-api', state);
      expect(getIncidentSessionInfo('broken-profile-api')).not.toBeNull();

      clearExerciseSession('broken-profile-api');
      expect(getIncidentSessionInfo('broken-profile-api')).toBeNull();
    });
  });
});
