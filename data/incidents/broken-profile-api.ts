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

export const brokenProfilePublicIncident: PublicIncident = {
  id: 'broken-profile-api',
  title: 'The Profile Page That Stopped Working',
  role: 'Full-stack',
  type: 'Debugging',
  difficulty: 'Beginner',
  skills: ['API Design', 'Backward Compatibility', 'Incident Triage'],
  isRecommended: true,
  estimatedMinutes: 7,
  summary:
    'After a deployment, users can no longer open their profiles. The API appears healthy, but profile requests keep failing.',
  alert:
    "09:07 · Support reports that users can't open their profiles after the 09:00 deployment. API error rates look normal, but profile requests are failing.",
  contextMarkdown: `### Service Overview
- **Service:** \`users-service\`
- **Stack:** Node.js, Express, TypeScript (backend), React (frontend)
- **Deployment:** PR #248 refactored the profile routes.
- **Recent Change:** Renamed \`/api/profile\` to \`/api/users/me\`.

### System Invariants & Behavior
- The Express router is mounted at \`/\` in \`app.ts\`.
- Authentication middleware and profile data handler (\`getProfile\`) are working correctly.
- The new endpoint \`/api/users/me\` passes health and smoke tests.
- The frontend client (\`src/client/profileApi.ts\`) still makes requests to \`/api/profile\`.
- **Client Cache Behavior:** Existing browser sessions may continue executing cached JavaScript bundles after a deployment.
- **Requirement:** Users must be able to load their profile throughout the migration.
- The old endpoint \`/api/profile\` no longer exists on the backend and returns HTTP 404.`,
  diffLines: [
    { lineNum: 1, type: 'ctx', prefix: ' ', text: '// src/server/routes/profile.ts' },
    { lineNum: 2, type: 'ctx', prefix: ' ', text: '// Router is mounted at "/" in app.ts' },
    { lineNum: 3, type: 'ctx', prefix: ' ', text: 'import { Router } from "express";' },
    { lineNum: 4, type: 'ctx', prefix: ' ', text: 'import { authenticate } from "../middleware/auth";' },
    { lineNum: 5, type: 'ctx', prefix: ' ', text: 'import { getProfile } from "../handlers/profile";' },
    { lineNum: 6, type: 'ctx', prefix: ' ', text: 'const router = Router();' },
    { lineNum: 7, type: 'del', prefix: '-', text: 'router.get("/api/profile", authenticate, getProfile);' },
    { lineNum: 8, type: 'add', prefix: '+', text: 'router.get("/api/users/me", authenticate, getProfile);' },
    { lineNum: 9, type: 'ctx', prefix: ' ', text: 'export default router;' },
    { lineNum: 10, type: 'ctx', prefix: ' ', text: '// src/client/profileApi.ts (unchanged)' },
    { lineNum: 11, type: 'ctx', prefix: ' ', text: 'export async function loadProfile() {' },
    { lineNum: 12, type: 'ctx', prefix: ' ', text: '  const response = await fetch("/api/profile");' },
    { lineNum: 13, type: 'ctx', prefix: ' ', text: '  if (!response.ok) throw new Error("Profile failed to load");' },
    { lineNum: 14, type: 'ctx', prefix: ' ', text: '  return response.json();' },
    { lineNum: 15, type: 'ctx', prefix: ' ', text: '}' },
  ],
  telemetryLog: `09:00:02 INFO deployment PR#248 completed
09:00:05 INFO backend healthcheck status=200
09:03:11 WARN GET /api/profile status=404
09:03:12 INFO GET /api/users/me status=200
09:03:17 WARN GET /api/profile status=404
09:03:20 WARN GET /api/profile status=404

--- metrics: last 10 minutes ---
GET /api/profile: 937 requests, 94% HTTP 404
GET /api/users/me: 16 requests, 100% HTTP 200
HTTP 500 errors: 0
Support tickets: 23 profile access failures`,
  approachCategories: [
    {
      id: 'dual_route',
      name: 'Backward-compatible route',
      description: 'Keep both /api/profile and /api/users/me working using the same handler while clients migrate.',
    },
    {
      id: 'restore_old_route',
      name: 'Rollback / restore previous endpoint',
      description: 'Roll back or revert PR #248 to keep /api/profile as the active endpoint.',
    },
    {
      id: 'client_update',
      name: 'Frontend-only update',
      description: 'Update the frontend to use /api/users/me without retaining backend compatibility.',
    },
    {
      id: 'redirect',
      name: 'Redirect old requests',
      description: 'Redirect /api/profile to /api/users/me at the HTTP level.',
    },
    {
      id: 'other',
      name: 'Another approach',
      description: 'A different technical strategy, such as API gateway path rewriting or proxy routing.',
    },
    {
      id: 'unclear',
      name: 'Unclear approach',
      description: 'Vague, ambiguous, or incomplete proposal without a clear mechanism.',
    },
  ],
  stepPrompts: {
    step1: {
      title: "It's 09:07 and users can't open their profiles after the 09:00 deployment. What do you do in the next two minutes to restore access before writing any code?",
      description: 'Be specific: what action, on what, and why it is safe.',
      placeholder: 'Describe your immediate mitigation action (e.g. roll back PR #248 or restore the /api/profile endpoint)...',
    },
    step2: {
      title: 'Select the faulty line in deploy.diff.',
      description: 'Click a line row in the diff pane on the left or use keyboard navigation to select it. Locate the line that broke backward compatibility for existing profile requests.',
    },
    step3: {
      title: "Explain the root cause and the fix you'd ship. Prose or code is fine.",
      description: 'Describe how your solution restores profile loading without breaking clients running cached frontend code.',
      placeholder: 'Example:\nI would support both /api/profile and /api/users/me on the backend using the same getProfile handler...',
    },
  },
};
