import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/classify/route';
import * as classifierModule from '@/lib/fixClassifier';
import * as llmModule from '@/lib/llm';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('API Route: POST /api/classify', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Action: confirm (Zero LLM calls)', () => {
    it('returns the exact prewritten follow-up question for unique_constraint', async () => {
      const req = createRequest({
        action: 'confirm',
        incidentId: 'duplicate-payment',
        confirmedApproach: 'unique_constraint',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.confirmedApproach).toBe('unique_constraint');
      expect(data.followUpQuestion).toBe(
        'A duplicate delivery now hits the constraint. What response should the endpoint return to the provider, and what should you log?'
      );
    });

    it('returns the exact prewritten follow-up question for row_lock', async () => {
      const req = createRequest({
        action: 'confirm',
        incidentId: 'duplicate-payment',
        confirmedApproach: 'row_lock',
      });

      const res = await POST(req);
      const data = await res.json();
      expect(data.followUpQuestion).toBe(
        'If the notification call runs inside your locked transaction and the notification service slows to 8 seconds, what happens to your connection pool?'
      );
    });

    it('returns the exact prewritten follow-up question for redis_lock', async () => {
      const req = createRequest({
        action: 'confirm',
        incidentId: 'duplicate-payment',
        confirmedApproach: 'redis_lock',
      });

      const res = await POST(req);
      const data = await res.json();
      expect(data.followUpQuestion).toBe(
        'Your lock has a 5-second TTL. If a worker stalls for 6 seconds mid-handler, what stops the second delivery from also crediting the account?'
      );
    });

    it('returns the exact prewritten follow-up question for app_cache', async () => {
      const req = createRequest({
        action: 'confirm',
        incidentId: 'duplicate-payment',
        confirmedApproach: 'app_cache',
      });

      const res = await POST(req);
      const data = await res.json();
      expect(data.followUpQuestion).toBe(
        'You now run 3 instances, each with its own memory. How does instance 2 know instance 3 already handled this reference?'
      );
    });

    it('returns the exact prewritten follow-up question for other and unclear', async () => {
      for (const cat of ['other', 'unclear']) {
        const req = createRequest({
          action: 'confirm',
          incidentId: 'duplicate-payment',
          confirmedApproach: cat,
        });

        const res = await POST(req);
        const data = await res.json();
        expect(data.followUpQuestion).toBe(
          'Walk through, step by step, what happens when two deliveries of the same event arrive 4 ms apart under your fix.'
        );
      }
    });

    it('rejects unsupported confirmed approach categories with HTTP 400', async () => {
      const req = createRequest({
        action: 'confirm',
        incidentId: 'duplicate-payment',
        confirmedApproach: 'unsupported_magic_lock',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Validation failed');
    });
  });

  describe('Action: classify', () => {
    it('successfully classifies a fix and attaches the matching curated follow-up', async () => {
      vi.spyOn(classifierModule, 'classifyLearnerFix').mockResolvedValue({
        approach: 'unique_constraint',
        reason: 'Enforces database uniqueness.',
      });

      const req = createRequest({
        action: 'classify',
        incidentId: 'duplicate-payment',
        mitigation: 'Roll back PR #412',
        fix: 'Add unique constraint on ledger(reference)',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.approach).toBe('unique_constraint');
      expect(data.reason).toBe('Enforces database uniqueness.');
      expect(data.followUpQuestion).toContain('A duplicate delivery now hits the constraint');
    });

    it('returns HTTP 503 when LLM API key is not configured', async () => {
      vi.spyOn(classifierModule, 'classifyLearnerFix').mockRejectedValue(
        new llmModule.LLMConfigError('LLM API key is not configured on the server.')
      );

      const req = createRequest({
        action: 'classify',
        incidentId: 'duplicate-payment',
        mitigation: 'Roll back PR #412',
        fix: 'Add unique constraint on ledger(reference)',
      });

      const res = await POST(req);
      expect(res.status).toBe(503);

      const data = await res.json();
      expect(data.code).toBe('CONFIG_ERROR');
    });

    it('returns HTTP 504 on LLM timeout', async () => {
      vi.spyOn(classifierModule, 'classifyLearnerFix').mockRejectedValue(
        new llmModule.LLMTimeoutError('LLM request timed out after 20 seconds.')
      );

      const req = createRequest({
        action: 'classify',
        incidentId: 'duplicate-payment',
        mitigation: 'Roll back PR #412',
        fix: 'Add unique constraint on ledger(reference)',
      });

      const res = await POST(req);
      expect(res.status).toBe(504);

      const data = await res.json();
      expect(data.code).toBe('TIMEOUT_ERROR');
    });

    it('returns HTTP 404 for unknown incident ID', async () => {
      const req = createRequest({
        action: 'classify',
        incidentId: 'non-existent-incident',
        mitigation: 'Roll back',
        fix: 'Fix the problem',
      });

      const res = await POST(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('not found');
    });

    it('returns HTTP 400 for malformed JSON body', async () => {
      const req = new NextRequest('http://localhost:3000/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid JSON');
    });
  });
});
