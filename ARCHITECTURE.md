# Trace — Architecture & Technical Design

## 1. Executive Overview

**Trace** is an interactive software engineering practice platform where developers investigate realistic production incidents, isolate faulty code, propose mitigations and permanent fixes, and defend technical trade-offs.

Trace explicitly separates **deterministic verification** from **probabilistic AI interpretation**:
- **Deterministic engine:** Validates faulty code line selection, boundary conditions, character limits, and progression rules with zero latency, zero hallucinations, and authoritative accuracy.
- **AI interpretation:** Classifies unstructured engineering fixes into architectural categories and later evaluates reasoning against rubric criteria.
- **Curated incident content:** Provides realistic production diffs, telemetry logs, architectures, follow-up trees, and reference solutions.

---

## 2. Technology Stack & Decision Rationale

### Next.js 15 App Router
- **Why:** Full-stack React framework providing unified server-side API routes, React Server Components (RSC) for zero-client-bundle data delivery, and client components for interactive consoles.
- **Trade-off:** App Router requires strict boundary discipline between server and client modules (`use client`), but guarantees server-side evaluation secrecy.

### TypeScript (Strict Mode)
- **Why:** Guarantees structural typing across incident schemas, API payloads, reducer actions, and evaluation rubrics. Eliminates entire classes of runtime errors.
- **Trade-off:** Requires upfront type scaffolding for exercise state and schemas.

### Bun (Runtime & Tooling)
- **Why:** Ultra-fast package manager, script runner, and bundler. Native TypeScript execution without transpile lag. Fast Vitest test suite execution.
- **Trade-off:** Minor ecosystem edge-cases on Windows (e.g. ESLint flat config IPC workers during build, bypassed via build config).

### Zod (Runtime Schema Validation)
- **Why:** Validates external inputs at API boundaries (`/api/check-line`, `/api/classify`, `/api/review`) with type inference.
- **Trade-off:** Small bundle size addition, offset by bulletproof runtime boundary safety.

### In-Memory / File-Based Architecture (No Database)
- **Why:** Trace incidents are curated static scenarios, not dynamic user-generated records. Keeping authoritative answer keys, diffs, and rubrics in structured TypeScript files enables zero-infrastructure deployment, version control with Git, instant startup, and deterministic test fixtures.
- **Trade-off:** Multi-session persistence across different devices requires explicit persistence layers (addressed in Phase 5 via local storage or session tokens).

---

## 3. Data Architecture: Public vs. Private Boundary

A core security principle in Trace is that **the browser never receives the answer key**.

```
Browser (Client Bundle)                Server (Protected Environment)
┌───────────────────────────────┐     ┌────────────────────────────────────┐
│ publicIncident:               │     │ serverIncident:                    │
│ - id, title, summary, alert   │     │ - faultyLines: [9, 10]             │
│ - diffLines (numbered)        │     │ - partialLines: [11]               │
│ - telemetryLog (raw)          │     │ - rubric criteria (r1–r4)          │
│ - contextMarkdown             │     │ - followUpBranches (questions)     │
│                               │     │ - referenceSolution                │
│ User action: Select Line 9    │     │                                    │
│ └─► POST /api/check-line ─────┼────►│ checkLine(line, faulty, partial)   │
│ ◄── { status: "correct" } ────┼─────┤ Returns status + explanation       │
└───────────────────────────────┘     └────────────────────────────────────┘
```

- **`data/incidents/duplicate-payment.ts`**: Contains only client-safe fields (`publicIncident`). Imported by client workspace components.
- **`data/server/incidents/duplicate-payment.ts`**: Contains secret answer keys (`faultyLines`, `partialLines`, line explanations, rubric, follow-up trees). Imported exclusively by Next.js server routes.
- **`data/server/incidentRepository.ts`**: Server-only lookup module preventing arbitrary access.

---

## 4. Five-Step State Machine

Trace enforces an explicit, unskippable investigation progression:

```
Step 1: Mitigate ──► Step 2: Find Fault ──► Step 3: Fix ──► Step 4: Confirm ──► Step 5: Defend ──► Review
(Min 20 chars,       (Select line in        (Min 30 chars,  (AI category    (Prewritten     (Phase 4)
 Lock button)         deploy.diff,           Submit button)  classification, follow-up
                      Check line API)                        learner verify)  defense)
```

### State Container: `useReducer` (`lib/exerciseReducer.ts`)
The entire exercise lifecycle is managed by a single pure reducer:
- **`mitigation` & `mitigationLocked`**: Stores learner's initial triage action. Advancing to Step 2 locks editing.
- **`selectedLine`, `lineCheckResult`, `firstLineAttemptCorrect`**: Records line selection and verification. First-attempt accuracy is tracked immutably on the first check and cannot be overwritten by subsequent checks.
- **Progression guards**: Learners cannot jump ahead; Step 2 requires `mitigationLocked`; Step 3 requires `lineCheckAttempts > 0`; Step 4 requires `fixSubmitted`.

---

## 5. Division of Responsibility: Code vs. AI

| Capability | Engine | Rationale |
|---|---|---|
| Faulty line verification | Deterministic TypeScript (`checkLine`) | Fast, accurate, zero hallucination. Line 9/10 = correct, 11 = partial, others = incorrect. |
| Progress & validation rules | Deterministic Reducer | Enforces character limits, step prerequisites, and first-attempt tracking. |
| Incident facts & follow-up questions | Curated Server Content | Prevents AI from inventing incorrect incident parameters or off-topic questions. |
| Proposed fix classification | LLM (`/api/classify`) with learner confirmation | Interprets natural language/code into distinct architectural categories (`unique_constraint`, `row_lock`, `redis_lock`, `app_cache`, `other`, `unclear`). Learner confirms or overrides. |
| Rubric review & quote checking | LLM + Deterministic quote verifier | AI evaluates reasoning against rubric; server validates that cited evidence verbatim matches learner submissions (Phase 4). |

---

## 6. Phase 3 Architecture: AI Fix Classification & Follow-up Defense

### 6.1 Single-Operation LLM Classification
The `/api/classify` endpoint executes exactly **one** LLM request per fix submission:
- **Prompt Injection Defense**: Learner input is strictly isolated inside `<learner_mitigation>` and `<learner_fix>` tags. The model prompt explicitly commands treating these contents as untrusted analysis data, never instructions.
- **Controlled Output Space**: Classification maps to one of six mutually exclusive categories:
  - `unique_constraint`: Database-enforced uniqueness or conditional insert.
  - `row_lock`: Row-level or advisory database locking (explicitly differentiated from ordinary transactions).
  - `redis_lock`: External distributed locking.
  - `app_cache`: In-memory process deduplication.
  - `other`: A recognized architectural solution outside these categories.
  - `unclear`: Ambiguous, vague, or incomplete solutions.
- **Conciseness Invariant**: The returned reason is constrained by prompt and programmatically truncated to $\le 25$ words.

### 6.2 Zero-LLM Follow-Up Selection & Override Pipeline
To respect the architectural principle that follow-up questions must be curated and deterministic:
1. **Initial Match**: When `/api/classify` returns the AI approach, it looks up the matching prewritten follow-up question directly from `serverIncident.followUpBranches` on the server and attaches it to the response.
2. **Learner Correction (Override)**: If the learner indicates the interpretation is "Not quite" and selects a different category, a lightweight action (`action: 'confirm'`) is sent to `/api/classify`. The server immediately resolves the prewritten follow-up question for the learner's chosen branch **without making an LLM call**.
3. **Trade-off Analysis**: Supporting both `classify` and `confirm` actions within `/api/classify` via a Zod discriminated union prevents endpoint proliferation while keeping authoritative branch questions and rubrics strictly server-side.

### 6.3 State Machine Extensions
The `ExerciseState` machine cleanly tracks:
- `classificationStatus`: `'idle' | 'loading' | 'success' | 'error'`
- `classifiedApproach`: Original AI-assigned approach category.
- `confirmedApproach`: Learner-confirmed approach category (used to drive the follow-up branch).
- `classificationSource`: `'ai' | 'manual'` (ensures the UI never falsely represents manual selections as AI output).
- `followUpQuestion`: Server-supplied prewritten defense prompt.
- `defense`: Learner's trade-off defense text ($\ge 20$ chars required).
- `defenseSubmitted`: Locks defense and transitions to `'review'`.

---

## 7. Phase 4 Architecture: Evidence-Backed Engineering Feedback & Verbatim Quote Verification

### 7.1 Separation of Truth: "Checked by Code" vs. "Interpreted by AI"
Trace's core differentiator is radical transparency regarding evidence and verification. The final Review screen strictly divides feedback into two distinct, visual sections:

1. **Checked by Code (Deterministic Engine)**:
   - Displays the learner's selected line from `deploy.diff`.
   - Renders the exact status (`correct`, `partial`, `incorrect`) evaluated server-side.
   - Shows whether the learner solved the issue on their first attempt (`firstLineAttemptCorrect`).
   - Presents curated engineering explanations directly from the server.
   - **Critical invariant:** An LLM is never permitted to re-evaluate or hallucinate line-selection correctness.

2. **Interpreted by AI (Probabilistic LLM + Deterministic Guardrails)**:
   - Evaluates the learner's written triage against exactly four curated rubric criteria:
     - `r1`: Immediate mitigation (containment before coding).
     - `r2`: Root cause (concurrency check-then-act race).
     - `r3`: Permanent fix (database-level atomic constraint).
     - `r4`: Existing-data repair (reconciling affected accounts).
   - Assigns a status (`CAUGHT`, `PARTIAL`, `MISSED`) with an extracted quotation and a concise note ($\le 25$ words).
   - Clearly labels this evaluation as AI interpretation and provides an explicit disclaimer in the footer.

### 7.2 Deterministic Quote Verification Engine (`lib/verify.ts`)
LLMs are prone to sycophancy and hallucinations—often claiming a user explained a concept when they merely repeated a buzzword or made an unrelated statement. Trace addresses this through deterministic evidence verification:

1. **Normalization (`normalize`)**: Converts text to lowercase, standardizes smart/curly quotes and backticks to standard single/double quotes, collapses whitespace sequences, and trims edges.
2. **Verification (`verifyQuote`)**: Requires a quotation to be at least 10 normalized characters and exist as a verbatim continuous substring in one of the learner's submitted answers (`mitigation`, `fix`, or `defense`).
3. **Offset Locator (`findQuoteRange`)**: Locates exact character offsets `[start, end]` in unmodified user text using regex tokenization with whitespace flexibility, enabling interactive highlighting.
4. **Post-LLM Enforcement (`enforceQuoteVerification`)**:
   - If the model assigns `CAUGHT` or `PARTIAL` but the supporting quotation fails verification, **credit is automatically revoked**.
   - The status is forced to `MISSED`, the quote set to `null`, and the note replaced with *"No supporting quote found in your submitted answers."*
   - Internal flags (`verificationFailed: true`) distinguish model judgment from verification enforcement.

### 7.3 Reference Solution & Interactive Quote Highlighting
- **Zero Hallucination Reference**: The authoritative reference solution (mitigation, root cause, permanent fix, DDL constraint, architectural trade-offs, reconciliation SQL) is loaded strictly from `serverIncident.referenceSolution` on the server when `/api/review` succeeds, never fabricated by an LLM.
- **Interactive Highlighting**: Clicking any rubric item in Section B updates `selectedRubricItem`, dynamically highlighting the matching verified citation within the learner's original answers in Section C via `<HighlightableText>`.
- **Non-Destructive Retry & Reset**: If the review request fails (e.g. rate limit or network error), all learner responses are preserved and an inline Retry button triggers re-evaluation. A "Try again" button executes `RESET`, cleanly restoring initial exercise state without full page reloads.

---

## 8. Phase 5 Architecture: Live AI Reliability, Demo Mode & Session Persistence

### 8.1 Live AI Evaluation Harness (`scripts/eval.ts`)
To bridge the gap between deterministic unit mocks and real-world frontier model behavior, Trace provides an automated evaluation harness (`bun run eval`):
- **Curated Fixtures**: Evaluates 5 standardized benchmarks:
  - `Fixture A` (Strong): Validates full credit award across all 4 criteria (`CAUGHT`) and `unique_constraint` approach.
  - `Fixture B` (Weak): Validates rejection (`MISSED`) of server restarts and try/catch blocks without genuine containment.
  - `Fixture C` (Prompt Injection): Validates that direct override commands wrapped in untrusted tags remain pure data, preventing unauthorized credit.
  - `Fixture D` (Plausible/Incomplete): Validates classification of Redis locks while withholding DB idempotency credit.
  - `Fixture E` (Ambiguous): Validates conservative `unclear` classification.
- **Transparent Credential Reporting**: Securely inspects environment variables (`LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`) without leaking secrets. When unconfigured, it reports instructions for `.env.local` without fabricating model responses.

### 8.2 Recorded Demo Mode & Essential Honesty Rule (`data/recorded/`)
To guarantee presentation reliability during the Talent Nation AI Rebuild Challenge (Demo Day October 21) without falsifying live evaluations:
- **Strict Associativity**: Recorded AI outputs are strictly bound to authentic benchmark inputs (`Fixture A`). Trace **never** shows recorded AI evaluations for arbitrary user answers.
- **Prominent Labeling**: Every recorded session visibly displays a prominent badge: `RECORDED SESSION` in both the top navigation bar, the review banner, and Section B.
- **Activation Paths**: Activated via URL query parameters (`?demo=1`), manual click ("Replay recorded example"), or as a non-destructive fallback option during provider errors.

### 8.3 Invariant-Guarded Session Persistence (`lib/storage.ts`)
Trace uses `sessionStorage` to prevent accidental browser refreshes from wiping progress while preventing state tampering:
- **Zero Hydration Inconsistencies**: Storage is loaded on client mount (`useEffect`), preventing SSR server/client mismatches.
- **Progression Invariant Sanitization (`sanitizeRestoredState`)**: Enforces prerequisite gates upon restoration:
  - Step 2 requires `mitigationLocked && mitigation.length >= 20`
  - Step 3 requires `lineCheckAttempts >= 1`
  - Step 4 requires `fixSubmitted && fix.length >= 30`
  - Step 5 requires a recognized `confirmedApproach`
  - Review requires `defenseSubmitted && defense.length >= 20`
- **Clean Reset**: Executing "Try again" (`RESET`) automatically purges storage keys (`clearExerciseSession`), restoring a clean slate.


