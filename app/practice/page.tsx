import type { Metadata } from 'next';
import { getAllPublicIncidents } from '@/data/incidents';
import { PracticeHub } from '@/components/practice/PracticeHub';

export const metadata: Metadata = {
  title: 'Practice Hub — Trace',
  description:
    'Choose an incident, investigate the evidence, and work through the decisions developers make when real systems fail.',
};

export default function PracticePage() {
  const incidents = getAllPublicIncidents();

  return <PracticeHub incidents={incidents} />;
}
