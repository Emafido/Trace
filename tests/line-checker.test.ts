import { describe, it, expect } from 'vitest';
import { checkLine } from '@/lib/lineChecker';
import { serverDuplicatePaymentIncident } from '@/data/server/incidents/duplicate-payment';

describe('Deterministic Line Checker (checkLine)', () => {
  const { faultyLines, partialLines } = serverDuplicatePaymentIncident;

  it('identifies Line 9 as correct', () => {
    const result = checkLine(9, faultyLines, partialLines);
    expect(result).toBe('correct');
  });

  it('identifies Line 10 as correct', () => {
    const result = checkLine(10, faultyLines, partialLines);
    expect(result).toBe('correct');
  });

  it('identifies Line 11 as partial', () => {
    const result = checkLine(11, faultyLines, partialLines);
    expect(result).toBe('partial');
  });

  it('identifies Line 5 as incorrect', () => {
    const result = checkLine(5, faultyLines, partialLines);
    expect(result).toBe('incorrect');
  });

  it('identifies Line 1, 2, 3 as incorrect', () => {
    expect(checkLine(1, faultyLines, partialLines)).toBe('incorrect');
    expect(checkLine(2, faultyLines, partialLines)).toBe('incorrect');
    expect(checkLine(3, faultyLines, partialLines)).toBe('incorrect');
  });

  it('identifies lines outside diff as incorrect', () => {
    expect(checkLine(99, faultyLines, partialLines)).toBe('incorrect');
    expect(checkLine(0, faultyLines, partialLines)).toBe('incorrect');
  });
});
