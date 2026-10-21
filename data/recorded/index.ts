import { recordedDuplicatePaymentSession, RecordedSession } from './duplicate-payment';
import { recordedBrokenProfileSession } from './broken-profile-api';

const recordedSessions: Record<string, RecordedSession> = {
  'duplicate-payment': recordedDuplicatePaymentSession,
  'broken-profile-api': recordedBrokenProfileSession as unknown as RecordedSession,
};

export function getRecordedSession(incidentId: string): RecordedSession | null {
  return recordedSessions[incidentId] || null;
}

export type { RecordedSession };
export { recordedDuplicatePaymentSession, recordedBrokenProfileSession };
