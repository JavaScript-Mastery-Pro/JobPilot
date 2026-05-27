# Progress Tracker

Living document. Updated after every feature is completed. Claude reads this at the start of every session to know exactly where the build is and what comes next. Never start implementing without reading this file first.

---

## How to Use This File

At the start of every session:

- Read this file to understand current state
- Check current phase and next feature
- Read the relevant spec before implementing

After completing any feature:

- Mark it as complete with the date
- Update current phase if needed
- Add any decisions made or issues encountered
- Update next up

---

## Current Status

**Phase:** 7 — Dashboard
**Current feature:** 26 Dashboard incomplete profile banner
**Next up:** 26 Dashboard incomplete profile banner — if profiles.is_complete is false show banner with link to profile page, hide banner when complete
**Blocking issues:** None
**Latest completed addition:** 25a Manual job URL import via Browserbase — completed 2026-05-28

---

## Build Phases

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 InsForge auth
- [x] 03 Database schema

### Phase 2 — Profile

- [x] 04 Profile form
- [x] 05 Profile load
- [x] 06 Smart redirect
- [x] 07 Profile edit

### Phase 3 — Resume

- [x] 08 Resume generation
- [x] 09 Resume preview

### Phase 4 — Agent Core

- [x] 10 Browserbase setup
- [x] 11 Stagehand setup
- [x] 12 Google job discovery
- [x] 13 GPT-4o matching

### Phase 5 — Auto Apply

- [x] 14 Cover letter generation
- [x] 15 Apply agent
- [x] 16 AgentSpan wrapping
- [x] 16a Auto-apply readiness profile fields
- [x] 16b LinkedIn Test apply review boundary

### Phase 6 — Review Flow

- [x] 17 Review queue
- [x] 18 Job details page
- [x] 19 Resume tailoring
- [x] 20 Manual apply

### Phase 7 — Dashboard

- [x] 21 Agent controls
- [x] 22 Stats bar
- [x] 23 Live agent feed
- [x] 24 Browserbase session recording
- [x] 25 Auto-applied jobs table
- [x] 25a Manual job URL import via Browserbase
- [ ] 26 Dashboard incomplete profile banner

### Phase 8 — Analytics

- [ ] 27 PostHog setup
- [ ] 28 Analytics section

### Phase 9 — Deployment

- [ ] 29 Environment variables
- [ ] 30 Vercel deployment
- [ ] 31 Production smoke test

---

## Completed Features

### ✅ 01 Homepage — completed 2026-05-18
Notes: Built public homepage with fixed navbar, product UI hero preview, spacious how-it-works section, spacious feature cards, footer, and project token definitions in globals.css. Auth-aware routing remains for Feature 02.

### ✅ 02 InsForge auth — completed 2026-05-18
Notes: Installed `@insforge/sdk`, added OAuth-only Google/GitHub login, server-managed InsForge auth cookies, OAuth callback route, protected-route `proxy.ts`, auth-aware navbar, and minimal protected dashboard/profile stubs. Switched to a fresh InsForge backend project, configured the local OAuth callback allowlist, and verified OAuth redirects correctly end to end.

### ✅ 03 Database schema — completed 2026-05-18
Notes: Created the InsForge `profiles`, `agent_runs`, `jobs`, and `agent_logs` tables with constraints, indexes, owner-scoped RLS policies, and a `profiles` `updated_at` trigger. Created the private `resumes` storage bucket for generated and tailored resume PDFs. Verified all tables and the bucket through backend metadata and table schema checks.

### ✅ 04 Profile form — completed 2026-05-18
Notes: Built the authenticated `/profile` form with client-side validation, live completion indicator, skill tags, and a Server Action that creates or updates the current user's `profiles` row. Completion is core-only: LinkedIn and portfolio URLs are optional, but validated when present.

### ✅ 05 Profile load — completed 2026-05-18
Notes: `/profile` now loads the current user's existing `profiles` row server-side, normalizes it into `ProfileFormData`, and pre-fills the form for returning users. Missing profiles fall back to blank onboarding defaults with the auth email. Profile read failures show a tokenized error panel instead of an editable blank form.

### ✅ 06 Smart redirect — completed 2026-05-18
Notes: OAuth callback now checks the signed-in user's `profiles.is_complete` value after token exchange. Missing or incomplete profiles route to `/profile`; complete profiles can continue to a safe `next` path and otherwise default to `/dashboard`.

### ✅ 07 Profile edit — completed 2026-05-18
Notes: Existing profile save/load behavior already supported editing any field and recalculating `is_complete`; added edit-aware profile copy, update submit text, saved-profile success copy, and a dashboard CTA after a complete successful save.

### ✅ 08 Resume generation — completed 2026-05-19
Notes: Added GPT-4o base resume content generation, server-side PDF rendering with `@react-pdf/renderer`, upload to the private `resumes` bucket at `resumes/{user_id}/resume.pdf`, `profiles.resume_pdf_url` updates, an authenticated download route, and profile-page generate/download controls. Later upgraded the feature to collect resume evidence fields and block generation until enough real work/project/achievement material exists.

### ✅ 09 Resume preview — completed 2026-05-19
Notes: Added an authenticated inline PDF preview route for the private base resume, kept the attachment download route separate, and relabeled generation as regeneration once a resume exists. The generated PDF preview opens from a `/profile` preview button in a modal so the form stays compact, and the preview iframe refreshes after regeneration with a cache-busting query string.

### ✅ 10 Browserbase setup — completed 2026-05-19
Notes: Installed the approved Browserbase SDK, Stagehand package, and Zod dependency. Added server-only Browserbase session helpers in `lib/browserbase.ts` for env validation, session creation, recording URL derivation, release via `REQUEST_RELEASE`, and connection verification. Verified a real Browserbase session could be created with a connect URL and released successfully.

### ✅ 11 Stagehand setup — completed 2026-05-19
Notes: Added `lib/stagehand.ts` with server-only Stagehand initialization backed by Browserbase sessions, explicit GPT-4o/OpenAI key configuration, direct SDK execution with `disableAPI: true`, cleanup helpers, and a Zod-backed connection verification helper. Verified a live Browserbase Stagehand session could navigate to `https://example.com`, extract `Example Domain`, and close successfully.

### ✅ 12 Google job discovery — completed 2026-05-19, restructured 2026-05-19
Notes: Replaced the risky LinkedIn account-based discovery flow with Google/public web discovery. `/api/agent/find` no longer requires `profiles.linkedin_context_id`; it starts a run and calls `agent/google.ts`, which uses a fresh Browserbase + Stagehand session to search Google for company/ATS postings, filters blocked account-heavy job boards, verifies individual public job pages, saves valid external apply URLs as `found` jobs, and writes `agent_logs`. Removed `/profile` LinkedIn connection UI and deleted the LinkedIn connect/verify API routes. The legacy `jobs.linkedin_url` column is currently used as a source URL field until a later schema cleanup.

### ✅ 13 GPT-4o matching — completed 2026-05-19
Notes: Added `agent/matcher.ts` for GPT-4o scoring of discovered `found` jobs against the saved profile. `/api/agent/find` now runs matching immediately after Google/public discovery and returns matched/review/failed match counts. The matcher saves `match_score` and `match_reason`, routes scores at or above `MATCH_THRESHOLD` to `queued`, keeps below-threshold jobs as `found` for the later review queue, updates `agent_runs.jobs_matched` and `agent_runs.jobs_in_review`, and writes per-job `agent_logs`.

### ✅ 14 Cover letter generation — completed 2026-05-19
Notes: Added `agent/cover-letter.ts` for GPT-4o cover letter generation over queued jobs using saved profile data, job description, match context, and `profiles.cover_letter_tone`. `/api/agent/find` now runs cover letter generation immediately after matching and returns generated/failed cover letter counts. Generated letters are saved to `jobs.cover_letter`; per-job failures are logged, marked `failed`, and do not crash the batch.

### ✅ 15 Apply agent — completed 2026-05-20
Notes: Added `agent/apply.ts` and `app/api/agent/apply/route.ts` for auto-applying to queued jobs with generated cover letters. The apply agent creates a fresh Browserbase + Stagehand session per company apply page, fills forms from saved profile/job data with Stagehand variables, attempts resume upload from the private generated resume PDF, submits when required fields are complete, updates job/run status, and writes per-job `agent_logs`. Every Stagehand `act()` call is wrapped by the local `runAct` try/catch helper.

### ✅ 16 AgentSpan wrapping — completed 2026-05-20
Notes: Installed `@agentspan-ai/sdk` with legacy peer resolution to keep the project on Zod 4. Added `agent/index.ts` as the AgentSpan entry point, wrapping each queued job application through `AgentRuntime.run()` with `idempotencyKey` and log traceability in the `apply-{job_id}` format. `/api/agent/apply` now routes through the AgentSpan wrapper, and the first returned AgentSpan execution ID is saved to `agent_runs.agentspan_run_id`.

### ✅ 17 Review queue — completed 2026-05-20
Notes: Replaced the dashboard auth stub with a review queue section that loads the signed-in user's below-threshold jobs using `jobs.status = found` and `match_score < MATCH_THRESHOLD`. Added `components/dashboard/ReviewQueue.tsx`, a small pending-state dismiss submit button, and `actions/jobs.ts` so dismissing a review job updates its status to `dismissed` and revalidates `/dashboard`.

### ✅ 18 Job details page — completed 2026-05-20
Notes: Added the authenticated `/jobs/[id]` page for owner-scoped job inspection using Next 16 async route params. The page loads the selected job plus base resume availability, renders status/company/location/external apply URL, threshold-aware match breakdown from the existing `match_reason`, full job description with an empty fallback, current base resume preview via `/api/resume/preview`, and a staged disabled tailor/apply CTA for Features 19 and 20. Review queue Open actions now route to the job details page instead of the external apply URL.

### ✅ 19 Resume tailoring — completed 2026-05-20
Notes: Added `/api/resume/tailor` for authenticated job-specific GPT-4o resume tailoring from saved profile evidence and owned job context. Tailored PDFs are rendered server-side, stored in the private `resumes` bucket at `resumes/{user_id}/{job_id}.pdf`, and saved back to `jobs.resume_url` with `jobs.is_tailored = true`. Job details now has a real Tailor resume action, owner-checked tailored PDF preview/download routes, and switches the preview panel from the base resume to the tailored resume after generation. Manual apply remains deferred to Feature 20.

### ✅ 20 Manual apply — completed 2026-05-20
Notes: Added `/api/jobs/[id]/apply` for authenticated owner-scoped manual apply from job details. The manual path uses a direct single-job worker in `agent/apply.ts`, requires a tailored resume, allows only `found` and `failed` jobs, generates and persists a missing cover letter before applying, opens a fresh Browserbase + Stagehand session for the external company apply URL, attaches the tailored PDF from `resumes/{user_id}/{job_id}.pdf`, submits eligible forms, updates the job to `applied` or `failed`, and writes `agent_logs`. `TailorAndApply` is now a two-step tailor/apply panel with pending, success, error, and retry states.

### ✅ 21 Agent controls — completed 2026-05-20
Notes: Added `components/dashboard/AgentControls.tsx` above the review queue with job title and location inputs, a Find Jobs button that calls `/api/agent/find`, local pending states, server-loaded active-run disabling, and a Stop button for active runs. Added `/api/agent/stop` to owner-scope the latest active `finding`, `applying`, or `running` run, mark it `stopped`, set `completed_at`, and write an `agent_logs` entry. Dashboard now loads profile defaults and active run metadata server-side while leaving auto-apply separate from Find Jobs.

### ✅ 22 Stats bar — completed 2026-05-20
Notes: Added `components/dashboard/StatsBar.tsx` between agent controls and the review queue. Dashboard now aggregates all-time owner-scoped run totals from `agent_runs` for total found, auto applied, match rate, and failed attempts, plus counts manually applied jobs from owned tailored applied `jobs` because manual apply is not separately represented in run counters. Match rate and success rate safely display `0%` when their denominators are zero.

### ✅ 23 Live agent feed — completed 2026-05-20
Notes: Added `components/dashboard/LiveFeed.tsx` between the stats bar and review queue. Dashboard now server-loads recent owner-scoped `agent_logs` for the active run, falling back to the latest run, then subscribes to InsForge Realtime on `agent-logs:{user_id}`. New log inserts are prepended newest-first, deduped, capped to 30 entries, and automatically switch the feed to a newly started run. Added `lib/insforge-client.ts`, `/api/auth/realtime-token`, shared dashboard log types, and the required realtime channel, trigger, and owner-scoped policies.

### ✅ 24 Browserbase session recording — completed 2026-05-20
Notes: Added nullable `agent_runs.browserbase_session_id` and `agent_runs.browserbase_recording_url` fields, persisted the latest Browserbase session metadata from discovery and apply sessions, and rendered `components/dashboard/SessionRecording.tsx` after the live feed. The dashboard shows the active run recording first, otherwise the latest run recording, with an empty state when no recording exists.

### ✅ 25 Auto-applied jobs table — completed 2026-05-21
Notes: Added `components/dashboard/AutoAppliedTable.tsx` after the Browserbase recording panel. Dashboard now loads the latest 25 owner-scoped auto-apply outcomes from `jobs` where status is `applied` or `failed` and manual tailored applications are excluded. Rows show company, title, threshold-aware match score, status badge, applied date fallback, and an expandable detail row with the saved cover letter, external apply URL, and failed-job error message when present.

### ✅ 25a Manual job URL import via Browserbase — completed 2026-05-28
Notes: Added `components/jobs/ImportJobUrl.tsx` to the `/jobs` workspace so users can paste a direct job listing URL and import it without running a broader search. Added `/api/jobs/import`, which authenticates the user, validates the URL, creates a short `agent_runs` import run, uses a fresh Browserbase + Stagehand session to extract job title, company, location, description, and a visible apply URL, scores the extracted posting against the saved profile with GPT-4o, saves the job to `jobs`, and finalizes run counters. Imported jobs stay `found`/reviewable while strong matches are counted in `jobs_matched`; no auto-apply queue is created. The UI shows pending, error, and success states, refreshes the jobs inventory after import, and keeps the next planned build item as Feature 26.

### Manual job URL import extraction upgrade — completed 2026-05-28
Notes: Upgraded `/api/jobs/import` from a single Stagehand extraction pass to a DOM-first plus Stagehand plus GPT-4o validation pipeline. The route now captures document title, meta description, headings, visible body text, apply-like links, and job-like links through Browserbase DOM evaluation, runs Stagehand schema extraction with page classification fields, then asks GPT-4o to strictly validate whether the URL is a specific job detail page before saving. Job lists, login-gated pages, career homepages, unrelated pages, and incomplete job pages return clear user-facing errors instead of being saved. Fixed the `ImportJobUrl` success-data type so production build passes. `npm run build` passed.

### Job description extraction upgrade — completed 2026-05-28
Notes: Updated manual URL import and LinkedIn discovery to save fuller scraped job descriptions instead of short AI summaries or title/company/location placeholders. `/api/jobs/import` now captures likely job-description containers from the DOM, prefers that real page text for `jobs.description`, and only falls back to validated/Stagehand/body text when needed. `agent/linkedin.ts` now captures LinkedIn detail-page description text before any external apply navigation and stores it on the saved job. Matching now receives richer job text for imported and LinkedIn-discovered jobs. `npm run build` passed.

### Auto-apply removal from production UI — completed 2026-05-28
Notes: Removed the Browserbase apply attempt button from `/jobs/[id]` and simplified `TailorAndApply` into a resume-tailoring-only panel. Disabled `/api/agent/apply` and `/api/jobs/[id]/apply` with HTTP 410 responses so hidden clients cannot start automatic submission. Manual imports now keep all jobs in `found` while still counting strong matches, and valid job detail pages are accepted even when no direct apply URL is visible. Homepage and legacy outcome-table copy no longer promise auto-apply. The product behavior is now score jobs, preserve source/apply links, and tailor resumes.

### Import validation fallback fix — completed 2026-05-28
Notes: Fixed `/api/jobs/import` so a strong Browserbase/Stagehand extraction is not discarded when the secondary GPT-4o validation response is partial or uses an unexpected JSON shape. The validator now normalizes partial validation output and falls back to Stagehand title/company/location/description/apply URL fields when needed. This addresses imports that extracted the job correctly but failed with `OpenAI returned invalid job validation content.` `npm run build` passed.

### Import validation simplification — completed 2026-05-28
Notes: Removed the secondary GPT-4o validation call from `/api/jobs/import` after it introduced JSON parsing failures on valid Stagehand extractions. Import now uses Stagehand schema fields plus the DOM snapshot for deterministic job-page validation, then calls GPT-4o only for match scoring. This removes the `Unterminated string in JSON` failure path while preserving rejection for obvious non-job pages. `npm run build` passed.

### GPT-4o job description cleanup — completed 2026-05-28
Notes: Added a grounded GPT-4o cleanup pass for both manual URL import and LinkedIn discovery. The cleanup receives raw scraped description text and returns a source-grounded `cleanDescription`, removing navigation, LinkedIn Premium upsells, login prompts, footer links, language selectors, unrelated recommendations, and apply-click metrics without tailoring to the user or inventing details. Manual import uses the cleaned text before match scoring and saving. LinkedIn discovery cleans each detail-page description before inserting the job. Fallback remains the raw extracted description if cleanup fails. `npm run build` passed.

### LinkedIn modal and junk-description handling — completed 2026-05-28
Notes: Added a generic modal-dismiss attempt before manual URL import extraction so dismissible signup overlays can be closed before Stagehand reads the page. Manual import now returns a clearer login-wall message for `login_required` pages, pointing LinkedIn URLs to the connected LinkedIn fetch flow. LinkedIn description cleanup now prunes known Premium/footer/language-selector sections before GPT cleanup and avoids saving junk-only text when no real role description is available. `npm run build` passed.

### LinkedIn context reuse for manual import — completed 2026-05-28
Notes: Updated `/api/jobs/import` so pasted LinkedIn job URLs reuse the saved `profiles.linkedin_context_id` Browserbase context when `profiles.linkedin_connected` is true, matching the LinkedIn job fetch flow. Non-LinkedIn imports still use a fresh public Browserbase session. LinkedIn imports now fail fast with a clear connect-LinkedIn message when no saved context exists. `npm run build` passed.

### Structured job description extraction — completed 2026-05-28
Notes: Changed manual import and LinkedIn discovery description cleanup from a single `cleanDescription` string prompt to structured GPT-4o extraction. GPT now returns title, company, location, salary, job type, about role, responsibilities, requirements, nice-to-have, benefits, and about company with nulls for missing fields. The app formats only present fields into `jobs.description`, omitting missing/null sections so job details stay clean. This keeps matching and resume tailoring grounded while avoiding LinkedIn UI junk and awkward null text. `npm run build` passed.

### LinkedIn Test external apply prompt fix — completed 2026-05-25
Notes: Updated only the `/linkedin-test` external apply path to use a dedicated Stagehand agent `systemPrompt` plus page-specific run instructions with extracted form context and candidate variables. Easy Apply discovery/UI behavior remains unchanged, Stagehand experimental features remain disabled, and external `agent.execute().success` is no longer treated as a verified application submission until the later blocker/submission verification pass.

### LinkedIn Test external apply review panel — completed 2026-05-26
Notes: Added a post-fill external apply review extraction to `/api/linkedin-test/apply` and rendered it in `/linkedin-test`. The review shows filled fields, suspected misfills, empty required fields, blockers, and can-submit status so wrong-field placement is visible without relying only on the Browserbase recording. Easy Apply behavior remains unchanged.

### LinkedIn Test external apply experimental hybrid — completed 2026-05-26
Notes: Added an `experimental` option to the shared Stagehand session helper and enabled `experimental: true` only for `/linkedin-test` external-apply sessions. The existing hybrid external agent and fill-review panel remain in place so retests can compare whether experimental Stagehand behavior reduces wrong-field placement. Easy Apply and production/non-test sessions remain non-experimental.

### Jobs cleanup pass — completed 2026-05-26
Notes: Started the Browserbase pivot cleanup for the production `/jobs` surface. `agent/matcher.ts` now keeps scored jobs tracked as `found` instead of sending threshold-passing jobs to `queued`, while preserving `MATCH_THRESHOLD` scoring. `/jobs` now loads the legacy source URL from `jobs.linkedin_url`, derives a display apply type, filters by `All`, `Applied`, and `Not applied`, maps all non-applied statuses to `Not applied`, removes the Actions column, and makes rows navigate to `/jobs/[id]`. The inventory was refactored to shadcn `Table` and `Badge` primitives, showing only job title as the row identity with compact source/apply icon links. Homepage, profile, match, and job-detail copy now avoid reliable auto-submit claims. Automation apply internals, `/api/jobs/[id]/apply`, `agent/apply.ts`, and `/linkedin-test` were left unchanged for senior review. `npm run build` passed.

### Find Jobs pipeline cleanup — completed 2026-05-26
Notes: Removed queued cover-letter generation from the active `/api/agent/find` flow now that matcher no longer creates queued jobs. The API keeps `generatedCoverLetters` and `failedCoverLetters` response fields as zero for compatibility, and `AgentControls` now reports saved strong matches after discovery. `agent/cover-letter.ts` remains in place for historical automation review. `npm run build` passed.

### LinkedIn discovery merge — completed 2026-05-26
Notes: Merged the working LinkedIn job fetching approach into the production `/api/agent/find` flow. Added `agent/linkedin.ts` for LinkedIn search, DOM extraction, Stagehand extraction, detail-page apply mode detection, saving `jobs.linkedin_url` and `jobs.external_apply_url`, and agent logging. Removed the active Google discovery module. `/jobs` now derives `Easy Apply` when a LinkedIn URL exists without an external apply URL and `External` when `external_apply_url` exists. Matching still runs after discovery. `/linkedin-test` remains in place for comparison until a later cleanup pass removes it. `npm run build` passed.

### Job details review redesign — completed 2026-05-26
Notes: Reworked `/jobs/[id]` into a review-oriented detail page with a compact back link, title/company header, status and apply type badges, direct LinkedIn/apply page actions, match breakdown, application links, description, resume preview, and review metadata. The existing automatic apply trigger remains visible for Browserbase/senior review, but is labeled as an experimental Browserbase apply attempt and the automation internals were not changed. `npm run build` passed.

### Job details flattening and base-resume apply attempt — completed 2026-05-26
Notes: Reduced nested framed panels on `/jobs/[id]` so the page reads less like stacked boxes. Updated the visible apply attempt flow so it no longer requires a tailored resume before running; `agent/apply.ts` now falls back to the user's base resume path when no tailored resume exists, while still requiring a generated base resume. The existing Browserbase form-filling implementation remains unchanged. `npm run build` passed.

### Job details single-column redesign — completed 2026-05-26
Notes: Reworked `/jobs/[id]` again into a flatter single-column review surface after visual inspection showed the two-column card layout was too noisy. Removed the embedded resume iframe from job details, kept resume download/generation in the action band, moved the Browserbase apply attempt into a horizontal review band, and placed links plus saved metadata at the bottom. `npm run build` passed.

### Job details application layout pass — completed 2026-05-26
Notes: Revised `/jobs/[id]` toward a more standard application detail layout: job description and match analysis in the main column, with a compact right-side rail for links, resume actions, Browserbase review attempt, and saved metadata. This keeps the apply attempt visible for review while reducing the previous full-width band stack. `npm run build` passed.

### Apply attempt job loader normalization — completed 2026-05-26
Notes: Updated `agent/apply.ts` so the manual apply attempt loader normalizes nullable job fields instead of rejecting cleaned LinkedIn-discovered jobs that do not have a saved cover letter or tailored resume metadata. This fixes the early `Could not load this job.` response before Browserbase starts, while leaving the Browserbase automation path itself unchanged. `npm run build` passed.

### Browserbase metadata sanitization — completed 2026-05-26
Notes: Added Browserbase session metadata sanitization in `lib/browserbase.ts` so long job/company values with spaces and punctuation are converted into safe slug-like metadata before calling `client.sessions.create`. This fixes Browserbase `400 Value is not a valid metadata value` failures during apply attempts without changing automation behavior. `npm run build` passed.

### Job details external apply merge — completed 2026-05-26
Notes: Merged the `/linkedin-test` external apply strategy into the job details apply attempt path. Manual `/jobs/[id]` apply now uses a Stagehand hybrid agent with experimental sessions for external company apply pages, the same first/last/name/contact variable style, aggressive field-fill-and-submit instructions, and post-failure external review extraction for blockers/misfilled fields. Easy Apply and the `/linkedin-test` route were left unchanged for comparison. `npm run build` passed.

### Redesign Phase 1 sidebar fix — completed 2026-05-21
Notes: Restored the authenticated shell to shadcn sidebar primitives in `components/layout/AppShell.tsx` using `SidebarProvider`, `Sidebar`, `SidebarInset`, and `SidebarMenu` primitives. Patched `components/ui/sidebar.tsx` width utilities to explicit `w-[var(--sidebar-width)]` forms so the sidebar gap/container behave reliably. The header icon toggles desktop off-canvas and mobile drawer state, active section highlighting is preserved, and mobile navigation closes after route clicks. `npm run lint` and `npm run build` passed; local dev server runtime check was blocked by sandbox port permissions.

### Redesign Phase 2 dashboard overview — completed 2026-05-21
Notes: Refactored `/dashboard` into an overview-only surface with existing high-level stats, a compact current/latest run summary, and a future analytics placement. Removed operational widgets from the dashboard render path and stopped fetching job controls defaults, review queue rows, auto-applied job rows, live feed logs, and Browserbase recording metadata. `npm run lint` and `npm run build` passed.

### Redesign sidebar recovery — completed 2026-05-21
Notes: Restored `components/layout/AppShell.tsx` to the documented shadcn sidebar primitive pattern: `SidebarTrigger` toggles desktop and mobile state, desktop uses `collapsible="icon"`, mobile uses the built-in shadcn sheet drawer, active navigation remains tokenized, and mobile nav clicks close the drawer. `npm run lint` and `npm run build` passed.

### Redesign Phase 3 jobs workspace — completed 2026-05-21
Notes: Rebuilt `/jobs` as the operational workspace with Find Jobs controls, compact active/latest run context, URL-backed status filters and sorting, paginated owner-scoped job inventory, review dismiss actions, expandable application outcome details, and links into `/jobs/[id]`. `npm run lint` and `npm run build` passed.

### Redesign Phase 4 profile structure cleanup — completed 2026-05-21
Notes: Flattened `/profile` into an unframed setup and resume workspace while preserving profile validation, save behavior, evidence serialization, resume generation, preview, and download behavior. Repeated evidence entries remain framed, and resume PDF actions now sit in a single clean action band. `npm run lint` and `npm run build` passed.

### Redesign Phase 5 visual pattern cleanup — completed 2026-05-21
Notes: Updated `context/ui-rules.md`, `context/ui-registry.md`, and `context/architecture.md` to document the authenticated AppShell/sidebar pattern, the Dashboard overview / Jobs operations / Profile setup-resume split, flat page header rules, and explicit nested-card avoidance. `npm run lint` and `npm run build` passed.

Format when adding:

```
### ✅ 01 Homepage — completed [date]
Notes: [anything notable about how it was built or decisions made]
```

---

## Architecture Decisions

_Decisions made during the build that deviate from or extend the context files._

### 02 InsForge auth — 2026-05-18
Decision: Profile is not shown as a top-level navbar link.
Reason: Users will reach profile from Dashboard later, keeping the public and signed-in navbar simpler.
Impact: `components/layout/Navbar.tsx`, dashboard/profile navigation expectations.

### 02 InsForge auth — 2026-05-18
Decision: Route protection uses Next 16 `proxy.ts`, not `middleware.ts`.
Reason: Next.js 16 renamed middleware-style request boundary logic to Proxy.
Impact: `proxy.ts`.

### 03 Database schema — 2026-05-18
Decision: Resume records are represented by storage URLs on `profiles.resume_pdf_url` and `jobs.resume_url`, not a separate `resumes` table.
Reason: The architecture defines resume files as InsForge Storage objects, and the planned resume features only need the current base resume URL plus the tailored job resume URL.
Impact: `profiles`, `jobs`, `resumes` storage bucket.

### 03 Database schema — 2026-05-18
Decision: All application tables use owner-scoped RLS policies based on `auth.uid()`.
Reason: Every user-facing query should be constrained to the authenticated user's own profile, runs, jobs, and logs from the start.
Impact: `profiles`, `agent_runs`, `jobs`, `agent_logs`.

### 04 Profile form — 2026-05-18
Decision: Profile completion uses core required fields and treats LinkedIn and portfolio URLs as optional.
Reason: The agent can run from the core profile data, while external profile links are helpful but not mandatory.
Impact: `components/profile/ProfileForm.tsx`, `components/profile/CompletionIndicator.tsx`, `actions/profile.ts`.

### 04 Profile form — 2026-05-18
Decision: Profile saving uses update-if-present, insert-if-missing behavior.
Reason: The InsForge SDK docs in use expose insert/update/select patterns, so explicit upsert-style logic avoids duplicate profile errors and keeps Feature 07 simpler.
Impact: `actions/profile.ts`.

### 05 Profile load — 2026-05-18
Decision: Profile data is normalized on the server before crossing into the client form.
Reason: `ProfileForm` should stay independent of raw database row shape and receive one complete `ProfileFormData` object whether the user has a saved profile or not.
Impact: `app/profile/page.tsx`, `components/profile/ProfileForm.tsx`.

### 05 Profile load — 2026-05-18
Decision: Profile read failures render an error panel instead of a blank editable form.
Reason: Showing blank defaults when a saved row may exist could lead to accidental overwrite after a transient database or RLS failure.
Impact: `app/profile/page.tsx`.

### 06 Smart redirect — 2026-05-18
Decision: Explicit `next` destinations are gated by profile completion.
Reason: Incomplete users should always land on onboarding before accessing deeper app routes, while complete users can resume the destination they originally requested.
Impact: `app/api/auth/callback/route.ts`.

### 06 Smart redirect — 2026-05-18
Decision: Profile lookup failures after successful OAuth route to `/profile`.
Reason: Sign-in should remain recoverable even if the profile completion read fails, and `/profile` can safely show the user what needs attention.
Impact: `app/api/auth/callback/route.ts`.

### 07 Profile edit — 2026-05-18
Decision: Keep profile editing as an always-editable form rather than adding a separate edit mode.
Reason: The create and edit flows share the same fields and validation, and users benefit from being able to update profile data directly.
Impact: `app/profile/page.tsx`, `components/profile/ProfileForm.tsx`.

### 08 Resume generation — 2026-05-19
Decision: Generate resumes from the saved complete profile only, not unsaved form state.
Reason: The API can trust server-loaded profile data and the UI can clearly prompt users to save changes first.
Impact: `app/api/resume/generate/route.ts`, `components/profile/ProfileForm.tsx`.

### 08 Resume generation — 2026-05-19
Decision: Downloads go through an authenticated app route instead of exposing the private bucket URL directly.
Reason: The `resumes` bucket remains private while signed-in users can still download their generated PDF.
Impact: `app/api/resume/download/route.ts`, `components/profile/ProfileForm.tsx`.

### 08 Resume generation — 2026-05-19
Decision: Private resume storage uses authenticated owner-scoped RLS policies on `storage.objects`.
Reason: The bucket only had a project-admin policy, so authenticated uploads were denied until the `resumes` bucket allowed objects owned by `uploaded_by = auth.uid()` or keys under `resumes/{auth.uid()}/`.
Impact: InsForge `storage.objects` policies, `app/api/resume/generate/route.ts`.

### 08 Resume generation — 2026-05-19
Decision: Application-quality resumes require saved resume evidence fields before generation.
Reason: The original profile-only resume was too generic for real applications because it lacked employers, projects, metrics, and achievements. GPT-4o now rewrites user-provided evidence rather than stretching sparse profile data.
Impact: `profiles` schema, `components/profile/ProfileForm.tsx`, `actions/profile.ts`, `app/profile/page.tsx`, `app/api/resume/generate/route.ts`, `lib/resume.tsx`.

### 08 Resume evidence form upgrade — 2026-05-19
Decision: Resume evidence is edited through structured repeatable work, project, and education entries but still serialized into the existing text columns.
Reason: The profile page needed a cleaner, more professional evidence workflow without adding a database migration or changing the resume generation API.
Impact: `components/profile/ProfileForm.tsx`, `context/architecture.md`, `context/ui-registry.md`.

### 08 Resume evidence cards refinement — 2026-05-19
Decision: Structured evidence entries use shadcn accordion primitives and use the company, project, or school name as the card title once provided.
Reason: Accordion cards keep the profile form cleaner as evidence grows, and data-backed titles make entries easier to scan.
Impact: `components/profile/ProfileForm.tsx`, `components/ui/accordion.tsx`, `context/ui-registry.md`.

### 08 Resume evidence recovery — 2026-05-19
Decision: Replace the direct accordion evidence UI with an app-native `EvidenceEntryCard` disclosure component while keeping structured state and text-field serialization.
Reason: The accordion visual implementation made the evidence area hard to scan and misaligned the title, chevron, and remove action. A small dedicated card keeps the existing data model but restores the project’s form-card pattern.
Impact: `components/profile/ProfileForm.tsx`, `components/profile/EvidenceEntryCard.tsx`, `context/ui-registry.md`.

### 08 Resume generation blocker feedback — 2026-05-19
Decision: Show a tokenized warning panel listing every reason resume generation is disabled.
Reason: A disabled Generate resume button alone did not explain whether the user needed to save, complete profile fields, or add more resume evidence.
Impact: `components/profile/ProfileForm.tsx`, `context/ui-registry.md`.

### 09 Resume preview — 2026-05-19
Decision: Add a separate authenticated preview endpoint instead of reusing the download endpoint.
Reason: The private bucket should remain hidden, downloads should stay attachment-based, and the browser PDF viewer needs an inline response for embedding.
Impact: `app/api/resume/preview/route.ts`, `components/profile/ProfileForm.tsx`.

### 09 Resume preview — 2026-05-19
Decision: Use the browser-native PDF iframe viewer inside a modal instead of always embedding the preview on the profile page.
Reason: Feature 09 only needs a reliable private PDF preview, and keeping it behind a button avoids making the profile form visually heavy.
Impact: `components/profile/ProfileForm.tsx`.

### Profile structure refinement — 2026-05-19
Decision: Replace the persistent profile completion sidebar with an embedded readiness summary and stacked workflow sections.
Reason: Required-field messages did not justify a dedicated sidebar, and the profile page reads better as a setup flow for agent readiness and resume generation.
Impact: `components/profile/ProfileForm.tsx`, `context/ui-registry.md`.

### 10 Browserbase setup — 2026-05-19
Decision: Use the Browserbase SDK directly from server-only app code instead of Browserbase MCP, Browserbase skills, or Browserbase Functions.
Reason: JobPilot needs production session management that can be imported by the agent flow, while MCP/skills are better suited to manual debugging and Functions are not part of the planned architecture.
Impact: `lib/browserbase.ts`, `package.json`.

### 10 Browserbase setup — 2026-05-19
Decision: Keep Feature 10 limited to session creation, release, recording URL derivation, and connection verification.
Reason: Stagehand initialization and browser interaction start in Feature 11, so the Browserbase boundary should be proven before adding AI browser control.
Impact: `lib/browserbase.ts`.

### 11 Stagehand setup — 2026-05-19
Decision: Run Stagehand with `disableAPI: true` while still connecting to Browserbase sessions.
Reason: The installed Stagehand v3 hosted API path rejects the project-required legacy `gpt-4o` model format during live verification, while direct SDK execution over Browserbase works with explicit OpenAI client options.
Impact: `lib/stagehand.ts`.

### 11 Stagehand setup — 2026-05-19
Decision: Pass `OPENAI_API_KEY` explicitly in the Stagehand model configuration instead of relying on Stagehand's automatic env lookup.
Reason: Stagehand v3's automatic lookup expects provider-prefixed model names, but project rules require the model string to remain `gpt-4o`.
Impact: `lib/stagehand.ts`.

### 12 Google job discovery restructure — 2026-05-19
Decision: Replace LinkedIn account-based discovery with Google/public web discovery.
Reason: Browserbase login to LinkedIn can immediately trigger account bans, which is unacceptable for a user-facing job agent. Public company and ATS pages better match the auto-apply goal.
Impact: `context/specs/12-job-discovery.md`, `agent/google.ts`, `app/api/agent/find/route.ts`, `components/profile/ProfileForm.tsx`.

### 12 Google job discovery restructure — 2026-05-19
Decision: Remove LinkedIn connection as an app requirement and keep discovery unauthenticated.
Reason: Job discovery should not require users to connect or risk external accounts. Browserbase remains the browser execution layer for public search and later company-page application sessions.
Impact: Deleted `app/api/linkedin/connect/route.ts`, deleted `app/api/linkedin/verify/route.ts`, removed the profile LinkedIn connection panel.

### 12 Google job discovery restructure — 2026-05-19
Decision: Reuse `jobs.linkedin_url` as a legacy source URL column for discovered postings.
Reason: Feature 12 can be safely restructured without a database migration; a later schema cleanup can rename or replace this column with `source_url`.
Impact: `agent/google.ts`, `context/architecture.md`.

### 12 job discovery — 2026-05-19
Decision: Keep Feature 12 to discovery only; GPT-4o matching and queue routing remain Feature 13.
Reason: The build plan separates job discovery from scoring so each phase can be verified independently.
Impact: `agent/google.ts`, `app/api/agent/find/route.ts`.

### 13 GPT-4o matching — 2026-05-19
Decision: Match discovered jobs immediately after Google/public web discovery inside `/api/agent/find`.
Reason: The Find Jobs action should leave each saved job scored and ready for the auto-apply or review workflows without requiring a second user action.
Impact: `app/api/agent/find/route.ts`, `agent/matcher.ts`.

### 13 GPT-4o matching — 2026-05-19
Decision: Keep below-threshold jobs in status `found` instead of introducing a new `review` status.
Reason: The documented `jobs.status` values do not include `review`, and Feature 17 can identify the review queue by `match_score < MATCH_THRESHOLD`.
Impact: `agent/matcher.ts`, future review queue filtering.

### 14 Cover letter generation — 2026-05-19
Decision: Run cover letter generation immediately after matching inside `/api/agent/find`.
Reason: The Find Jobs action should leave threshold-passing jobs scored, queued, and ready for the apply agent without requiring another user action.
Impact: `app/api/agent/find/route.ts`, `agent/cover-letter.ts`.

### 14 Cover letter generation — 2026-05-19
Decision: Mark jobs as `failed` when cover letter generation or persistence fails.
Reason: Feature 15 applies queued jobs, and a queued job without the required `jobs.cover_letter` would be incomplete for form filling.
Impact: `agent/cover-letter.ts`, future apply queue filtering.

### 15 Apply agent — 2026-05-20
Decision: Keep Feature 15 as a plain server-only apply batch and defer AgentSpan checkpointing to Feature 16.
Reason: The build plan separates application submission from durability wrapping, and a clean `applyToQueuedJobs` function gives Feature 16 a stable target to wrap.
Impact: `agent/apply.ts`, `app/api/agent/apply/route.ts`, future `agent/index.ts`.

### 15 Apply agent — 2026-05-20
Decision: Apply only queued jobs and fail jobs that are missing generated cover letters.
Reason: The application form payload depends on the cover letter generated in Feature 14, and submitting incomplete applications would be worse than safely routing the job to failure.
Impact: `agent/apply.ts`.

### 15 Apply agent — 2026-05-20
Decision: Use Stagehand natural-language observation to locate resume upload controls, then attach the generated resume file through the returned locator.
Reason: Project rules prohibit hardcoded company-page selectors, while file upload still needs a browser file-input operation after Stagehand identifies the right control.
Impact: `agent/apply.ts`.

### 16 AgentSpan wrapping — 2026-05-20
Decision: Use the AgentSpan TypeScript SDK with `npm install @agentspan-ai/sdk --legacy-peer-deps` instead of downgrading Zod or adding a Python worker.
Reason: The published SDK peer dependency still asks for Zod 3, while its implementation can handle Zod 4 and the project already depends on Zod 4 through Stagehand.
Impact: `package.json`, `package-lock.json`, `agent/index.ts`.

### 16 AgentSpan wrapping — 2026-05-20
Decision: Wrap each queued job as its own AgentSpan runtime execution with `idempotencyKey = apply-{job_id}` and save the first execution ID to `agent_runs.agentspan_run_id`.
Reason: The TypeScript SDK exposes run-level idempotency rather than an explicit public checkpoint-step API, so per-job runs provide durable retry boundaries without relying on private SDK internals.
Impact: `agent/index.ts`, `agent/apply.ts`, `app/api/agent/apply/route.ts`.

### 16 AgentSpan wrapping — 2026-05-20
Decision: Keep Browserbase and Stagehand submission logic in `agent/apply.ts`, exposing only a single queued-job apply unit for the AgentSpan tool.
Reason: The existing apply implementation owns company-page behavior and failure isolation; AgentSpan should wrap that behavior rather than duplicate form-filling logic.
Impact: `agent/apply.ts`, `agent/index.ts`.

### 19 Resume tailoring — 2026-05-20
Decision: Require a generated base resume before allowing job-specific tailoring.
Reason: The base resume is the readiness gate that proves the saved profile and resume evidence are complete enough for application-quality output.
Impact: `app/api/resume/tailor/route.ts`, `components/jobs/TailorAndApply.tsx`.

### 19 Resume tailoring — 2026-05-20
Decision: Tailored resume preview and download are served through job-scoped authenticated routes instead of exposing storage URLs.
Reason: The `resumes` bucket stays private, and each tailored PDF must be accessible only after confirming the job belongs to the signed-in user.
Impact: `app/api/resume/jobs/[id]/preview/route.ts`, `app/api/resume/jobs/[id]/download/route.ts`, `components/jobs/JobDetails.tsx`.

### 20 Manual apply — 2026-05-20
Decision: Manual apply requires `jobs.is_tailored = true` and a tailored job resume.
Reason: The review flow is intentionally tailor-first, and submitting with the job-specific PDF is the core value of Feature 20.
Impact: `agent/apply.ts`, `app/api/jobs/[id]/apply/route.ts`, `components/jobs/TailorAndApply.tsx`.

### 20 Manual apply — 2026-05-20
Decision: Manual apply calls a direct single-job worker instead of AgentSpan.
Reason: Feature 20 is a foreground one-job user action, while AgentSpan remains reserved for the batch auto-apply loop.
Impact: `agent/apply.ts`, `app/api/jobs/[id]/apply/route.ts`.

### 20 Manual apply — 2026-05-20
Decision: Generate and save a cover letter during manual apply if the review job does not already have one.
Reason: Below-threshold review jobs are not guaranteed to pass through queued cover-letter generation, but company forms may still need cover-letter content.
Impact: `agent/cover-letter.ts`, `agent/apply.ts`.

### 23 Live agent feed — 2026-05-20
Decision: Subscribe to a user-scoped realtime channel and publish `agent_logs` inserts through a database trigger.
Reason: The dashboard needs live updates during long-running agent requests, and owner-scoped channel access keeps users from reading another user's feed.
Impact: `realtime.channels`, `agent_logs_realtime_insert`, `components/dashboard/LiveFeed.tsx`.

### 23 Live agent feed — 2026-05-20
Decision: Add `/api/auth/realtime-token` so client-side realtime can authenticate with the signed-in user's InsForge access token.
Reason: JobPilot stores auth tokens in httpOnly cookies, while the InsForge realtime SDK needs an access token in the browser to satisfy owner-scoped realtime RLS.
Impact: `app/api/auth/realtime-token/route.ts`, `lib/insforge-client.ts`, `components/dashboard/LiveFeed.tsx`.

### 24 Browserbase session recording — 2026-05-20
Decision: Persist one latest Browserbase session and recording URL on each `agent_runs` row.
Reason: The dashboard must recover the recording after refresh, and one visible recording per run is enough for the live dashboard.
Impact: `agent_runs`, `agent/recording.ts`, `app/dashboard/page.tsx`, `components/dashboard/SessionRecording.tsx`.

### 24 Browserbase session recording — 2026-05-20
Decision: Update the persisted recording whenever discovery or apply opens a fresh Browserbase session.
Reason: The recording panel should follow the newest browser session for the run, including per-job apply sessions after initial discovery.
Impact: `agent/google.ts`, `agent/apply.ts`.

Format when adding:

```
### [Feature] — [date]
Decision: [what was decided]
Reason: [why]
Impact: [what files or components this affects]
```

---

## Known Issues

_Issues discovered during the build that are not yet resolved._

### InsForge auth config schema mismatch
Feature: 02 InsForge auth
Description: `signInWithOAuth` fails with `Failed to get authentication configuration`. InsForge logs show PostgreSQL error `42703` because `auth.config.disable_signup` does not exist, while the running backend queries it. MCP raw SQL cannot repair this because writes to the managed `auth` schema are blocked.
Status: resolved — moved Feature 02 to a fresh InsForge project with a healthy managed auth schema.

### Resume evidence accordion visual regression
Feature: 08 Resume generation
Description: The first structured resume evidence UI used direct accordion primitives, which produced awkward header alignment and a poor collapsed-card layout.
Status: resolved — replaced with `EvidenceEntryCard`, an app-native disclosure card that preserves the structured data flow.

Format when adding:

```
### [Issue title]
Feature: [which feature this affects]
Description: [what the issue is]
Status: [open / in progress / resolved]
```

---

## Session Notes

_Brief notes from each session. Useful for picking up context after a break._

### Session — 2026-05-18
Built: Feature 01 Homepage.
Left off: Homepage implementation complete and verified; homepage text classes use Tailwind v4 token utilities like `text-text-primary`, and lower homepage sections have expanded spacing/card height.
Next session starts with: Feature 02 InsForge auth.

### Session — 2026-05-18
Built: Feature 02 InsForge auth.
Left off: OAuth-only auth foundation implemented, switched to a fresh InsForge project, and verified OAuth redirects properly.
Next session starts with: Feature 03 Database schema.

### Session — 2026-05-18
Built: Feature 03 Database schema.
Left off: InsForge backend schema and private resume storage bucket are in place and verified.
Next session starts with: Feature 04 Profile form.

### Session — 2026-05-18
Built: Feature 04 Profile form.
Left off: Profile form, validation, completion indicator, and save action are implemented and build-verified.
Next session starts with: Feature 05 Profile load.

### Session — 2026-05-18
Built: Feature 05 Profile load.
Left off: `/profile` loads and pre-fills saved profile data for returning users, with safe blank defaults for first-time users and an error panel for load failures.
Next session starts with: Feature 06 Smart redirect.

### Session — 2026-05-18
Built: Feature 06 Smart redirect.
Left off: OAuth now sends missing or incomplete profiles to `/profile`, and complete profiles to a safe requested destination or `/dashboard`.
Next session starts with: Feature 07 Profile edit.

### Session — 2026-05-18
Built: Feature 07 Profile edit.
Left off: `/profile` supports editing saved profiles with edit-aware copy, update feedback, and dashboard navigation after a complete save.
Next session starts with: Feature 08 Resume generation.

### Session — 2026-05-19
Built: Feature 08 Resume generation.
Left off: `/profile` can trigger saved-profile resume generation, save the generated PDF URL, and download the private base resume through an authenticated route.
Next session starts with: Feature 09 Resume preview.

### Session — 2026-05-19
Built: Feature 09 Resume preview.
Left off: `/profile` opens an authenticated modal preview of the generated base resume, supports attachment download, and refreshes the preview after regeneration.
Next session starts with: Feature 10 Browserbase setup.

### Session — 2026-05-19
Built: Refined `/profile` structure after Feature 09.
Left off: Profile completion is now an embedded readiness summary, and the form is organized into stacked workflow sections instead of a form plus validation sidebar.
Next session starts with: Feature 10 Browserbase setup.

### Session — 2026-05-19
Built: Feature 10 Browserbase setup.
Left off: Browserbase dependencies are installed, `lib/browserbase.ts` can create and release sessions, and a live Browserbase smoke test created a session with a connect URL and released it.
Next session starts with: Feature 11 Stagehand setup.

### Session — 2026-05-19
Built: Feature 11 Stagehand setup.
Left off: `lib/stagehand.ts` initializes Stagehand against Browserbase sessions, uses GPT-4o with explicit OpenAI credentials, verifies navigation plus Zod extraction, and closes sessions correctly.
Next session starts with: Feature 13 GPT-4o matching.

### Session — 2026-05-19
Built: Feature 12 Google job discovery.
Left off: LinkedIn discovery has been replaced by unauthenticated Google/public web discovery. The active `/api/agent/find` path creates a run and calls `agent/google.ts`; `/profile` no longer asks users to connect LinkedIn. The legacy `profiles.linkedin_context_id` column may still exist in the database but is no longer used by active discovery.
Next session starts with: Feature 13 GPT-4o matching.

### Session — 2026-05-19
Built: Feature 13 GPT-4o matching.
Left off: `agent/matcher.ts` scores discovered jobs with GPT-4o, saves match score/reason, queues threshold-passing jobs, keeps below-threshold jobs for review, and `/api/agent/find` returns discovery plus matching counts.
Next session starts with: Feature 14 Cover letter generation.

### Session — 2026-05-19
Built: Feature 14 Cover letter generation.
Left off: `agent/cover-letter.ts` generates and saves cover letters for queued jobs, logs per-job outcomes, marks cover-letter failures as failed jobs, and `/api/agent/find` returns cover-letter counts after matching.
Next session starts with: Feature 15 Apply agent.

### Session — 2026-05-20
Built: Feature 15 Apply agent.
Left off: `agent/apply.ts` applies to queued jobs with generated cover letters through fresh Browserbase + Stagehand sessions, attempts generated resume upload, submits eligible forms, updates job/run status, and logs per-job outcomes. `app/api/agent/apply/route.ts` exposes the authenticated apply trigger.
Next session starts with: Feature 16 AgentSpan wrapping.

### Session — 2026-05-20
Built: Feature 16 AgentSpan wrapping.
Left off: `/api/agent/apply` now runs queued applications through `agent/index.ts` and AgentSpan `AgentRuntime.run()` using `apply-{job_id}` idempotency keys. The first AgentSpan execution ID is saved on `agent_runs.agentspan_run_id`, and per-job AgentSpan execution outcomes are logged to `agent_logs`.
Next session starts with: Feature 17 Review queue.

### Session — 2026-05-20
Built: Feature 19 Resume tailoring.
Left off: `/jobs/[id]` can generate and preview an owned job's tailored resume after a base resume exists. The tailored PDF is saved privately at `resumes/{user_id}/{job_id}.pdf`, and `jobs.resume_url` plus `jobs.is_tailored` are updated.
Next session starts with: Feature 20 Manual apply.

### Session — 2026-05-20
Built: Feature 20 Manual apply.
Left off: `/jobs/[id]` can submit a tailored-review job through a fresh Browserbase + Stagehand session using saved profile data, a generated or existing cover letter, and the tailored PDF. The next phase begins with dashboard controls.
Next session starts with: Feature 21 Agent controls.

### Session — 2026-05-22
Built: Auto-apply readiness profile fields.
Left off: `/profile` now has an Application Questions section for work authorization, sponsorship, salary, availability, relocation, background check, gender, Hispanic/Latino, veteran, disability, and optional application notes. These fields are saved to `profiles`, kept separate from core `is_complete`, and passed into `agent/apply.ts` plus the LinkedIn test apply route so Stagehand can answer recurring legal/disclosure questions from explicit saved values, including Prefer not to answer.
Next session starts with: Feature 26 Dashboard incomplete profile banner.

### Session — 2026-05-22
Built: LinkedIn Test apply review boundary.
Left off: `/api/linkedin-test/apply` streams Browserbase apply progress with SSE and uses Stagehand Agent without experimental custom tools. Unknown required legal, disclosure, assessment, or other truth-sensitive questions should stop the run as needs-review instead of asking inline. The regular `/jobs/[id]` manual apply UI remains on the original JSON flow; batch auto-apply still uses the original non-HITL path.
Next session starts with: Decide whether human-in-loop needs a stable non-Stagehand-custom-tool implementation before merging LinkedIn Test behavior into the main product.

### Session — 2026-05-26
Built: Profile first and last name split.
Left off: `/profile` now collects first name and last name as separate form fields, validates them separately, and composes the existing `profiles.full_name` value on save so downstream resume, matcher, and apply code can keep using the current database shape.
Next session starts with: Continue cleanup from `context/cleaning-progress.md`.

Format when adding:

```
### Session — [date]
Built: [what was completed]
Left off: [exactly where the session ended]
Next session starts with: [first thing to do next time]
```
