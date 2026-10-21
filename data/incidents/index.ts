import { PublicIncident } from './duplicate-payment';
import { brokenProfilePublicIncident } from './broken-profile-api';
import { publicIncident as duplicatePaymentPublicIncident } from './duplicate-payment';

export type { PublicIncident, DiffLine, ApproachCategoryOption, StepPrompts } from './broken-profile-api';

const publicIncidents: PublicIncident[] = [
  brokenProfilePublicIncident,
  duplicatePaymentPublicIncident,
];

export function getAllPublicIncidents(): PublicIncident[] {
  return publicIncidents;
}

export function getPublicIncident(id: string): PublicIncident | null {
  return publicIncidents.find((inc) => inc.id === id) || null;
}
