import { ServerIncident, serverDuplicatePaymentIncident } from './incidents/duplicate-payment';
import { serverBrokenProfileIncident } from './incidents/broken-profile-api';

const serverIncidents: Record<string, ServerIncident> = {
  'broken-profile-api': serverBrokenProfileIncident,
  'duplicate-payment': serverDuplicatePaymentIncident,
};

export function getServerIncident(id: string): ServerIncident | null {
  return serverIncidents[id] || null;
}

