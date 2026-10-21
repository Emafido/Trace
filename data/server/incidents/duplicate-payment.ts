export interface RubricItem {
  id: 'r1' | 'r2' | 'r3' | 'r4';
  title: string;
  description: string;
}

export interface FollowUpBranch {
  id: string;
  title: string;
  question: string;
}

export interface ReferenceSolution {
  mitigation: string;
  rootCause: string;
  dataRepairQuery?: string;
  constraintSql?: string;
  codeSnippet?: string;
  permanentFix: string[];
  tradeOffs: {
    approach: string;
    tradeOff: string;
  }[];
  prevention?: string[];
  keyTakeaway?: string;
}

export interface ServerIncident {
  id: string;
  faultyLines: number[];
  partialLines: number[];
  generalExplanation: string;
  lineExplanations: {
    correct: string;
    partial: string;
    incorrect: string;
  };
  rubric: RubricItem[];
  followUpBranches: Record<string, FollowUpBranch>;
  referenceSolution: ReferenceSolution;
}

export const serverDuplicatePaymentIncident: ServerIncident = {
  id: 'duplicate-payment',
  faultyLines: [9, 10],
  partialLines: [11],
  generalExplanation:
    "Lines 9–10 check whether the reference exists, then act on the result. Two deliveries arriving together both see 'no row' before either inserts. The database never prevents it: a check-then-act race.",
  lineExplanations: {
    correct:
      "Correct. Lines 9–10 introduce a classic check-then-act race condition. Concurrent webhook deliveries both execute SELECT 1, both observe zero rows, and both proceed to insert duplicate ledger entries and credit the customer twice.",
    partial:
      "Partial match. Line 11 is where the duplicate row is inserted, but the actual vulnerability is the non-atomic existence check on lines 9–10 that allowed both concurrent deliveries to proceed.",
    incorrect:
      "Incorrect. This line is not the source of the duplicate credit race condition. The vulnerability is the separate existence check (lines 9–10) preceding the insert without concurrency control.",
  },
  rubric: [
    {
      id: 'r1',
      title: 'Mitigation',
      description:
        'Stops damage before writing code, such as rollback, disabling webhook processing, or pausing the consumer.',
    },
    {
      id: 'r2',
      title: 'Root cause',
      description:
        'Explains the non-atomic check-then-act race where concurrent deliveries both pass the existence check.',
    },
    {
      id: 'r3',
      title: 'Permanent fix',
      description:
        'Enforces database-level atomic duplicate prevention using a unique constraint and conditional insert, with ledger insertion and balance update occurring in one transaction.',
    },
    {
      id: 'r4',
      title: 'Data repair',
      description:
        'Identifies and reconciles existing duplicate credits before enforcing the uniqueness constraint.',
    },
  ],
  followUpBranches: {
    row_lock: {
      id: 'row_lock',
      title: 'Database row lock',
      question:
        'If the notification call runs inside your locked transaction and the notification service slows to 8 seconds, what happens to your connection pool?',
    },
    redis_lock: {
      id: 'redis_lock',
      title: 'Redis distributed lock',
      question:
        'Your lock has a 5-second TTL. If a worker stalls for 6 seconds mid-handler, what stops the second delivery from also crediting the account?',
    },
    unique_constraint: {
      id: 'unique_constraint',
      title: 'Unique constraint / idempotency key',
      question:
        'A duplicate delivery now hits the constraint. What response should the endpoint return to the provider, and what should you log?',
    },
    app_cache: {
      id: 'app_cache',
      title: 'In-memory / per-process check',
      question:
        'You now run 3 instances, each with its own memory. How does instance 2 know instance 3 already handled this reference?',
    },
    other: {
      id: 'other',
      title: 'Something else',
      question:
        'Walk through, step by step, what happens when two deliveries of the same event arrive 4 ms apart under your fix.',
    },
    unclear: {
      id: 'unclear',
      title: 'Unclear approach',
      question:
        'Walk through, step by step, what happens when two deliveries of the same event arrive 4 ms apart under your fix.',
    },
  },
  referenceSolution: {
    mitigation:
      'Roll back PR #412 or pause webhook processing to limit further damage. This is temporary; an in-memory Set is not a reliable permanent deduplication system.',
    rootCause:
      'The SELECT and INSERT are separate statements, allowing concurrent requests to pass the same existence check.',
    dataRepairQuery: `SELECT reference, COUNT(*)
FROM ledger
GROUP BY reference
HAVING COUNT(*) > 1;`,
    constraintSql: `ALTER TABLE ledger
ADD CONSTRAINT ledger_reference_key UNIQUE (reference);`,
    permanentFix: [
      'Begin a database transaction.',
      'Insert into ledger with ON CONFLICT (reference) DO NOTHING.',
      'Check whether the insertion succeeded.',
      'Update the account balance only when the ledger row was newly inserted.',
      'Commit.',
      'Send notification after commit.',
      'Acknowledge successful or safely duplicated delivery according to the provider\'s documented webhook contract.',
    ],
    tradeOffs: [
      {
        approach: 'Row lock',
        tradeOff:
          'Slow external calls inside transactions can hold database connections and locks; locking a nonexistent ledger row does not help.',
      },
      {
        approach: 'Redis lock',
        tradeOff:
          'TTL expiry can allow concurrent work; a database invariant is still necessary.',
      },
      {
        approach: 'Unique constraint',
        tradeOff:
          'Correctly handled duplicates should receive the appropriate successful webhook acknowledgment and be logged.',
      },
      {
        approach: 'In-memory cache',
        tradeOff: 'Process-local Sets cannot coordinate across three instances.',
      },
    ],
  },
};
