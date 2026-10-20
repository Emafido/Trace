# Trace — Build Log

## Phase 1: Foundation and Static UI (Completed)

### Summary
Built the initial application foundation for **Trace** using Next.js 15 App Router, TypeScript (strict), Tailwind CSS 4, and Bun runtime and package manager. Configured the design token system for a calm production incident console, built the Library screen (`/`), structured the public vs. private incident data architecture, built the Workspace shell (`/challenge/duplicate-payment`) with a 55/45 split, 3 evidence tabs (`deploy.diff`, `telemetry.log`, `context.md`), interactive line-selectable diff viewer, and the 5-step progressive disclosure stepper.

---

### Files Created & Modified
- `package.json` — Configured project metadata, Bun development scripts (`bun --bun next dev`, `vitest run`, `bun scripts/eval.ts`), and dependencies (`zod`, `lucide-react`, `vitest`).
- `tsconfig.json` — Enabled strict TypeScript and root `@/*` path mapping.
- `app/globals.css` — Configured design tokens for dark production console (`#0B0D10` background, `#12151A` surface, `#262B33` border, diff tints, amber selection highlight, 120–180ms calm transitions, and visible 2px amber focus indicators).
- `app/layout.tsx` — Embedded `next/font/google` for Inter (UI) and JetBrains Mono (code/logs), dark mode styling, and page metadata.
- `app/page.tsx` — Screen 1: Library page with Trace wordmark, incident card, and verified badge.
- `app/challenge/[id]/page.tsx` — Screen 2 dynamic route rendering the incident workspace.
- `data/incidents/duplicate-payment.ts` — Incident 1 dataset with strict boundary between client-safe public fields (`publicIncident`) and server-side evaluation answer keys (`serverIncidentData`).
- `components/workspace/DiffViewer.tsx` — Accessible, keyboard-navigable diff viewer with semantic row buttons, `aria-pressed`, and line-level selection indicators.
- `components/workspace/TelemetryViewer.tsx` — Dark terminal output viewer with syntax/metric tinting and internal scrolling.
- `components/workspace/ContextViewer.tsx` — Technical specification and architecture context viewer.
- `components/workspace/EvidencePane.tsx` — Left pane container hosting active incident alert and tab navigation.
- `components/workspace/StepperPane.tsx` — Right pane container hosting the 5-step progressive disclosure stepper (Mitigate, Find the fault, Fix, Confirm approach, Defend) with collapsible history.
- `components/workspace/WorkspaceShell.tsx` — 55/45 desktop split and mobile stacked responsive layout.
- `bun.lock` — Committed Bun lockfile.

---

### Design Skills Applied
1. **`frontend-design` (Anthropic)**:
   - **Calm Production Console Theme**: Avoided generic AI SaaS tropes (no neon gradients, decorative cards, or oversized marketing heroes). Implemented a restrained dark console theme (`#0B0D10` bg, `#12151A` surface, `#262B33` border).
   - **Typography Hierarchy**: Distinct roles for Inter (body/headings with optical sizing) and JetBrains Mono (diffs, telemetry, metadata). Body line height 1.6, code line height 1.5.
   - **Information Density & Restraint**: Evidence pane prioritizes code clarity, line numbers, and readable diffs without decorative clutter.
   - **Copywriting**: Active voice, sentence case, clear technical framing from a site reliability/backend developer perspective.

2. **`apple-design` (Emil Kowalski)**:
   - **Feedback & State Transitions**: Transitions restricted to 120–180ms ease-out (`cubic-bezier(0, 0, 0.2, 1)`).
   - **Accessibility & Focus**: Implemented high-contrast 2px amber (`#F5A524`) visible focus rings on all interactive elements.
   - **Motion Respect**: Added `@media (prefers-reduced-motion: reduce)` rules across all animations and transitions.

3. **`web-design-guidelines` (Vercel)**:
   - **Semantic Elements**: Full `<button type="button">`, `role="tab"`, `role="tablist"`, `role="region"`, `aria-selected`, `aria-pressed`, and `aria-label` implementations.
   - **Responsive Discipline**: Self-contained internal scrolling on code and logs to prevent layout shifts and horizontal viewport blowout.

---

### Major Technical Decisions
- **Bun Exclusivity**: Scaffolding, dependency management, and script execution strictly use Bun 1.3.12.
- **Architectural Separation of Data**: Placed secret answer keys (faulty lines `[9, 10]`, partial line `11`, rubric items, follow-up trees) in server-scoped exports to prevent leaking answers into client browser bundles.
- **Pure CSS Layout**: Avoided heavyweight animation libraries like Framer Motion, adhering to native CSS transitions for lightweight performance and zero dependency overhead.

---

### Problems Encountered, Root Causes & Fixes
1. **Package Name Restriction During Scaffolding**:
   - *Problem*: `bun create next-app@15 .` failed because the folder name was `Trace` (capitalized).
   - *Root Cause*: npm package naming standards reject capital letters.
   - *Fix*: Initialized with `trace-app` and moved files cleanly into the workspace root.
2. **JSX Ternary Syntax in Collapsed Step Summary**:
   - *Problem*: `bun run build` encountered a compile error in `StepperPane.tsx`.
   - *Root Cause*: Missing alternative branch in a ternary operator for the Chevron icon.
   - *Fix*: Added the complete `: (<ChevronDown ... />)` branch.
3. **ESLint Unused Variable Warnings**:
   - *Problem*: `textClass` in `DiffViewer.tsx` and `HelpCircle` in `StepperPane.tsx` failed strict ESLint check.
   - *Root Cause*: Unused declarations left during component assembly.
   - *Fix*: Removed unused variables and imports, achieving a clean compile.

---

### Verification & Testing Performed
- **Runtime Check**: `bun --version` verified as `1.3.12`.
- **Production Build**: `bun run build` passed with exit code 0; generated `/`, `/_not-found`, and `/challenge/[id]`.
- **Browser Subagent Walkthrough**:
  - Verified Library page layout, title, and "Start incident" CTA.
  - Verified navigation to `/challenge/duplicate-payment`.
  - Verified alert banner, evidence tab switching (`deploy.diff`, `telemetry.log`, `context.md`), and diff line selection highlights.
  - Verified 5-step stepper UI, validation counters, approach selection, and collapsible history cards.
  - Verified responsive containers without horizontal page overflow.

---

## Phase 1 Audit & Hardening (Completed)

### Checks Completed
1. **Check A — Production Build**:
   - Diagnosed Next.js 15 build stalling on Windows during linting under Bun runtime (`bun --bun next build`) due to flat config worker thread resolution.
   - Configured `eslint: { ignoreDuringBuilds: true }` in `next.config.ts`. Verified `bun run build` cleanly compiles, type-checks, and outputs production bundles with exit code 0.
2. **Check B — Answer-Key Security**:
   - Refactored `data/incidents/duplicate-payment.ts` to strictly export public, client-safe fields (`publicIncident`, `DiffLine`, `PublicIncident`).
   - Relocated all secret evaluation data (`faultyLines`, `partialLines`, line explanations, rubric items, follow-up trees, reference solution) to a protected server module: `data/server/incidents/duplicate-payment.ts`.
   - Created server-only incident registry: `data/server/incidentRepository.ts`.
3. **Check C — Remove Temporary Stage-Jump Controls**:
   - Removed S1–S5 dev jump buttons from the StepperPane footer.
   - Converted header stepper dots to unclickable progression indicators with semantic `role="progressbar"`.
   - Enforced unskippable sequential progression: Step 1 mitigation lock requires >= 20 chars; Step 2 fault line advancement requires >= 1 line check; Step 3 fix submission requires >= 30 chars.
4. **Check D — Architecture Documentation**:
   - Created `ARCHITECTURE.md` documenting tech stack rationale (Next.js, TypeScript, Bun, Zod, no database), 5-step state machine, public/private boundary, and division of responsibility.
5. **Check E — Existing Design Preservation**:
   - Preserved calm production dark console aesthetic (`#0B0D10` bg, `#12151A` surface, `#262B33` border, `#F5A524` amber accent), typography, and responsive 55/45 split.

---

## Phase 2: Deterministic Solving Logic (Completed)

### Summary
Transformed the static workspace into a functional, deterministic engineering incident exercise. Built a pure React state machine (`useReducer`), implemented server-side line validation via `/api/check-line`, connected Step 1 mitigation containment, Step 2 diff line selection with server verification, first-attempt accuracy tracking, Step 3 permanent fix submission, and automated evidence tab navigation.

---

### Files Created & Modified
- `data/server/incidents/duplicate-payment.ts` — Private server-side incident definition containing answer keys (`faultyLines: [9, 10]`, `partialLines: [11]`), authoritative explanations, rubric, and reference solution.
- `data/server/incidentRepository.ts` — Server-side registry providing secure incident resolution by ID.
- `data/incidents/duplicate-payment.ts` — Stripped of all private keys; exports only client-safe metadata, diff lines, telemetry, and context.
- `lib/lineChecker.ts` — Pure, zero-dependency deterministic function `checkLine(selectedLine, faultyLines, partialLines): 'correct' | 'partial' | 'incorrect'`.
- `lib/exerciseReducer.ts` — Pure `useReducer` state machine managing the full exercise lifecycle, validation gates, and immutable first-attempt tracking.
- `app/api/check-line/route.ts` — Server endpoint validating incident ID and line selection via Zod; invokes server incident repository and returns deterministic status with explanation.
- `components/workspace/StepperPane.tsx` — Integrated with `exerciseReducer`, server verification call, character length counters, collapsible completed step summaries, and clean Phase 3 placeholder.
- `components/workspace/WorkspaceShell.tsx` — Hosts exercise state machine; binds tab switching and line selection; passes verified line results to `EvidencePane`.
- `vitest.config.mts` — Vitest configuration with root path alias resolution.
- `tests/line-checker.test.ts` — Unit tests for line 9 (correct), line 10 (correct), line 11 (partial), line 5 (incorrect), and out-of-bound lines.
- `tests/exercise-reducer.test.ts` — Unit tests for state transitions, validation boundaries, progression guards, and first-attempt preservation.
- `tests/api-check-line.test.ts` — API boundary integration tests for `/api/check-line` with valid and invalid payloads.
- `ARCHITECTURE.md` — One-page comprehensive architecture document.

---

### Major Technical Decisions
- **Pure Functional Reducer**: `exerciseReducer` and `checkLine` are isolated from React and DOM, allowing 100% unit test coverage in Vitest without mocking DOM components.
- **Immutable First-Attempt Accuracy**: If a learner checks line 5 (incorrect) and subsequently line 9 (correct), `firstLineAttemptCorrect` remains `false` while `lineCheckAttempts` tracks total checks.
- **Zero Client-Side Leakage**: The browser bundle for `/challenge/[id]` has zero access to `faultyLines` or reference solutions; all line checks go through `/api/check-line`.

---

### Verification & Testing Results
- **Vitest Unit & Integration Suite**:
  - `tests/line-checker.test.ts` (6 tests passed)
  - `tests/exercise-reducer.test.ts` (12 tests passed)
  - `tests/api-check-line.test.ts` (7 tests passed)
  - Total: **25 tests passed in 862ms** with exit code 0.
- **Production Build (`bun run build`)**:
  - Cleanly compiled in 21.5s with exit code 0.
  - Generated all static and dynamic routes:
    - `○ /` (Static)
    - `○ /_not-found` (Static)
    - `ƒ /api/check-line` (Dynamic API Route)
    - `ƒ /challenge/[id]` (Dynamic Workspace)

---

### Phase 2 Acceptance Criteria Verification
1. Open incident `/challenge/duplicate-payment` -> Loads public incident with read-only diff, telemetry, and context.
2. Step 1 Mitigation -> Requires >= 20 characters; "Lock in mitigation" button locks text, saves in reducer, advances to Step 2, and automatically switches active tab to `deploy.diff`.
3. Step 2 Fault Inspection -> Clicking any line in `deploy.diff` updates selection; clicking "Check my line" sends request to `/api/check-line` on the server and displays authoritative explanation.
4. First-attempt tracking -> If line 5 checked first, `firstLineAttemptCorrect = false`; if line 9 checked next, `firstLineAttemptCorrect` remains `false`.
5. Progression enabled -> Once at least 1 line check is made, "Proceed to Step 3: Permanent Fix" is enabled (regardless of line correctness).
6. Step 3 Permanent Fix -> Monospace textarea requiring >= 30 characters; "Submit fix" button saves response in reducer and advances to Step 4.
7. Step 4 Placeholder -> Cleanly presents submitted fix and states Phase 3 classification readiness without fabricating AI output.
8. Zero LLM calls invoked throughout Steps 1–3.

---

## Phase 3: AI Fix Classification & Follow-up Defense (Completed)

### Summary
Implemented Steps 4 and 5 of the Trace investigation console. Built a resilient server-side LLM client (`lib/llm.ts`) with typed errors, 20-second timeout, and structured Zod output validation with one retry. Built the fix classifier engine (`lib/fixClassifier.ts`) with prompt injection protection. Implemented `/api/classify` supporting single-operation LLM classification and zero-LLM follow-up retrieval on learner override. Connected the interactive Step 4 interpretation confirmation flow, manual correction picker, and Step 5 prewritten trade-off defense.

---

### Files Created & Modified
- `lib/llm.ts` — Server-side structured LLM caller with native fetch, temperature 0, 20s timeout, Zod validation, single-retry correction, and typed errors (`LLMConfigError`, `LLMTimeoutError`, `LLMSchemaError`).
- `lib/fixClassifier.ts` — Categorization logic mapping fixes into 6 categories (`row_lock`, `redis_lock`, `unique_constraint`, `app_cache`, `other`, `unclear`), with untrusted delimiter protection and $\le 25$ words reason truncation.
- `app/api/classify/route.ts` — Dual-action endpoint: `classify` executes exactly one LLM call and attaches prewritten follow-up; `confirm` resolves branch questions without calling the model.
- `lib/exerciseReducer.ts` — Extended state machine with classification loading, success, failure, override, source tracking (`ai` vs `manual`), defense argument, and transition to `'review'`.
- `components/workspace/StepperPane.tsx` — Integrated Step 4 loading states ("Reading your fix…"), AI interpretation badge, "Yes, that's right" / "Not quite" override flow, manual fallback picker, Step 5 prewritten defense textarea, and investigation review ready state.
- `tests/fix-classifier.test.ts` — 11 unit tests covering word truncation, untrusted boundary tags, valid category mappings, all 5 required prompt scenarios with mocked LLM, and error propagation.
- `tests/api-classify.test.ts` — 11 integration tests covering zero-LLM confirmation across all branches, valid classification, timeouts, unconfigured keys, and malformed inputs.
- `tests/exercise-reducer-phase3.test.ts` — 10 unit tests for Phase 3 state transitions, override source tracking, and non-destructive error recovery.
- `ARCHITECTURE.md` — Updated with Section 6 documenting Phase 3 architecture and trade-offs.

---

### Major Technical Decisions
- **Single LLM Operation**: Only the initial fix interpretation makes an LLM call. All follow-up questions are curated server-side assets retrieved deterministically.
- **Zero-LLM Override Resolution**: When a learner corrects the AI classification, `/api/classify` with `action: 'confirm'` retrieves the corresponding prewritten branch question directly from server incident data without making a second LLM call.
- **Explicit Source Attribution**: The state machine and UI strictly track whether the confirmed approach came from `ai` or `manual`, preventing manual selections from ever being falsely labeled as AI interpretation.
- **Fail-Safe Manual Fallback**: If the LLM provider fails, times out, or lacks credentials, the user is never blocked: they are presented with an inline error, retry button, and an explicit manual category selector that allows seamless progression to Step 5.

---

### Verification & Testing Results
- **Vitest Unit & Integration Suite**:
  - `tests/line-checker.test.ts` (6 tests passed)
  - `tests/exercise-reducer.test.ts` (12 tests passed)
  - `tests/api-check-line.test.ts` (7 tests passed)
  - `tests/fix-classifier.test.ts` (11 tests passed)
  - `tests/api-classify.test.ts` (11 tests passed)
  - `tests/exercise-reducer-phase3.test.ts` (10 tests passed)
  - Total: **57 tests passed (100% pass rate)**.
- **Production Build (`bun run build`)**:
  - Compiled successfully with exit code 0.
  - Route manifest generated:
    - `○ /` (Static)
    - `○ /_not-found` (Static)
    - `ƒ /api/check-line` (Deterministic line validation API)
    - `ƒ /api/classify` (Fix classification & follow-up API)
    - `ƒ /challenge/[id]` (Interactive workspace)
- **ESLint Audit**:
  - Executed standalone linter via `bun run ./node_modules/eslint/bin/eslint.js`.
  - Resolved 2 unused variable warnings in `StepperPane.tsx`. Verified 0 errors and 0 warnings across project codebase.

---

## Phase 4: Evidence-Backed Engineering Feedback (Completed)

### Summary
Completed Trace's central differentiation: structured, evidence-backed engineering feedback that visibly separates deterministic truth (**CHECKED BY CODE**) from subjective inference (**INTERPRETED BY AI**). Built the post-LLM deterministic quote verification engine (`lib/verify.ts`) to ensure credit is only granted when cited quotations genuinely exist in learner submissions. Implemented the server-side review route (`/api/review`) with single-LLM evaluation against a 4-item rubric and zero-hallucination reference loading. Built the interactive Review Screen with quote highlighting, authoritative reference comparisons, transparent user disclaimers, and clean session reset.

---

### Files Created & Modified
- `lib/verify.ts` — Deterministic quote verification engine with `normalize()`, `verifyQuote()` ($\ge 10$ chars requirement), `findQuoteRange()` regex-safe offset calculation, and `findQuoteInLearnerAnswers()`.
- `lib/reviewEvaluator.ts` — 4-item rubric schema (`r1`–`r4`), prompt injection protection with untrusted boundary tags, 25-word note truncation, and `enforceQuoteVerification()` credit revocation for fabricated or missing quotes.
- `app/api/review/route.ts` — Authoritative server-side evaluation route. Validates input bounds via Zod, looks up server-side rubric and reference solution, invokes evaluation pipeline, and returns verified review with zero client-side leakage.
- `lib/exerciseReducer.ts` — Extended state machine with `START_REVIEW`, `REVIEW_SUCCESS`, `REVIEW_FAILED`, `RETRY_REVIEW`, `SELECT_RUBRIC_ITEM`, and `RESET`.
- `components/workspace/ReviewScreen.tsx` — Final review state rendering:
  - **Section A (Checked by Code)**: Selected line from diff, status badge, first-attempt accuracy, and curated explanation.
  - **Section B (Interpreted by AI)**: 4 rubric items (`r1` mitigation, `r2` root cause, `r3` permanent fix, `r4` data repair), status badges (`CAUGHT` `#3FB950`, `PARTIAL` `#D29922`, `MISSED` `#F85149`), concise note, and click-to-highlight citation locator.
  - **Section C (Your Answers vs Reference Solution)**: 5-part comparison (mitigation, root cause, permanent fix + DDL, trade-off defense, existing data repair SQL) with dynamic quotation highlighting via `<HighlightableText>`.
  - **Footer**: AI limitation disclaimer and "Try again" button dispatching state `RESET`.
- `components/workspace/StepperPane.tsx` — Integrated Step 5 submission auto-trigger, evaluation loading state, error retry card, and ReviewScreen.
- `tests/verify-quote.test.ts` — 20 unit tests for quote verification, normalization, whitespace variances, smart quotes, empty, short, and highlighting offsets.
- `tests/rubric-verification.test.ts` — 11 unit tests for 4-item rubric validation, duplicate/missing/unknown IDs, post-LLM quote revocation, and prompt injection defense.
- `tests/api-review.test.ts` — 8 integration tests for `/api/review` endpoint.
- `tests/exercise-reducer-phase4.test.ts` — 7 unit tests for Phase 4 reducer extensions.
- `ARCHITECTURE.md` — Updated with Section 7 documenting Phase 4 architecture and quote verification engine.

---

### Verification & Testing Results
- **Vitest Unit & Integration Suite**:
  - `tests/line-checker.test.ts` (6 tests passed)
  - `tests/exercise-reducer.test.ts` (12 tests passed)
  - `tests/api-check-line.test.ts` (7 tests passed)
  - `tests/fix-classifier.test.ts` (11 tests passed)
  - `tests/api-classify.test.ts` (11 tests passed)
  - `tests/exercise-reducer-phase3.test.ts` (10 tests passed)
  - `tests/verify-quote.test.ts` (20 tests passed)
  - `tests/rubric-verification.test.ts` (11 tests passed)
  - `tests/api-review.test.ts` (8 tests passed)
  - `tests/exercise-reducer-phase4.test.ts` (7 tests passed)
  - Total: **103 tests passed (100% pass rate across 10 test suites)**.
- **Standalone ESLint Audit**:
  - Audited all TypeScript/React source files across `app`, `components`, `data`, `lib`, and `tests`.
  - Clean audit: **0 errors, 0 warnings**.
- **Production Build (`bun run build`)**:
  - Compiled successfully with exit code 0.
  - All routes generated: `/`, `/_not-found`, `/api/check-line`, `/api/classify`, `/api/review`, `/challenge/[id]`.

---

## Phase 5: Live AI Reliability, Demo Mode & Final Testing (Completed)

### Summary
Hardened Trace for Demo Day (October 21, 2026). Created a comprehensive live AI evaluation harness (`scripts/eval.ts`) running the real classification and review pipelines against 5 curated benchmarks (Strong, Weak, Prompt Injection, Plausible/Incomplete, and Ambiguous). Created authentic recorded session fixtures under `data/recorded/` and wired transparent demo replay mode (`DEMO_MODE=1`, `?demo=1`, or inline replay controls) strictly bound to authentic inputs. Built invariant-guarded session persistence via `sessionStorage` (`lib/storage.ts`) surviving page refreshes without SSR hydration issues or step-skipping exploits. Delivered polished error states, non-destructive retries, accessible input hints, and reduced-motion compliance.

---

### Files Created & Modified
- `scripts/eval.ts` — Live AI evaluation harness (`bun run eval`) testing Fixtures A through E against live endpoints, reporting terminal tables with quote verification and pass/fail metrics, and providing configuration guidance when credentials are unconfigured.
- `data/recorded/duplicate-payment.ts` — Authentic recorded fixture session based on Fixture A (Strong Engineering Response) for presentation reliability.
- `lib/storage.ts` — Session persistence module using `sessionStorage` with progression invariant sanitization (`sanitizeRestoredState`) and clean reset purging.
- `lib/exerciseReducer.ts` — Added `isRecordedSession`, `recordedFixtureName`, and actions `LOAD_SAVED_SESSION` and `LOAD_RECORDED_SESSION`.
- `components/workspace/WorkspaceShell.tsx` — Integrated session persistence mount/sync hooks, `?demo=1` parameter detection, and header demo indicator/controls.
- `components/workspace/StepperPane.tsx` — Added "Replay recorded example" fallback buttons to Step 4 and Review error cards, and added recorded mode status bar indicator.
- `components/workspace/ReviewScreen.tsx` — Prominently displays `RECORDED SESSION` badges in top review banner and Section B header.
- `tests/persistence.test.ts` — 8 unit tests for `sessionStorage` saving/loading, JSON corruption handling, and invariant enforcement across all steps.
- `tests/demo-mode.test.ts` — 5 unit tests for recorded session schema, verbatim quote presence across all 4 criteria, state loading, and honest input isolation.
- `tests/error-recovery.test.ts` — 8 unit tests for non-destructive error states, classification/review retry preservation, manual fallback, and edit locking.
- `ARCHITECTURE.md` — Updated with Section 8 documenting evaluation harness, demo mode honesty, and session storage architecture.

---

### Verification & Testing Results
- **Vitest Unit & Integration Suite**:
  - `tests/line-checker.test.ts` (6 tests passed)
  - `tests/exercise-reducer.test.ts` (12 tests passed)
  - `tests/api-check-line.test.ts` (7 tests passed)
  - `tests/fix-classifier.test.ts` (11 tests passed)
  - `tests/api-classify.test.ts` (11 tests passed)
  - `tests/exercise-reducer-phase3.test.ts` (10 tests passed)
  - `tests/verify-quote.test.ts` (20 tests passed)
  - `tests/rubric-verification.test.ts` (11 tests passed)
  - `tests/api-review.test.ts` (8 tests passed)
  - `tests/exercise-reducer-phase4.test.ts` (7 tests passed)
  - `tests/persistence.test.ts` (8 tests passed)
  - `tests/demo-mode.test.ts` (5 tests passed)
  - `tests/error-recovery.test.ts` (8 tests passed)
  - Total: **124 tests passed (100% pass rate across 13 test suites)**.
- **Standalone ESLint Audit**:
  - Audited all TypeScript/React source files across `app`, `components`, `data`, `lib`, `scripts`, and `tests`.
  - Clean audit: **0 errors, 0 warnings**.
- **Production Build (`bun run build`)**:
  - Compiled successfully with exit code 0.
  - All routes generated: `/`, `/_not-found`, `/api/check-line`, `/api/classify`, `/api/review`, `/challenge/[id]`.
- **Evaluation Harness (`bun run eval`)**:
  - All 5 fixtures verified and reporting correctly.



