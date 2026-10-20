import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/check-line/route';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/check-line', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('API Route: /api/check-line', () => {
  it('returns correct for line 9 with authoritative explanation', async () => {
    const req = createRequest({
      incidentId: 'duplicate-payment',
      selectedLine: 9,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('correct');
    expect(data.explanation).toContain('check-then-act');
  });

  it('returns correct for line 10', async () => {
    const req = createRequest({
      incidentId: 'duplicate-payment',
      selectedLine: 10,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('correct');
  });

  it('returns partial for line 11', async () => {
    const req = createRequest({
      incidentId: 'duplicate-payment',
      selectedLine: 11,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('partial');
    expect(data.explanation).toContain('Partial match');
  });

  it('returns incorrect for line 5', async () => {
    const req = createRequest({
      incidentId: 'duplicate-payment',
      selectedLine: 5,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('incorrect');
  });

  it('rejects invalid line numbers at the API boundary with HTTP 400', async () => {
    // Negative line number
    const reqNeg = createRequest({
      incidentId: 'duplicate-payment',
      selectedLine: -1,
    });
    const resNeg = await POST(reqNeg);
    expect(resNeg.status).toBe(400);

    // Zero line number
    const reqZero = createRequest({
      incidentId: 'duplicate-payment',
      selectedLine: 0,
    });
    const resZero = await POST(reqZero);
    expect(resZero.status).toBe(400);

    // Out of bounds line number (> diff lines)
    const reqOob = createRequest({
      incidentId: 'duplicate-payment',
      selectedLine: 999,
    });
    const resOob = await POST(reqOob);
    expect(resOob.status).toBe(400);
    const dataOob = await resOob.json();
    expect(dataOob.error).toContain('out of bounds');
  });

  it('rejects unknown incident ID with HTTP 404', async () => {
    const req = createRequest({
      incidentId: 'non-existent-incident',
      selectedLine: 9,
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('not found');
  });

  it('rejects malformed or non-JSON payloads with HTTP 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/check-line', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not a json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
