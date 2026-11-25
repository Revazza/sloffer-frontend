# sloffer-frontend

React web UI for **Sloffer**: lists recent .NET jobs in EMEA from the [backend](https://github.com/revazza/sloffer-backend), best matches first, with the reasons behind each score.

- **Jobs** (`/`): by default only **Excellent** matches (score 75+) from the last 24 hours, best first, up to 100 on one page. Filters: text, location, source, minimum score (Excellent / Good / Maybe / Any), sort (best match / newest), posted within (24 h / 3 days / 7 days), duplicates and **hide viewed**. Each job shows its score with its band, its source (a small text monogram and the name; no third-party logos), and a **Viewed** chip once its posting was opened. Filters live in the URL, so a filtered list can be bookmarked or shared and survives a refresh.
- **Job detail** (`/jobs/:id`): full (sanitized) description, all score reasons, source, posted date and a link to the original posting. A job is marked viewed (stored in the backend) when you click its link to the original posting, from the list ("Open posting") or the detail page; the detail page also has a "Mark as viewed / not viewed" button.

## Run backend and frontend together

1. Backend (in `../sloffer-backend`, see its README for first-time DB setup):
   ```bash
   dotnet ef database update --project src/Sloffer.Data   # apply migrations
   dotnet run --project src/Sloffer.Jobs                  # fetches and scores jobs (leave running, or run once)
   dotnet run --project src/Sloffer.Api                   # http://localhost:5010
   ```
2. Frontend (here):
   ```bash
   npm ci
   npm run dev    # http://localhost:5173, proxies /api to http://localhost:5010 (override with SLOFFER_API_URL)
   ```

Other commands: `npm test`, `npm run lint`, `npm run build`, and `npm run api:generate` (regenerates `src/api/schema.d.ts` from the running API's OpenAPI document; uses a pinned `openapi-typescript` through `npx` because it needs TypeScript 5 and this repo is on 7).

See `CLAUDE.md` for layout and conventions. Job data comes from [Jobicy](https://jobicy.com), [Arbeitnow](https://www.arbeitnow.com), [Remotive](https://remotive.com) and [Remote OK](https://remoteok.com); links to them and to each original posting are followed links without `noreferrer`, as their terms ask.
