# Browserbase LinkedIn Test Stabilization Spec

## Goal

Make `/linkedin-test` reliably distinguish LinkedIn Easy Apply jobs from external Apply jobs, then route each job into the correct automation flow.

## Plan

- Treat LinkedIn search results as candidates only. Do not trust search-card `isEasyApply`.
- For each job, open the LinkedIn detail page and classify from the real apply control:
  - `Easy Apply` button -> Easy Apply flow.
  - Plain `Apply` button/link -> external apply flow.
  - If the external URL is hidden, click `Apply` during classification and capture the final non-LinkedIn URL.
  - If no mode or URL can be resolved, mark the job unresolved and do not allow apply.
- In `/api/linkedin-test/apply`, re-check the apply mode server-side before applying. Never trust only the client payload.
- Keep flows separate:
  - Easy Apply uses LinkedIn page + saved Browserbase context.
  - External Apply uses the captured ATS/company URL directly.
- Use non-experimental Stagehand only. No hybrid mode, no experimental output schemas.
- Use full profile data to answer ordinary job-fit questions.
- Stop for review only on sensitive/legal/personal questions: sponsorship, work authorization, salary, demographics, disability, veteran status, assessments, background checks, security clearance, or unknown truth-sensitive questions.
- For external forms requiring a resume, attach the saved `resume_pdf_url`; if missing, return a clear “resume required” blocker.

## Acceptance Tests

- Search results show correct states: Easy Apply, External Apply, or Unresolved.
- External jobs open/apply on the external ATS URL, not the LinkedIn URL.
- Easy Apply jobs open the LinkedIn Easy Apply modal.
- No job defaults to Easy Apply just because `externalApplyUrl` is empty.
- Resume-required external forms attempt resume upload when a resume exists.
- `npm run lint` and `npm run build` pass.

## Notes

- Keep this isolated under `/linkedin-test`.
- Update `current-test.md` after implementation so experiment changes are removable later.
