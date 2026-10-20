/**
 * Deterministic Quote Verification and Offset Highlighter for Trace.
 *
 * Separates objective verification from probabilistic LLM interpretation.
 * Verifies that AI-extracted evidence quotations genuinely exist verbatim
 * in the learner's submitted answers.
 */

/**
 * Normalizes text for robust substring matching:
 * - Converts to lowercase
 * - Normalizes smart/curly quotes and backticks to standard single/double quotes
 * - Collapses consecutive whitespace (spaces, tabs, newlines) into a single space
 * - Trims surrounding whitespace
 */
export function normalize(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    // Normalize double quotes
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
    // Normalize single quotes and backticks
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
    // Collapse all whitespace sequences into a single space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Escapes regex metacharacters for safe RegExp construction.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Minimum normalized length required for a valid quotation.
 * Short snippets (< 10 characters) such as single words do not constitute verifiable quotes.
 */
export const MIN_QUOTE_LENGTH = 10;

/**
 * Pure deterministic quote verification.
 *
 * @param originalAnswers Array of submitted answer texts (mitigation, fix, defense)
 * @param quote The claimed supporting quotation from the LLM
 * @returns true ONLY if the quote is non-empty, >= 10 chars, and exists as a substring
 */
export function verifyQuote(
  originalAnswers: string[],
  quote: string | null | undefined
): boolean {
  if (!quote || typeof quote !== 'string') {
    return false;
  }

  const normalizedQuote = normalize(quote);
  if (normalizedQuote.length < MIN_QUOTE_LENGTH) {
    return false;
  }

  for (const answer of originalAnswers) {
    if (!answer || typeof answer !== 'string') continue;
    const normalizedAnswer = normalize(answer);
    if (normalizedAnswer.includes(normalizedQuote)) {
      return true;
    }
  }

  return false;
}

export interface QuoteRange {
  start: number;
  end: number;
  matchedText: string;
}

/**
 * Locates the exact character offsets [start, end] of a quotation within original text.
 *
 * Handles case differences, whitespace variances, and smart quotes while preserving
 * exact offsets in the unmodified original text.
 *
 * @returns { start, end, matchedText } or null if not found
 */
export function findQuoteRange(text: string, quote: string): QuoteRange | null {
  if (!text || !quote) return null;

  const trimmedQuote = quote.trim();
  if (trimmedQuote.length === 0) return null;

  // Split quote into tokens by whitespace
  const tokens = trimmedQuote.split(/\s+/);
  if (tokens.length === 0) return null;

  // Build a regex pattern where each token is escaped and joined by \s+
  // Also normalize single and double quotes to match both curly and straight variants
  const patternParts = tokens.map((token) => {
    let escaped = escapeRegex(token);
    // Allow straight or curly single quotes
    escaped = escaped.replace(/'|\\['\u2018\u2019\u0060\u00B4]/g, "['\u2018\u2019\u0060\u00B4]");
    // Allow straight or curly double quotes
    escaped = escaped.replace(/"|\\["\u201C\u201D\u00AB\u00BB]/g, '["\u201C\u201D\u00AB\u00BB]');
    return escaped;
  });

  const regexPattern = patternParts.join('\\s+');

  try {
    const regex = new RegExp(regexPattern, 'i');
    const match = regex.exec(text);

    if (!match) {
      return null;
    }

    return {
      start: match.index,
      end: match.index + match[0].length,
      matchedText: match[0],
    };
  } catch {
    return null;
  }
}

export interface FieldQuoteLocation {
  field: 'mitigation' | 'fix' | 'defense';
  start: number;
  end: number;
  matchedText: string;
}

/**
 * Searches across all learner answer fields to locate where a quote appears.
 */
export function findQuoteInLearnerAnswers(
  answers: { mitigation: string; fix: string; defense: string },
  quote: string | null | undefined
): FieldQuoteLocation | null {
  if (!quote) return null;

  const fields: ('mitigation' | 'fix' | 'defense')[] = ['fix', 'mitigation', 'defense'];

  for (const field of fields) {
    const text = answers[field];
    const range = findQuoteRange(text, quote);
    if (range) {
      return {
        field,
        start: range.start,
        end: range.end,
        matchedText: range.matchedText,
      };
    }
  }

  return null;
}
