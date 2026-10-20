import { notFound } from 'next/navigation';
import { publicIncident } from '@/data/incidents/duplicate-payment';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

interface ChallengePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ChallengePageProps) {
  const { id } = await params;
  if (id !== publicIncident.id) {
    return {
      title: 'Incident Not Found — Trace',
    };
  }

  return {
    title: `${publicIncident.title} — Trace Incident Workspace`,
    description: publicIncident.summary,
  };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { id } = await params;

  if (id !== publicIncident.id) {
    notFound();
  }

  return <WorkspaceShell incident={publicIncident} />;
}
