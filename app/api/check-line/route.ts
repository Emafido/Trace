import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerIncident } from '@/data/server/incidentRepository';
import { publicIncident } from '@/data/incidents/duplicate-payment';
import { checkLine } from '@/lib/lineChecker';

const checkLineRequestSchema = z.object({
  incidentId: z.string().min(1, 'incidentId is required'),
  selectedLine: z.number().int('selectedLine must be an integer').positive('selectedLine must be positive'),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parseResult = checkLineRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { incidentId, selectedLine } = parseResult.data;

    const serverIncident = getServerIncident(incidentId);
    if (!serverIncident) {
      return NextResponse.json(
        { error: `Incident '${incidentId}' not found` },
        { status: 404 }
      );
    }

    // Validate that the line exists within the incident diff
    const maxLine = publicIncident.diffLines.length > 0
      ? Math.max(...publicIncident.diffLines.map((l) => l.lineNum))
      : 100;

    if (selectedLine > maxLine) {
      return NextResponse.json(
        { error: `Line ${selectedLine} is out of bounds for incident '${incidentId}'` },
        { status: 400 }
      );
    }

    const status = checkLine(
      selectedLine,
      serverIncident.faultyLines,
      serverIncident.partialLines
    );

    const explanation = serverIncident.lineExplanations[status];

    return NextResponse.json({
      status,
      explanation,
    });
  } catch (error) {
    console.error('Error in /api/check-line:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
