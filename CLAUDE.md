# sloffer-frontend

Vite + React + TypeScript web UI for Sloffer. Pipeline spec: `../SLOFFER_PIPELINE.md`. Backend: `../sloffer-backend`.

## Commands

```bash
npm ci              # install exactly what's in package-lock.json
npm run dev         # http://localhost:5173, proxies /api to the backend (http://localhost:5010)
npm test            # Vitest, runs once
npm run lint        # oxlint, must report 0 warnings
npm run build       # type-check (tsc -b) + production build
npm run api:generate  # regenerate src/api/schema.d.ts from the running backend's /openapi/v1.json
```

Before opening a PR, `npm run lint`, `npm test` and `npm run build` must all pass.

The backend must be running for `npm run dev` to show data: `dotnet run --project src/Sloffer.Api` in `../sloffer-backend`. Use `SLOFFER_API_URL` to point the proxy elsewhere.

## Layout

```
src/main.tsx            entry (BrowserRouter)
src/App.tsx             layout (header, footer with source credits) + routes: / and /jobs/:id
src/jobs/               jobs list page, job detail page, filters <-> URL logic, formatting
src/api/schema.d.ts     generated from the backend OpenAPI document (npm run api:generate); never edit by hand
src/api/*.ts            one file per backend resource: types (from schema.d.ts) + fetch functions
src/test/setup.ts       Vitest setup (jest-dom matchers, cleanup)
src/test/jobs.ts        test data builders + fetch mock
src/index.css           global styles + color variables (light/dark)
```

## Conventions

- **The API contract is the backend's OpenAPI document**, not plan text: `http://localhost:5010/openapi/v1.json` (backend running). Types in `src/api/` come from the generated `schema.d.ts`; regenerate and commit it after backend contract changes.
- All backend calls go through `src/api/*` using relative URLs (`/api/...`). Components never call `fetch` directly.
- Function components and hooks only. Keep state local until it really needs sharing; no state library. Routing: `react-router`; list filters live in the URL query string (`src/jobs/filters.ts`).
- TypeScript strictly typed: no `any`, no non-null `!` except the root element in `main.tsx`.
- Styling: plain CSS with the variables in `index.css`; support light and dark; must work on a phone screen.
- Job descriptions are third-party HTML: render them only through `DOMPurify.sanitize`.
- Tests: Vitest + Testing Library in `*.test.tsx` next to the component. Mock `fetch` with `vi.spyOn(globalThis, 'fetch')`. Query by role/text as a user would. Every change adds or updates tests.
- Don't add dependencies without a clear need; mention any new one in the PR.
- Git: work on a branch (`task/<clickupTaskId>-<slug>` for ClickUp tasks), open a PR, never push to or merge into main.
