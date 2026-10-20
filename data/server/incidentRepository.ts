import { ServerIncident, serverDuplicatePaymentIncident } from './incidents/duplicate-payment';

const serverIncidents: Record<string, ServerIncident> = {
  'duplicate-payment': serverDuplicatePaymentIncident,
};

export function getServerIncident(id: string): ServerIncident | null {
  return serverIncidents[id] || null;
}
