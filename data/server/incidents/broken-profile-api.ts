import {
  ServerIncident,
  RubricItem,
  FollowUpBranch,
  ReferenceSolution,
} from './duplicate-payment';

export type { ServerIncident, RubricItem, FollowUpBranch, ReferenceSolution };

export const serverBrokenProfileIncident: ServerIncident = {
  id: 'broken-profile-api',
  faultyLines: [8],
  partialLines: [12],
  generalExplanation:
    'Line 8 replaces the existing profile API route. However, the frontend still calls /api/profile on line 12. Because the backend no longer handles that URL, profile requests return 404. This deployment introduced a breaking API contract change.',
  lineExplanations: {
    correct:
      'Correct. Line 8 replaces the existing profile API route with /api/users/me without retaining backward compatibility for clients still calling /api/profile.',
    partial:
      'Partial match. Line 12 is where the frontend calls /api/profile, but this client code was unchanged in the deployment. The failure is caused by the backend breaking the contract on line 8.',
    incorrect:
      'Incorrect. This line is not the source of the broken profile requests. The breaking change is line 8 renaming the API endpoint without backward compatibility.',
  },
  rubric: [
    {
      id: 'r1',
      title: 'Immediate Mitigation',
      description:
        'Proposes an action to restore profile access quickly, such as rolling back the incompatible deployment, restoring the old endpoint, or deploying a compatibility alias.',
    },
    {
      id: 'r2',
      title: 'Root Cause',
      description:
        'Recognizes that the backend endpoint changed while the frontend still calls the old URL, causing 404 errors due to a broken API contract.',
    },
    {
      id: 'r3',
      title: 'Permanent Fix',
      description:
        'Proposes a compatible migration, such as keeping both API endpoints available through the same handler while clients migrate, or restoring the old route and coordinating a staged update with versioning/deprecation.',
    },
    {
      id: 'r4',
      title: 'Regression Prevention',
      description:
        'Proposes a practical way to avoid similar failures: API contract tests, integration tests covering actual frontend requests, backward compatibility checks, staged endpoint deprecation, or monitoring 404 rates for supported routes.',
    },
  ],
  followUpBranches: {
    dual_route: {
      id: 'dual_route',
      title: 'Backward-compatible route',
      question:
        "You keep both /api/profile and /api/users/me working. How would you know when it's safe to remove the old route?",
    },
    restore_old_route: {
      id: 'restore_old_route',
      title: 'Rollback / restore previous endpoint',
      question:
        'Rolling back restores the old endpoint. How would you introduce the new endpoint later without breaking existing users?',
    },
    client_update: {
      id: 'client_update',
      title: 'Frontend-only update',
      question:
        'You update the frontend to use /api/users/me. What happens to users who still have the older JavaScript bundle cached in their browsers?',
    },
    redirect: {
      id: 'redirect',
      title: 'Redirect old requests',
      question:
        'You redirect /api/profile to /api/users/me. What compatibility or caching issues would you check before choosing a permanent redirect?',
    },
    other: {
      id: 'other',
      title: 'Another approach',
      question:
        'Walk through what happens when an older frontend calls /api/profile after your proposed fix has been deployed.',
    },
    unclear: {
      id: 'unclear',
      title: 'Unclear approach',
      question:
        'Walk through what happens when an older frontend calls /api/profile after your proposed fix has been deployed.',
    },
  },
  referenceSolution: {
    mitigation:
      'Restore the previously working API route, or roll back the incompatible deployment while preparing a compatibility fix.',
    rootCause:
      'The backend renamed the endpoint without ensuring existing clients could still use the API. The frontend still requests /api/profile, so the server responds with 404.',
    permanentFix: [
      'Support both endpoints on the router using the existing handler:',
      'router.get("/api/profile", authenticate, getProfile);',
      'router.get("/api/users/me", authenticate, getProfile);',
      'Deploy the backend compatibility change so both old and new URLs succeed.',
      'Update frontend clients to call /api/users/me.',
      'Monitor telemetry for /api/profile traffic until old client requests drop to near zero.',
      'Add a deprecation header and remove the old route in a future scheduled release.',
    ],
    codeSnippet: `// Maintain dual routes during migration
router.get("/api/profile", authenticate, getProfile);
router.get("/api/users/me", authenticate, getProfile);`,
    tradeOffs: [
      {
        approach: 'Backward-compatible route',
        tradeOff:
          'Maintains temporary technical debt by running two routes; requires monitoring to know when old route traffic reaches zero before safely deprecating.',
      },
      {
        approach: 'Rollback / restore previous endpoint',
        tradeOff:
          'Restores service immediately with zero client risk, but delays the planned API cleanup until a backward-compatible rollout can be prepared.',
      },
      {
        approach: 'Frontend-only update',
        tradeOff:
          'Fails for users running cached single-page application bundles or mobile clients, causing ongoing 404 errors until their caches clear.',
      },
      {
        approach: 'Redirect old requests',
        tradeOff:
          'HTTP redirects (301/308) can cause issues with request methods, authorization headers, or unexpected client-side redirect handling.',
      },
    ],
    prevention: [
      'Implement API contract tests (e.g. Pact, OpenAPI spec validation) to detect breaking URL changes before merge.',
      'Run end-to-end integration tests that verify frontend client API calls against the live router.',
      'Adopt a formal API deprecation policy: never delete or rename an endpoint without a deprecation grace period.',
      'Set up automated post-deployment alerts for sudden spikes in HTTP 404 status codes on formerly active endpoints.',
    ],
    keyTakeaway:
      'A backend refactor can be locally correct but still break the application\'s overall contract with its clients. High-reliability engineering teams always treat public API changes as backward-compatible migrations.',
  },
};
