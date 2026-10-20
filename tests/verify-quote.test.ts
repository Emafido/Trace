import { describe, it, expect } from 'vitest';
import {
  normalize,
  verifyQuote,
  findQuoteRange,
  findQuoteInLearnerAnswers,
  MIN_QUOTE_LENGTH,
} from '@/lib/verify';

describe('Deterministic Quote Verification (lib/verify.ts)', () => {
  const sampleMitigation = 'I would pause webhook processing and scale down consumer instances immediately.';
  const sampleFix = 'Add a UNIQUE constraint on ledger(reference) and execute ON CONFLICT DO NOTHING in PostgreSQL.';
  const sampleDefense = 'While an in-memory Redis lock is fast, it fails during cluster failover; DB constraints guarantee atomicity.';
  const answers = [sampleMitigation, sampleFix, sampleDefense];

  describe('normalize()', () => {
    it('converts text to lowercase', () => {
      expect(normalize('PAUSE WEBHOOK PROCESSING')).toBe('pause webhook processing');
    });

    it('normalizes smart quotation marks and curly backticks', () => {
      const smartQuotes = '“pause” and ‘scale down’ and `cluster failover`';
      expect(normalize(smartQuotes)).toBe('"pause" and \'scale down\' and \'cluster failover\'');
    });

    it('collapses repeated whitespace, newlines, and tabs into a single space', () => {
      const spaced = 'pause   \n\t  webhook \r\n   processing  ';
      expect(normalize(spaced)).toBe('pause webhook processing');
    });

    it('trims surrounding whitespace', () => {
      expect(normalize('   pause webhook   ')).toBe('pause webhook');
    });

    it('handles empty or null string gracefully', () => {
      expect(normalize('')).toBe('');
    });
  });

  describe('verifyQuote()', () => {
    it('verifies an exact quotation from submitted answers', () => {
      const quote = 'pause webhook processing and scale down';
      expect(verifyQuote(answers, quote)).toBe(true);
    });

    it('verifies a quotation with different capitalization', () => {
      const quote = 'PAUSE WEBHOOK PROCESSING AND SCALE DOWN';
      expect(verifyQuote(answers, quote)).toBe(true);
    });

    it('verifies a quotation with repeated whitespace and linebreaks', () => {
      const quote = 'pause   \n\t  webhook   processing';
      expect(verifyQuote(answers, quote)).toBe(true);
    });

    it('verifies a quotation with smart/curly quotation marks', () => {
      const textWithQuotes = ['We should apply “ON CONFLICT DO NOTHING” to prevent duplicates.'];
      const quote = '"on conflict do nothing"';
      expect(verifyQuote(textWithQuotes, quote)).toBe(true);
    });

    it('rejects an empty quotation', () => {
      expect(verifyQuote(answers, '')).toBe(false);
      expect(verifyQuote(answers, null)).toBe(false);
      expect(verifyQuote(answers, undefined)).toBe(false);
    });

    it('rejects short quotations less than MIN_QUOTE_LENGTH (10 characters)', () => {
      const shortQuote = 'pause'; // 5 chars
      expect(shortQuote.length).toBeLessThan(MIN_QUOTE_LENGTH);
      expect(verifyQuote(answers, shortQuote)).toBe(false);

      const nineChars = '123456789';
      expect(verifyQuote(answers, nineChars)).toBe(false);
    });

    it('rejects fabricated quotations not present in learner answers', () => {
      const fabricatedQuote = 'We should definitely reboot the Kubernetes node and clear memory cache.';
      expect(verifyQuote(answers, fabricatedQuote)).toBe(false);
    });

    it('rejects quotations where answer array is empty or entries are empty', () => {
      expect(verifyQuote([], 'pause webhook processing')).toBe(false);
      expect(verifyQuote(['', '   '], 'pause webhook processing')).toBe(false);
    });
  });

  describe('findQuoteRange() & Highlighting', () => {
    const text = 'First, I will PAUSE   WEBHOOK   PROCESSING to halt double charges.';

    it('computes correct original-text offsets for exact or case-insensitive match', () => {
      const quote = 'pause webhook processing';
      const range = findQuoteRange(text, quote);
      expect(range).not.toBeNull();
      if (!range) return;

      expect(range.start).toBe(14);
      expect(range.end).toBe(42);
      expect(text.slice(range.start, range.end)).toBe('PAUSE   WEBHOOK   PROCESSING');
    });

    it('safely handles regex special characters in learner answers and quotes', () => {
      const textWithRegex = 'Run query: SELECT * FROM ledger WHERE ref = $1 (status = [active])? Yes!';
      const quote = 'WHERE ref = $1 (status = [active])?';
      const range = findQuoteRange(textWithRegex, quote);

      expect(range).not.toBeNull();
      if (!range) return;
      expect(textWithRegex.slice(range.start, range.end)).toBe('WHERE ref = $1 (status = [active])?');
    });

    it('handles whitespace variances between quotation and original text', () => {
      const targetText = 'Add a UNIQUE\n\tconstraint    on ledger(reference).';
      const quote = 'unique constraint on ledger(reference)';
      const range = findQuoteRange(targetText, quote);

      expect(range).not.toBeNull();
      if (!range) return;
      expect(targetText.slice(range.start, range.end)).toBe('UNIQUE\n\tconstraint    on ledger(reference)');
    });

    it('returns null for a nonexistent quotation', () => {
      const range = findQuoteRange(text, 'Nonexistent quotation text that is not in target');
      expect(range).toBeNull();
    });

    it('returns null for empty text or empty quote', () => {
      expect(findQuoteRange('', 'some quote')).toBeNull();
      expect(findQuoteRange(text, '')).toBeNull();
      expect(findQuoteRange(text, '   ')).toBeNull();
    });
  });

  describe('findQuoteInLearnerAnswers()', () => {
    const learnerAnswers = {
      mitigation: sampleMitigation,
      fix: sampleFix,
      defense: sampleDefense,
    };

    it('identifies the correct field (mitigation, fix, or defense) containing the quote', () => {
      const mitResult = findQuoteInLearnerAnswers(learnerAnswers, 'pause webhook processing');
      expect(mitResult).not.toBeNull();
      expect(mitResult?.field).toBe('mitigation');

      const fixResult = findQuoteInLearnerAnswers(learnerAnswers, 'unique constraint on ledger');
      expect(fixResult).not.toBeNull();
      expect(fixResult?.field).toBe('fix');

      const defResult = findQuoteInLearnerAnswers(learnerAnswers, 'Redis lock is fast');
      expect(defResult).not.toBeNull();
      expect(defResult?.field).toBe('defense');
    });

    it('returns null when quote is not in any field', () => {
      const result = findQuoteInLearnerAnswers(learnerAnswers, 'completely fabricated statement');
      expect(result).toBeNull();
    });
  });
});
