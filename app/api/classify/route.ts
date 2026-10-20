import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerIncident } from '@/data/server/incidentRepository';
import {
  approachCategories,
  classifyLearnerFix,
} from '@/lib/fixClassifier';
import { LLMError } from '@/lib/llm';

const classifyRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('classify'),
    incidentId: z.string().min(1).max(100),
    mitigation: z.string().min(1).max(3000),
    fix: z.string().min(1).max(5000),
  }),
  z.object({
    action: z.literal('confirm'),
    incidentId: z.string().min(1).max(100),
    confirmedApproach: z.enum(approachCategories),
  }),
]);

// Fallback schema for backward compatibility where action is omitted
const implicitClassifySchema = z.object({
  incidentId: z.string().min(1).max(100),
  mitigation: z.string().min(1).max(3000),
  fix: z.string().min(1).max(5000),
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

    // Try discriminated union first, then implicit classify
    let parsedData:
      | { action: 'classify'; incidentId: string; mitigation: string; fix: string }
      | { action: 'confirm'; incidentId: string; confirmedApproach: (typeof approachCategories)[number] };

    const unionResult = classifyRequestSchema.safeParse(body);
    if (unionResult.success) {
      parsedData = unionResult.data;
    } else {
      const implicitResult = implicitClassifySchema.safeParse(body);
      if (implicitResult.success) {
        parsedData = {
          action: 'classify',
          ...implicitResult.data,
        };
      } else {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: unionResult.error.format(),
          },
          { status: 400 }
        );
      }
    }

    const serverIncident = getServerIncident(parsedData.incidentId);
    if (!serverIncident) {
      return NextResponse.json(
        { error: `Incident '${parsedData.incidentId}' not found` },
        { status: 404 }
      );
    }

    // Action 1: Confirm / Override -> Returns curated prewritten follow-up with ZERO LLM calls
    if (parsedData.action === 'confirm') {
      const branch =
        serverIncident.followUpBranches[parsedData.confirmedApproach] ||
        serverIncident.followUpBranches.other;

      return NextResponse.json({
        confirmedApproach: parsedData.confirmedApproach,
        followUpQuestion: branch.question,
      });
    }

    // Action 2: Classify fix -> Exactly ONE LLM call
    const classification = await classifyLearnerFix(
      parsedData.mitigation,
      parsedData.fix
    );

    const branch =
      serverIncident.followUpBranches[classification.approach] ||
      serverIncident.followUpBranches.other;

    return NextResponse.json({
      approach: classification.approach,
      reason: classification.reason,
      followUpQuestion: branch.question,
    });
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

    console.error('Unhandled error in /api/classify:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
