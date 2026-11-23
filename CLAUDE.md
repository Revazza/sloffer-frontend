# sloffer-frontend

Vite + React + TypeScript web UI for Sloffer. Pipeline spec: `../SLOFFER_PIPELINE.md`. Backend: `../sloffer-backend`.

## Commands

```bash
npm ci              # install exactly what's in package-lock.json
npm run dev         # http://localhost:5173, proxies /api to the backend (http://localhost:5010)
npm test            # Vitest, runs once
npm run lint        # oxlint, must report 0 warnings
npm run build       # type-check (tsc -b) + production build
```

Before opening a PR, `npm run lint`, `npm test` and `npm run build` must all pass.

The backend must be running for `npm run dev` to show data: `dotnet run --project src/Sloffer.Api` in `../sloffer-backend`. Use `SLOFFER_API_URL` to point the proxy elsewhere.

## Layout

```
src/main.tsx         entry
src/App.tsx          the page (currently: backend health)
src/api/             one file per backend resource: types + fetch functions
src/test/setup.ts    Vitest setup (jest-dom matchers, cleanup)
src/index.css        global styles + color variables (light/dark)
```

## Conventions

- **The API contract is the backend's OpenAPI document**, not plan text: `http://localhost:5010/openapi/v1.json` (backend running). Types in `src/api/` must mirror it exactly.
- All backend calls go through `src/api/*` using relative URLs (`/api/...`). Components never call `fetch` directly.
- Function components and hooks only. Keep state local until it really needs sharing; no state library or router until there's a need.
- TypeScript strictly typed: no `any`, no non-null `!` except the root element in `main.tsx`.
- Styling: plain CSS with the variables in `index.css`; support light and dark.
- Tests: Vitest + Testing Library in `*.test.tsx` next to the component. Mock `fetch` with `vi.spyOn(globalThis, 'fetch')`. Query by role/text as a user would. Every change adds or updates tests.
- Don't add dependencies without a clear need; mention any new one in the PR.
- Git: work on a branch (`task/<clickupTaskId>-<slug>` for ClickUp tasks), open a PR, never push to or merge into main.
