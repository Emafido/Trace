export interface DiffLine {
  lineNum: number;
  type: 'ctx' | 'add' | 'del';
  prefix: ' ' | '+' | '-';
  text: string;
}

export interface PublicIncident {
  id: string;
  title: string;
  role: string;
  type: string;
  estimatedMinutes: number;
  summary: string;
  alert: string;
  contextMarkdown: string;
  diffLines: DiffLine[];
  telemetryLog: string;
}
export const publicIncident: PublicIncident = {
  id: 'duplicate-payment',
  title: 'Duplicate Payment Incident',
  role: 'Backend',
  type: 'Debugging',
  estimatedMinutes: 10,
  summary: 'A fintech webhook is crediting some customers twice. Investigate the deployment.',
  alert: "14:14 · Support: 14 tickets in 12 minutes: 'I was credited twice for one transfer.' No errors on the dashboard.",
  contextMarkdown: `### Service Overview
- **Service:** \`transfers-api\`
- **Stack:** Node 20, Express, PostgreSQL 15
- **Recent Change:** PR #412 scaled service instances from 1 to 3.
- **Deduplication Change:** The deployment replaced an in-memory deduplication Set with a database check.

### System Invariants & Behavior
- The payment provider can retry the same webhook.
- Each transfer reference must credit the associated account exactly once.
- **Database Schema:**
  - \`ledger(id, reference, account_id, amount, created_at)\` — has **no uniqueness constraint** on \`reference\`.
  - \`accounts(id, balance)\` — stores current account balances.
- The provider retries deliveries that are not successfully acknowledged with HTTP 200.`,
  diffLines: [
    { lineNum: 1, type: 'ctx', prefix: ' ', text: '// deploy/config.yaml' },
    { lineNum: 2, type: 'del', prefix: '-', text: 'replicas: 1' },
    { lineNum: 3, type: 'add', prefix: '+', text: 'replicas: 3' },
    { lineNum: 4, type: 'ctx', prefix: ' ', text: '// src/webhooks/transfer.ts' },
    { lineNum: 5, type: 'ctx', prefix: ' ', text: 'export async function handleTransferWebhook(req, res) {' },
    { lineNum: 6, type: 'ctx', prefix: ' ', text: '  const { reference, accountId, amount } = req.body;' },
    { lineNum: 7, type: 'del', prefix: '-', text: '  if (processedRefs.has(reference)) return res.sendStatus(200);' },
    { lineNum: 8, type: 'del', prefix: '-', text: '  processedRefs.add(reference);' },
    { lineNum: 9, type: 'add', prefix: '+', text: '  const existing = await db.query(\'SELECT 1 FROM ledger WHERE reference = $1\', [reference]);' },
    { lineNum: 10, type: 'add', prefix: '+', text: '  if (existing.rowCount === 0) {' },
    { lineNum: 11, type: 'ctx', prefix: ' ', text: '    await db.query(\'INSERT INTO ledger (reference, account_id, amount) VALUES ($1,$2,$3)\', [reference, accountId, amount]);' },
    { lineNum: 12, type: 'ctx', prefix: ' ', text: '    await db.query(\'UPDATE accounts SET balance = balance + $1 WHERE id = $2\', [amount, accountId]);' },
    { lineNum: 13, type: 'ctx', prefix: ' ', text: '    await notifier.send(accountId, amount);' },
    { lineNum: 14, type: 'add', prefix: '+', text: '  }' },
    { lineNum: 15, type: 'ctx', prefix: ' ', text: '  res.sendStatus(200);' },
    { lineNum: 16, type: 'ctx', prefix: ' ', text: '}' },
  ],
  telemetryLog: `14:02:11.004 inst-2 INFO webhook received ref=TRX_8841 acct=1042 amt=50000
14:02:11.008 inst-3 INFO webhook received ref=TRX_8841 acct=1042 amt=50000
14:02:11.012 inst-2 DEBUG dedupe check ref=TRX_8841 existing=0
14:02:11.013 inst-3 DEBUG dedupe check ref=TRX_8841 existing=0
14:02:11.019 inst-2 INFO ledger insert ref=TRX_8841
14:02:11.021 inst-3 INFO ledger insert ref=TRX_8841
14:02:11.030 inst-2 INFO balance update acct=1042 +50000
14:02:11.031 inst-3 INFO balance update acct=1042 +50000

--- metrics (last 12 min) ---
duplicate_ledger_references: 37
http_5xx: 0
p95_latency_ms: 41
support_tickets_tagged_double_credit: 14`,
};
