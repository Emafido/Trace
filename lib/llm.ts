import { z } from 'zod';

export class LLMError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 500) {
    super(message);
    this.name = 'LLMError';
  }
}

export class LLMConfigError extends LLMError {
  constructor(message: string = 'LLM API key is not configured on the server.') {
    super(message, 'CONFIG_ERROR', 503);
    this.name = 'LLMConfigError';
  }
}

export class LLMTimeoutError extends LLMError {
  constructor(message: string = 'LLM request timed out after 20 seconds.') {
    super(message, 'TIMEOUT_ERROR', 504);
    this.name = 'LLMTimeoutError';
  }
}

export class LLMSchemaError extends LLMError {
  constructor(message: string = 'LLM response failed structured schema validation.') {
    super(message, 'SCHEMA_ERROR', 502);
    this.name = 'LLMSchemaError';
  }
}

export interface StructuredLLMOptions<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  timeoutMs?: number;
}

/**
 * Resolves active LLM configuration from server environment variables.
 * Checks LLM_API_KEY, LLM_MODEL, and LLM_BASE_URL.
 * Supports OpenAI-compatible endpoints (including OpenAI, Gemini via OpenAI compatibility, Groq, Ollama, etc.).
 */
export function getLLMConfig() {
  const apiKey =
    process.env.LLM_API_KEY ||
    (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('your')
      ? process.env.OPENAI_API_KEY
      : undefined) ||
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_api_key_here'
      ? process.env.GEMINI_API_KEY
      : undefined);

  if (!apiKey) {
    return null;
  }

  const isGemini = Boolean(
    (process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'your_api_key_here' &&
      !process.env.LLM_BASE_URL) ||
      process.env.LLM_MODEL?.startsWith('gemini')
  );

  const baseUrl =
    process.env.LLM_BASE_URL ||
    (isGemini
      ? 'https://generativelanguage.googleapis.com/v1beta/openai'
      : 'https://api.openai.com/v1');

  const model =
    process.env.LLM_MODEL ||
    (isGemini ? 'gemini-1.5-flash' : 'gpt-4o-mini');

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    model,
  };
}

/**
 * Executes a single chat completion request against the configured LLM endpoint.
 */
async function executeChatRequest(
  config: { apiKey: string; baseUrl: string; model: string },
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${config.baseUrl}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new LLMError(
        `LLM provider returned HTTP ${response.status}: ${errorBody.slice(0, 200)}`,
        'PROVIDER_ERROR',
        response.status >= 500 ? 502 : 500
      );
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      throw new LLMError('LLM response message content was empty', 'EMPTY_RESPONSE', 502);
    }

    return content;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof LLMError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new LLMTimeoutError(`LLM request timed out after ${timeoutMs / 1000}s`);
    }

    throw new LLMError(
      error instanceof Error ? error.message : 'Unknown LLM network failure',
      'NETWORK_ERROR',
      502
    );
  }
}

/**
 * Robust JSON extraction helper that handles raw JSON or markdown code-fenced JSON.
 */
function extractJsonString(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

/**
 * Server-side structured LLM caller with:
 * - Temperature 0
 * - 20-second timeout
 * - Zod schema validation
 * - Exactly one retry if output fails schema validation
 * - Clear typed errors
 */
export async function callStructuredLLM<T>(
  options: StructuredLLMOptions<T>
): Promise<T> {
  const config = getLLMConfig();
  if (!config) {
    throw new LLMConfigError();
  }

  const timeoutMs = options.timeoutMs ?? 20000;

  // First Attempt
  let rawContent: string;
  try {
    rawContent = await executeChatRequest(
      config,
      options.systemPrompt,
      options.userPrompt,
      timeoutMs
    );
  } catch (error) {
    throw error;
  }

  try {
    const parsedJson = JSON.parse(extractJsonString(rawContent));
    const validated = options.schema.safeParse(parsedJson);
    if (validated.success) {
      return validated.data;
    }
  } catch {
    // Continue to retry attempt below
  }

  // Exactly one retry with correction guidance if schema validation or JSON parsing failed
  const retryPrompt = `${options.userPrompt}\n\n[System Note: Your previous response was not valid JSON conforming to the requested schema. Output strictly valid JSON matching the schema.]`;

  const retryContent = await executeChatRequest(
    config,
    options.systemPrompt,
    retryPrompt,
    timeoutMs
  );

  try {
    const retryParsed = JSON.parse(extractJsonString(retryContent));
    const retryValidated = options.schema.safeParse(retryParsed);
    if (retryValidated.success) {
      return retryValidated.data;
    }
    throw new LLMSchemaError(
      `LLM retry failed schema validation: ${JSON.stringify(retryValidated.error.format())}`
    );
  } catch (err) {
    if (err instanceof LLMSchemaError) throw err;
    throw new LLMSchemaError('LLM response is not valid JSON even after retry.');
  }
}
