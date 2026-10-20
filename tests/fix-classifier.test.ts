import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  truncateToWordLimit,
  buildClassificationUserPrompt,
  classifyLearnerFix,
  classificationResponseSchema,
  APPROACH_DETAILS,
} from '@/lib/fixClassifier';
import * as llmModule from '@/lib/llm';

describe('Fix Classifier Module (lib/fixClassifier)', () => {
  it('truncates reason to 25 words or fewer', () => {
    const shortText = 'Enforces database uniqueness on payment reference.';
    expect(truncateToWordLimit(shortText, 25)).toBe(shortText);

    const longText =
      'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six twenty-seven';
    const truncated = truncateToWordLimit(longText, 25);
    const wordCount = truncated.replace('...', '').trim().split(/\s+/).length;
    expect(wordCount).toBe(25);
    expect(truncated.endsWith('...')).toBe(true);
  });

  it('wraps learner mitigation and fix in untrusted boundary tags', () => {
    const prompt = buildClassificationUserPrompt(
      'Roll back PR #412',
      'Add UNIQUE constraint'
    );
    expect(prompt).toContain('<learner_mitigation>\nRoll back PR #412\n</learner_mitigation>');
    expect(prompt).toContain('<learner_fix>\nAdd UNIQUE constraint\n</learner_fix>');
  });

  it('validates all allowed approach categories against schema', () => {
    const validCategories = [
      'row_lock',
      'redis_lock',
      'unique_constraint',
      'app_cache',
      'other',
      'unclear',
    ];

    for (const cat of validCategories) {
      const res = classificationResponseSchema.safeParse({
        approach: cat,
        reason: 'Valid technical reason.',
      });
      expect(res.success).toBe(true);
      expect(APPROACH_DETAILS[cat as keyof typeof APPROACH_DETAILS]).toBeDefined();
    }
  });

  it('rejects unsupported approach values', () => {
    const invalid = classificationResponseSchema.safeParse({
      approach: 'distributed_consensus',
      reason: 'Raft consensus',
    });
    expect(invalid.success).toBe(false);
  });
});

describe('Classification Scenarios (Mocked LLM)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Scenario 1: Database uniqueness -> unique_constraint', async () => {
    const mockCall = vi.spyOn(llmModule, 'callStructuredLLM').mockResolvedValue({
      approach: 'unique_constraint',
      reason: 'The solution enforces database-level uniqueness on the reference key.',
    });

    const result = await classifyLearnerFix(
      'Roll back PR #412',
      'I would add a unique constraint on reference, use ON CONFLICT DO NOTHING, and update the account balance within the same transaction only when the insert succeeds.'
    );

    expect(result.approach).toBe('unique_constraint');
    expect(result.reason).toContain('database-level uniqueness');
    expect(mockCall).toHaveBeenCalledTimes(1);
  });

  it('Scenario 2: Redis lock -> redis_lock', async () => {
    vi.spyOn(llmModule, 'callStructuredLLM').mockResolvedValue({
      approach: 'redis_lock',
      reason: 'The solution coordinates deduplication via a Redis distributed lock.',
    });

    const result = await classifyLearnerFix(
      'Pause webhook consumer',
      'I would acquire a Redis distributed lock for each payment reference.'
    );

    expect(result.approach).toBe('redis_lock');
  });

  it('Scenario 3: Database row lock -> row_lock', async () => {
    vi.spyOn(llmModule, 'callStructuredLLM').mockResolvedValue({
      approach: 'row_lock',
      reason: 'The solution uses SELECT FOR UPDATE to lock the account record.',
    });

    const result = await classifyLearnerFix(
      'Scale back to 1 replica',
      'I would lock the account row with SELECT FOR UPDATE.'
    );

    expect(result.approach).toBe('row_lock');
  });

  it('Scenario 4: Weak response -> other or unclear', async () => {
    vi.spyOn(llmModule, 'callStructuredLLM').mockResolvedValue({
      approach: 'other',
      reason: 'Restarting servers and try-catch does not address database concurrency.',
    });

    const result = await classifyLearnerFix(
      'No action',
      'I would restart the servers and add a try/catch.'
    );

    expect(['other', 'unclear']).toContain(result.approach);
  });

  it('Scenario 5: Ambiguous response -> unclear', async () => {
    vi.spyOn(llmModule, 'callStructuredLLM').mockResolvedValue({
      approach: 'unclear',
      reason: 'The proposal lacks concrete technical concurrency details.',
    });

    const result = await classifyLearnerFix(
      'Check logs',
      'I would improve the database logic.'
    );

    expect(result.approach).toBe('unclear');
  });

  it('propagates LLM timeout error cleanly', async () => {
    vi.spyOn(llmModule, 'callStructuredLLM').mockRejectedValue(
      new llmModule.LLMTimeoutError('LLM request timed out after 20 seconds.')
    );

    await expect(
      classifyLearnerFix('Mitigate', 'Add unique constraint')
    ).rejects.toThrow(llmModule.LLMTimeoutError);
  });

  it('propagates LLM configuration error when API key is missing', async () => {
    vi.spyOn(llmModule, 'callStructuredLLM').mockRejectedValue(
      new llmModule.LLMConfigError('LLM API key is not configured on the server.')
    );

    await expect(
      classifyLearnerFix('Mitigate', 'Add unique constraint')
    ).rejects.toThrow(llmModule.LLMConfigError);
  });
});
