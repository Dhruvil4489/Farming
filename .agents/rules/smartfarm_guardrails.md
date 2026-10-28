# SmartFarm AI — Antigravity AI Coding Guardrails

These rules apply to every AI-assisted change made to this repository.
They are automatically discovered by Antigravity from this file's location.

---

## 1. Inspect Before Editing

- Read the complete target file before making any change.
- Check every file that imports the symbol you are editing.
- Do not assume function signatures, schema fields, or env var names from memory — verify in source.

## 2. Minimal Diffs Only

- Change only the lines required to fix the issue or implement the requested feature.
- Do not auto-format, rename, reorganise, or lint-fix unrelated lines in the same edit.
- One purpose per commit. Do not bundle unrelated fixes.

## 3. Preserve Stack and UI

- Do not upgrade frameworks, libraries, or tools unless explicitly instructed.
  - Current locked versions: Next.js 16.x, React 19, TypeScript 6, Prisma 6.4, Tailwind CSS 4.x.
- Do not change the design system colour tokens (`#143D2A`, `#2F7D4F`, `#7A5A3A`, `#FAF6EF`).
- Do not switch the database provider (SQLite dev / PostgreSQL prod) without explicit instruction.
- Do not remove existing Prisma model fields without explicit instruction and a migration plan.

## 4. No Fake / Live Data Conflation

This project has a verified audit finding where static seeded data is mislabelled:

- Never insert data into the database with `isDemo: false` unless the data came from a live
  verified external source at insertion time.
- If data is hardcoded or seeded, flag it as `isDemo: true` and set `source` to the actual
  script or inline constant (e.g., `"seed.mjs static reference"`).
- Do not display any value labelled as official, live, or real-time unless the fetch was
  confirmed successful at runtime and the response was parsed (not a hardcoded fallback).
- The AI Assistant at `/assistant` currently uses a `setTimeout` instead of an LLM call.
  Do not add provenance labels claiming AI analysis until a real LLM route is wired.

## 5. Validate All Server Inputs

- Every POST/PATCH/PUT route handler must validate the request body with a Zod schema before
  touching the database. Pattern already established in `farms/route.ts` and `fields/route.ts`.
- Never trust client-supplied IDs for ownership checks. Always join back to `userId` from the
  session, following the existing pattern in `fields/route.ts` lines 55-58.

## 6. Enforce Auth and RBAC on Every New Route

- Every route under `/api/v1/` that reads or writes user data must call `getAuthenticatedUser()`
  and return `apiError('Unauthorized', 'unauthorized', 401)` if the result is null.
- Routes that write resources (farms, fields, tasks, observations, orders) must verify ownership
  by joining through the user ID. Do not rely solely on the client-supplied resource ID.
- Public read routes (`/api/v1/market/prices`, `/api/v1/weather`) must not expose user-specific
  data.

## 7. No Secrets in Client Bundle or Logs

- Do not use the `NEXT_PUBLIC_` prefix for any key that is a secret, API key, JWT secret,
  or database connection string. All such keys must be server-only.
- Do not log `JWT_SECRET`, `MARKET_API_KEY`, `DATA_GOV_IN_API_KEY`, `SOIL_MOISTURE_API_KEY`,
  or `DATABASE_URL` to console or to any log file.
- Do not `console.log(request.headers)` or full request bodies that may contain auth tokens.

## 8. Add Tests for Every Fix

- When fixing a bug identified in `docs/SMARTFARM_RELEASE_PLAN.md`, add a corresponding test
  assertion to the relevant script in `scripts/` before considering the fix complete.
- Tests must use real HTTP calls to `localhost:3000` (consistent with the existing test style).
- Do not mark a test as passing without actually running it and recording the output.

## 9. Never Run Destructive Database Commands Without Explicit Approval

- The following commands must never be run without explicit written instruction from the user:
  - `prisma migrate reset`
  - `prisma db push --force-reset`
  - Any raw SQL `DROP TABLE`, `TRUNCATE`, or `DELETE FROM` without a `WHERE` clause.
  - `rm prisma/dev.db` or any deletion of database files.
- When proposing a schema change, always state: the models affected, whether existing rows will
  be preserved, and whether a data migration is required.

## 10. Report Actual Commands and Results

- Do not claim a command succeeded without showing its actual terminal output.
- Do not invent test results. If tests cannot be run (e.g., server not started), report the
  blocker clearly: "Tests could not be executed because the dev server is not running."
- If an external API call cannot be verified (no key, no network), say so explicitly.
  Do not assume the integration works based on the provider code alone.

---

## Key Audit Findings to Keep in Mind

These are code-level facts confirmed during the Phase 0 audit. Do not regress them:

| Finding | File | Line |
|---|---|---|
| AI assistant uses setTimeout, no LLM called | `src/app/(app)/assistant/page.tsx` | 36 |
| Hardcoded fallback JWT secret | `src/lib/auth.ts` | 8 |
| Admin Trigger Sync is a fake setTimeout | `src/app/admin/page.tsx` | 74 |
| Market data never calls AgmarknetProvider | `src/services/MarketDataService.ts` | 16-84 |
| Scouting saves to useState only | `src/app/(app)/scouting/page.tsx` | 30-41 |
| Irrigation saves to useState only | `src/app/(app)/irrigation/page.tsx` | 26-37 |
| Weather humidity index is always [0] (midnight UTC) | `src/providers/weather/OpenMeteoProvider.ts` | 15, 17 |
