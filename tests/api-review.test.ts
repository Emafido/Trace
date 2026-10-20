import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/review/route';
import * as llmModule from '@/lib/llm';

function createReviewRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('API Route: POST /api/review', () => {
  const validAnswers = {
    incidentId: 'duplicate-payment',
    mitigation: 'I would pause webhook processing and scale down consumer instances immediately.',
    fix: 'Add a UNIQUE constraint on ledger(reference) and perform ON CONFLICT DO NOTHING to make inserts atomic.',
    defense: 'A database constraint guarantees ACID compliance across all distributed nodes unlike in-memory locks.',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a successful structured review with 4 rubric items and reference solution', async () => {
    const mockLLMItems = [
      {
        id: 'r1',
        status: 'CAUGHT',
        quote: 'pause webhook processing and scale down',
        note: 'Identifies immediate containment action.',
      },
      {
        id: 'r2',
        status: 'PARTIAL',
        quote: 'make inserts atomic',
        note: 'Notes atomicity need but does not detail check-then-act race.',
      },
      {
        id: 'r3',
        status: 'CAUGHT',
        quote: 'UNIQUE constraint on ledger(reference)',
        note: 'Applies DB-level atomic unique constraint.',
      },
      {
        id: 'r4',
        status: 'MISSED',
        quote: null,
        note: 'No supporting evidence of ledger reconciliation.',
      },
    ];

    vi.spyOn(llmModule, 'callStructuredLLM').mockResolvedValueOnce({
      items: mockLLMItems,
    });

    const req = createReviewRequest(validAnswers);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.items).toHaveLength(4);
    expect(data.items[0]).toMatchObject({
      id: 'r1',
      status: 'CAUGHT',
      quote: 'pause webhook processing and scale down',
      verificationFailed: false,
    });
    expect(data.items[1]).toMatchObject({
      id: 'r2',
      status: 'PARTIAL',
      quote: 'make inserts atomic',
      verificationFailed: false,
    });
    expect(data.items[2]).toMatchObject({
      id: 'r3',
      status: 'CAUGHT',
      quote: 'UNIQUE constraint on ledger(reference)',
      verificationFailed: false,
    });
    expect(data.items[3]).toMatchObject({
      id: 'r4',
      status: 'MISSED',
      quote: null,
    });

    // Reference solution is attached server-side
    expect(data.referenceSolution).toBeDefined();
    expect(data.referenceSolution.rootCause).toContain('existence check');
    expect(data.referenceSolution.constraintSql).toContain('UNIQUE');
    expect(data.referenceSolution.dataRepairQuery).toContain('SELECT reference');
  });

  it('revokes credit when LLM returns a fabricated quote for CAUGHT', async () => {
    const mockLLMItems = [
      {
        id: 'r1',
        status: 'CAUGHT',
        quote: 'Completely fabricated quote that learner never wrote in mitigation',
        note: 'Containment assumed.',
      },
      { id: 'r2', status: 'MISSED', quote: null, note: 'Missed' },
      { id: 'r3', status: 'MISSED', quote: null, note: 'Missed' },
      { id: 'r4', status: 'MISSED', quote: null, note: 'Missed' },
    ];

    vi.spyOn(llmModule, 'callStructuredLLM').mockResolvedValueOnce({
      items: mockLLMItems,
    });

    const req = createReviewRequest(validAnswers);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    // r1 status must be downgraded to MISSED and quote set to null
    expect(data.items[0].id).toBe('r1');
    expect(data.items[0].status).toBe('MISSED');
    expect(data.items[0].quote).toBeNull();
    expect(data.items[0].note).toBe('No supporting quote found in your submitted answers.');
    expect(data.items[0].verificationFailed).toBe(true);
  });

  it('returns HTTP 404 for unknown incidentId', async () => {
    const req = createReviewRequest({
      ...validAnswers,
      incidentId: 'unknown-incident',
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("Incident 'unknown-incident' not found");
  });

  it('returns HTTP 400 for malformed payload (missing fields)', async () => {
    const req = createReviewRequest({
      incidentId: 'duplicate-payment',
      // missing mitigation, fix, defense
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Validation failed');
  });

  it('returns HTTP 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not valid json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON request body');
  });

  it('returns HTTP 503 when LLM API key is missing', async () => {
    vi.spyOn(llmModule, 'callStructuredLLM').mockRejectedValueOnce(
      new llmModule.LLMError(
        'LLM API key is not configured.',
        'LLM_CONFIG_MISSING',
        503
      )
    );

    const req = createReviewRequest(validAnswers);
    const res = await POST(req);

    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.code).toBe('LLM_CONFIG_MISSING');
  });

  it('returns HTTP 504 on LLM provider timeout', async () => {
    vi.spyOn(llmModule, 'callStructuredLLM').mockRejectedValueOnce(
      new llmModule.LLMError(
        'LLM provider request timed out after 20000ms',
        'LLM_TIMEOUT',
        504
      )
    );

    const req = createReviewRequest(validAnswers);
    const res = await POST(req);

    expect(res.status).toBe(504);
    const data = await res.json();
    expect(data.code).toBe('LLM_TIMEOUT');
  });

  it('returns HTTP 502 on invalid or malformed LLM output', async () => {
    vi.spyOn(llmModule, 'callStructuredLLM').mockRejectedValueOnce(
      new llmModule.LLMError(
        'LLM response failed schema validation',
        'LLM_INVALID_RESPONSE',
        502
      )
    );

    const req = createReviewRequest(validAnswers);
    const res = await POST(req);

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.code).toBe('LLM_INVALID_RESPONSE');
  });
});
