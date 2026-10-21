import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerIncident } from '@/data/server/incidentRepository';
import { evaluateLearnerReview } from '@/lib/reviewEvaluator';
import { LLMError } from '@/lib/llm';

const reviewRequestSchema = z.object({
  incidentId: z.string().min(1).max(100),
  mitigation: z.string().min(1).max(3000),
  fix: z.string().min(1).max(5000),
  defense: z.string().min(1).max(3000),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const parseResult = reviewRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { incidentId, mitigation, fix, defense } = parseResult.data;

    const serverIncident = getServerIncident(incidentId);
    if (!serverIncident) {
      return NextResponse.json(
        { error: `Incident '${incidentId}' not found` },
        { status: 404 }
      );
    }

    // Execute evaluation pipeline: LLM evaluation + deterministic quote verification
    const reviewResult = await evaluateLearnerReview(
      { mitigation, fix, defense },
      {
        id: serverIncident.id,
        rubric: serverIncident.rubric,
        referenceSolution: serverIncident.referenceSolution,
      }
    );

    return NextResponse.json(reviewResult);
  } catch (error) {
    if (error instanceof LLMError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    console.error('Unhandled error in /api/review:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
