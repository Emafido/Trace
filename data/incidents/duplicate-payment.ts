export interface DiffLine {
  lineNum: number;
  type: 'ctx' | 'add' | 'del';
  prefix: ' ' | '+' | '-';
  text: string;
}

export interface ApproachCategoryOption {
  id: string;
  name: string;
  description: string;
}

export interface StepPrompts {
  step1: {
    title: string;
    description: string;
    placeholder: string;
  };
  step2: {
    title: string;
    description: string;
  };
  step3: {
    title: string;
    description: string;
    placeholder: string;
  };
}

export interface PublicIncident {
  id: string;
  title: string;
  role: string;
  type: string;
  difficulty?: 'Beginner' | 'Intermediate';
  skills?: string[];
  isRecommended?: boolean;
  estimatedMinutes: number;
  summary: string;
  alert: string;
  contextMarkdown: string;
  diffLines: DiffLine[];
  telemetryLog: string;
  approachCategories: ApproachCategoryOption[];
  stepPrompts: StepPrompts;
}
export const publicIncident: PublicIncident = {
  id: 'duplicate-payment',
  title: 'Duplicate Payment Incident',
  role: 'Backend',
  type: 'Debugging',
  difficulty: 'Intermediate',
  skills: ['Distributed Systems', 'Concurrency & Locks', 'PostgreSQL'],
  isRecommended: false,
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
  approachCategories: [
    {
      id: 'unique_constraint',
      name: 'Unique constraint / idempotency key',
      description: 'Enforces database-level uniqueness on transfer reference or atomic ON CONFLICT insertion.',
    },
    {
      id: 'row_lock',
      name: 'Database row lock',
      description: 'Locks the database row (e.g. SELECT FOR UPDATE or advisory locks) during the transaction.',
    },
    {
      id: 'redis_lock',
      name: 'Redis distributed lock',
      description: 'Acquires a distributed lock (e.g. via Redis/Redlock) per transfer reference across instances.',
    },
    {
      id: 'app_cache',
      name: 'In-memory / per-process check',
      description: 'Coordinates deduplication in application memory or local process cache.',
    },
    {
      id: 'other',
      name: 'Something else',
      description: 'A recognizable technical approach outside the standard categories.',
    },
    {
      id: 'unclear',
      name: 'Unclear approach',
      description: 'Vague, incomplete, or ambiguous explanation without a distinct mechanism.',
    },
  ],
  stepPrompts: {
    step1: {
      title: "It's 14:14 and customers are being credited twice. What do you do in the next two minutes to stop the damage, before writing any code?",
      description: 'Be specific: what action, on what, and why it is safe.',
      placeholder: 'Describe your emergency containment action (e.g. roll back PR #412 or pause the webhook consumer)...',
    },
    step2: {
      title: 'Select the faulty line in deploy.diff.',
      description: 'Click a line row in the diff pane on the left or use keyboard navigation to select it. Locate the exact line introducing the concurrency race condition.',
    },
    step3: {
      title: "Explain the root cause and the fix you'd ship. Prose or code is fine.",
      description: 'Describe how your solution permanently stops duplicate processing under concurrent delivery.',
      placeholder: 'Example:\nI would add a UNIQUE constraint on ledger(reference) and wrap the handler in a single transaction with ON CONFLICT (reference) DO NOTHING...',
    },
  },
};
