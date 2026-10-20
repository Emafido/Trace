export type LineCheckStatus = 'correct' | 'partial' | 'incorrect';

/**
 * Pure function to check whether a selected code line is faulty, partial, or incorrect.
 *
 * @param selectedLine The 1-based line number selected by the learner
 * @param faultyLines Array of line numbers containing the root flaw
 * @param partialLines Array of line numbers partially related or secondary to the flaw
 * @returns "correct" | "partial" | "incorrect"
 */
export function checkLine(
  selectedLine: number,
  faultyLines: number[],
  partialLines: number[]
): LineCheckStatus {
  if (faultyLines.includes(selectedLine)) {
    return 'correct';
  }
  if (partialLines.includes(selectedLine)) {
    return 'partial';
  }
  return 'incorrect';
}
