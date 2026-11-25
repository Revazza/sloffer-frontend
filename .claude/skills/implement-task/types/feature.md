# Feature playbook (frontend)

New UI or behavior described by acceptance criteria.

1. Restate the goal and list the acceptance criteria. Read the existing components, routing, API layer and styles before writing anything; reuse what is there.
2. API access goes through one typed API layer (`src/api/`), typed from the backend contract. Components never call `fetch` directly. Handle non-2xx responses explicitly.
3. Every screen that loads data has loading, empty, error and data states. Errors show a readable message and a retry where it makes sense.
4. Sloffer's UI is a list of suggested jobs, each with a status, with filtering. Keep it clean and fast to scan: clear hierarchy, readable on mobile, keyboard-accessible controls, labels on inputs, sensible focus states. Always show the job's source name and link to the original posting.
5. Keep filter/status state predictable (URL query params for filters are preferred so views are shareable).
6. Tests: render and interaction tests for each acceptance criterion, plus loading/empty/error states. Mock the API layer; never call the real backend or external sites from tests.
