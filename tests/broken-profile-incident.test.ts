import { describe, it, expect } from 'bun:test';
import { getAllPublicIncidents, getPublicIncident } from '@/data/incidents';
import { getServerIncident } from '@/data/server/incidentRepository';
import { checkLine } from '@/lib/lineChecker';
import { POST as checkLinePost } from '@/app/api/check-line/route';
import { POST as classifyPost } from '@/app/api/classify/route';
import { NextRequest } from 'next/server';
import { recordedBrokenProfileSession } from '@/data/recorded/broken-profile-api';
import { verifyQuote } from '@/lib/verify';

function createRequest(body: unknown, url = 'http://localhost/api'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Priority 1 & 2: Broken Profile API Incident (broken-profile-api)', () => {
  describe('Library Ordering & Metadata', () => {
    it('places broken-profile-api as the FIRST incident in the library', () => {
      const incidents = getAllPublicIncidents();
      expect(incidents.length).toBe(2);
      expect(incidents[0].id).toBe('broken-profile-api');
      expect(incidents[0].title).toBe('The Profile Page That Stopped Working');
      expect(incidents[0].role).toBe('Full-stack');
      expect(incidents[0].type).toBe('Debugging');
      expect(incidents[0].estimatedMinutes).toBe(7);

      expect(incidents[1].id).toBe('duplicate-payment');
      expect(incidents[1].title).toBe('Duplicate Payment Incident');
    });

    it('returns the public incident via getPublicIncident', () => {
      const incident = getPublicIncident('broken-profile-api');
      expect(incident).not.toBeNull();
      expect(incident?.id).toBe('broken-profile-api');
      expect(incident?.diffLines.length).toBe(15);
      expect(incident?.approachCategories?.length).toBe(6);
    });

    it('has exactly the 15 structured code diff lines specified in the contract', () => {
      const incident = getPublicIncident('broken-profile-api')!;
      expect(incident.diffLines.length).toBe(15);

      // Line 7 is del: - router.get("/api/profile", authenticate, getProfile);
      expect(incident.diffLines[6].lineNum).toBe(7);
      expect(incident.diffLines[6].type).toBe('del');
      expect(incident.diffLines[6].text).toContain('/api/profile');

      // Line 8 is add: + router.get("/api/users/me", authenticate, getProfile);
      expect(incident.diffLines[7].lineNum).toBe(8);
      expect(incident.diffLines[7].type).toBe('add');
      expect(incident.diffLines[7].text).toContain('/api/users/me');

      // Line 12 is context calling /api/profile
      expect(incident.diffLines[11].lineNum).toBe(12);
      expect(incident.diffLines[11].type).toBe('ctx');
      expect(incident.diffLines[11].text).toContain('fetch("/api/profile")');
    });
  });

  describe('Deterministic Fault Line Verification', () => {
    const serverIncident = getServerIncident('broken-profile-api')!;

    it('identifies line 8 as the breaking change (correct)', () => {
      const result = checkLine(8, serverIncident.faultyLines, serverIncident.partialLines);
      expect(result).toBe('correct');
    });

    it('identifies line 12 as a partial selection (unchanged frontend client)', () => {
      const result = checkLine(12, serverIncident.faultyLines, serverIncident.partialLines);
      expect(result).toBe('partial');
    });

    it('identifies other lines as incorrect', () => {
      for (const line of [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 13, 14, 15]) {
        const result = checkLine(line, serverIncident.faultyLines, serverIncident.partialLines);
        expect(result).toBe('incorrect');
      }
    });

    it('provides clear explanation for line 8 and line 12', () => {
      expect(serverIncident.lineExplanations.correct).toContain('Line 8 replaces');
      expect(serverIncident.lineExplanations.partial).toContain('Line 12');
      expect(serverIncident.lineExplanations.incorrect).toContain('not the source');
    });
  });

  describe('API Route: /api/check-line for broken-profile-api', () => {
    it('returns correct status for line 8 via HTTP API', async () => {
      const req = createRequest({
        incidentId: 'broken-profile-api',
        selectedLine: 8,
      });

      const res = await checkLinePost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('correct');
      expect(data.explanation).toContain('Line 8 replaces');
    });

    it('returns partial status for line 12 via HTTP API', async () => {
      const req = createRequest({
        incidentId: 'broken-profile-api',
        selectedLine: 12,
      });

      const res = await checkLinePost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('partial');
    });

    it('rejects line numbers greater than 15 with HTTP 400', async () => {
      const req = createRequest({
        incidentId: 'broken-profile-api',
        selectedLine: 16,
      });

      const res = await checkLinePost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('out of bounds');
    });
  });

  describe('Incident-Specific Classification & Follow-ups', () => {
    it('has all 6 incident-specific branches in followUpBranches', () => {
      const serverIncident = getServerIncident('broken-profile-api')!;
      const expectedBranches = [
        'dual_route',
        'restore_old_route',
        'client_update',
        'redirect',
        'other',
        'unclear',
      ];

      for (const branch of expectedBranches) {
        expect(serverIncident.followUpBranches[branch]).toBeDefined();
        expect(serverIncident.followUpBranches[branch].question.length).toBeGreaterThan(15);
      }
    });

    it('returns exact curated follow-up questions for confirm action via /api/classify', async () => {
      const testCases = [
        {
          approach: 'dual_route',
          expectedSubstring: 'safe to remove the old route',
        },
        {
          approach: 'restore_old_route',
          expectedSubstring: 'introduce the new endpoint later',
        },
        {
          approach: 'client_update',
          expectedSubstring: 'older JavaScript bundle cached',
        },
        {
          approach: 'redirect',
          expectedSubstring: 'compatibility or caching issues',
        },
        {
          approach: 'other',
          expectedSubstring: 'older frontend calls /api/profile',
        },
        {
          approach: 'unclear',
          expectedSubstring: 'older frontend calls /api/profile',
        },
      ];

      for (const tc of testCases) {
        const req = createRequest({
          action: 'confirm',
          incidentId: 'broken-profile-api',
          confirmedApproach: tc.approach,
        });

        const res = await classifyPost(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.confirmedApproach).toBe(tc.approach);
        expect(data.followUpQuestion).toContain(tc.expectedSubstring);
      }
    });
  });

  describe('Server Incident Rubric & Reference Solution', () => {
    it('defines the 4 required rubric criteria (r1: Mitigation, r2: Root cause, r3: Permanent fix, r4: Regression prevention)', () => {
      const serverIncident = getServerIncident('broken-profile-api')!;
      expect(serverIncident.rubric.length).toBe(4);

      const [r1, r2, r3, r4] = serverIncident.rubric;
      expect(r1.id).toBe('r1');
      expect(r1.title).toBe('Immediate Mitigation');

      expect(r2.id).toBe('r2');
      expect(r2.title).toBe('Root Cause');

      expect(r3.id).toBe('r3');
      expect(r3.title).toBe('Permanent Fix');

      expect(r4.id).toBe('r4');
      expect(r4.title).toBe('Regression Prevention');
    });

    it('does NOT contain duplicate-payment concepts in broken-profile-api reference solution', () => {
      const serverIncident = getServerIncident('broken-profile-api')!;
      expect(serverIncident.referenceSolution.constraintSql).toBeUndefined();
      expect(serverIncident.referenceSolution.dataRepairQuery).toBeUndefined();
      expect(serverIncident.referenceSolution.codeSnippet).toBeDefined();
      expect(serverIncident.referenceSolution.prevention).toBeDefined();
      expect(serverIncident.referenceSolution.keyTakeaway).toBeDefined();
    });
  });

  describe('Illustrative Sample Walkthrough Verification', () => {
    it('verifies all quotations in recordedBrokenProfileSession against learner text', () => {
      const session = recordedBrokenProfileSession;
      expect(session.incidentId).toBe('broken-profile-api');
      expect(session.isRecorded).toBe(true);
      expect(session.isAIEvaluationRun).toBe(false);

      const allLearnerText = [
        session.learnerAnswers.mitigation,
        session.learnerAnswers.fix,
        session.learnerAnswers.defense,
      ];

      for (const item of session.reviewResult.items) {
        expect(item.quote).not.toBeNull();
        const verified = verifyQuote(allLearnerText, item.quote!);
        expect(verified).toBe(true);
      }
    });
  });
});
