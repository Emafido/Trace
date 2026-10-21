import { notFound } from 'next/navigation';
import { getPublicIncident, getAllPublicIncidents } from '@/data/incidents';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

interface ChallengePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  const incidents = getAllPublicIncidents();
  return incidents.map((inc) => ({
    id: inc.id,
  }));
}

export async function generateMetadata({ params }: ChallengePageProps) {
  const { id } = await params;
  const incident = getPublicIncident(id);
  if (!incident) {
    return {
      title: 'Incident Not Found — Trace',
    };
  }

  return {
    title: `${incident.title} — Trace Incident Workspace`,
    description: incident.summary,
  };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { id } = await params;
  const incident = getPublicIncident(id);

  if (!incident) {
    notFound();
  }

  return <WorkspaceShell incident={incident} />;
}
