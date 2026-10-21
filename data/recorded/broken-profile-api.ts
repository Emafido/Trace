import { ReviewResult } from '@/lib/reviewEvaluator';
import { serverBrokenProfileIncident } from '@/data/server/incidents/broken-profile-api';

export const recordedBrokenProfileSession = {
  incidentId: 'broken-profile-api',
  recordedAt: '2026-10-21T08:00:00Z',
  fixtureName: 'Fixture A: Strong Engineering Response (Illustrative Sample)',
  isRecorded: true as const,
  isAIEvaluationRun: false as const,
  disclaimer: 'Illustrative sample walkthrough — AI evaluation not run',
  learnerAnswers: {
    mitigation:
      'I would roll back deployment PR #248 or restore the /api/profile endpoint alias immediately to restore user profile access while preparing a backward-compatible migration.',
    selectedLine: 8,
    firstLineAttemptCorrect: true,
    fix:
      'The backend renamed /api/profile to /api/users/me without updating the frontend or maintaining backward compatibility for clients still requesting /api/profile. I would support both endpoints simultaneously using the same getProfile handler: router.get("/api/profile", authenticate, getProfile); router.get("/api/users/me", authenticate, getProfile); and only decommission the old route after updating clients and confirming old traffic has dropped to zero.',
    defense:
      'Existing web users and clients with cached frontend JavaScript will continue requesting /api/profile. Supporting both routes side-by-side guarantees zero downtime for cached clients while newer clients adopt /api/users/me.',
  },
  classification: {
    approach: 'dual_route',
    reason: 'Proposes maintaining both endpoints simultaneously via the same handler to preserve backward compatibility.',
    source: 'ai' as const,
  },
  followUp: {
    question:
      "You keep both /api/profile and /api/users/me working. How would you know when it's safe to remove the old route?",
  },
  reviewResult: {
    items: [
      {
        id: 'r1' as const,
        title: 'Immediate Mitigation',
        status: 'CAUGHT' as const,
        quote: 'roll back deployment PR #248 or restore the /api/profile endpoint alias',
        note: 'Proposes immediate rollback or route restoration to contain outage.',
        verificationFailed: false,
      },
      {
        id: 'r2' as const,
        title: 'Root Cause',
        status: 'CAUGHT' as const,
        quote: 'The backend renamed /api/profile to /api/users/me without updating the frontend or maintaining backward compatibility',
        note: 'Correctly identifies broken contract between backend route rename and unchanged frontend client.',
        verificationFailed: false,
      },
      {
        id: 'r3' as const,
        title: 'Permanent Fix',
        status: 'CAUGHT' as const,
        quote: 'support both endpoints simultaneously using the same getProfile handler',
        note: 'Proposes dual-route backward-compatible migration.',
        verificationFailed: false,
      },
      {
        id: 'r4' as const,
        title: 'Regression Prevention',
        status: 'CAUGHT' as const,
        quote: 'decommission the old route after updating clients and confirming old traffic has dropped to zero',
        note: 'Describes staged deprecation and telemetry monitoring before removing old contract.',
        verificationFailed: false,
      },
    ],
    referenceSolution: serverBrokenProfileIncident.referenceSolution,
  },
};
