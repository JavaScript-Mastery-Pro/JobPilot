# Feature 12 Spec — Google Job Discovery

## Summary

Rebuild Feature 12 as public web job discovery through Google search. The agent searches for company career and ATS job postings by title and location, extracts candidate URLs with Stagehand, rejects account-gated job boards, verifies each candidate page is an individual public job posting, saves valid external apply URLs to InsForge, and writes agent logs. No user LinkedIn account or persisted Browserbase Context is required.

## Key Changes

- Remove LinkedIn as the active discovery source.
- Remove the `/profile` LinkedIn connection flow from the app UI.
- Replace `agent/linkedin.ts` with `agent/google.ts`.
- Keep `/api/agent/find` as the public route contract, but make it call Google/public web discovery directly.
- Use fresh Browserbase + Stagehand sessions for discovery; do not use user-authenticated browser contexts.
- Store the discovered source URL in the existing `jobs.linkedin_url` column for now as a legacy source URL field.

## Discovery Behavior

- Build a Google search URL from user-provided `jobTitle` and `location`.
- Prefer company career pages and ATS hosts such as Greenhouse, Lever, Ashby, and Workday.
- Extract candidate job result URLs using Stagehand `extract()` with a Zod schema.
- Filter out LinkedIn, Wellfound, Indeed, Glassdoor, ZipRecruiter, and other account-heavy job boards.
- Visit candidate pages and extract title, company, location, description, source URL, direct apply URL, and account requirement status.
- Save only pages that are individual public job postings and have a valid public external apply URL.
- Skip pages that require sign-in before applying.
- Save remaining jobs with status `found`.
- Write `agent_logs` for start, search loaded, jobs skipped, jobs saved, and failures.
- Do not run GPT matching in Feature 12; leave `match_score` and `match_reason` empty/null for Feature 13.

## Test Plan

- Run lint and build.
- Verify `/api/agent/find` no longer requires `profiles.linkedin_context_id`.
- Verify discovery creates a fresh Browserbase recording URL.
- Verify blocked job-board domains are skipped.
- Verify only individual public job postings are inserted into `jobs`.
- Verify `agent_logs` records both success and skip/failure events.
- Update `context/progress-tracker.md` and `context/ui-registry.md` after completion.

## Assumptions

- Google is the discovery layer; company and ATS pages are the trusted target output.
- Some Google results will still point to account-gated job boards, so filtering is mandatory.
- The existing `jobs.linkedin_url` database column remains in place for now and acts as a source URL field until a later schema cleanup.
- Auto-apply remains a later feature and will open each saved `external_apply_url` in a fresh Browserbase session.
