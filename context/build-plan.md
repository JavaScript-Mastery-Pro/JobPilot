# Build Plan

Ordered feature list. One feature per spec file. Each phase must be fully working before moving to the next.

---

## Phase 1 — Foundation

- 01 Homepage — hero section, how it works, features section, footer, navbar, fully responsive
- 02 InsForge auth — Google and GitHub OAuth, login page, OAuth callback, session management, middleware protecting dashboard + profile + jobs routes
- 03 Database schema — all four InsForge tables created: profiles, agent_runs, jobs, agent_logs
- 04 Smart redirect — on login check profiles.is_complete, redirect to /profile if incomplete, redirect to /dashboard if complete

---

## Phase 2 — Profile

- 05 Profile form — all fields, validation, save to InsForge profiles table via Server Action, completion indicator showing filled vs missing fields
- 06 Profile load — load existing profile data on page load, pre-fill form fields for returning users
- 07 Profile edit — user can update any field, re-save, updated_at and is_complete updated correctly

---

## Phase 3 — Resume

- 08 Resume generation — GPT-4o formats profile into ATS-friendly resume content, @react-pdf/renderer renders PDF, uploaded to InsForge Storage at resumes/{user_id}/resume.pdf, URL saved to profiles.resume_pdf_url
- 09 Resume preview — PDF preview shown on profile page, download button, regenerate button

---

## Phase 4 — Agent Core

- 10 Browserbase setup — session creation, session management in lib/browserbase.ts, connection verified
- 11 Stagehand setup — Stagehand initialisation with Browserbase session in lib/stagehand.ts, GPT-4o connected, connection verified
- 12 LinkedIn browsing — agent navigates LinkedIn job search with user job title and location, extracts job listings, filters external apply only, saves jobs to InsForge jobs table, logs to agent_logs
- 13 GPT-4o matching — scores each job 0–100 against user profile, generates match reason, saves score and reason to jobs table, routes 70%+ to auto-apply queue, below 70% to review queue

---

## Phase 5 — Auto Apply

- 14 Cover letter generation — GPT-4o generates custom cover letter per job using profile + job description + tone preference, saved to jobs.cover_letter
- 15 Apply agent — new Browserbase session per company careers page, Stagehand fills every form field using profile data, attaches resume PDF if file upload field exists, submits form, updates job status in InsForge DB, logs result to agent_logs
- 16 AgentSpan wrapping — apply loop wrapped with AgentSpan, each job application is a checkpointed step named apply-{job_id}, failed steps retry without restarting the whole batch, agentspan_run_id saved to agent_runs

---

## Phase 6 — Review Flow

- 17 Review queue — below-threshold jobs displayed with company, title, match score, match reason, dismiss button removes job from queue via Server Action
- 18 Job details page — full job description, match score, detailed match breakdown, current resume preview, tailor resume and apply button
- 19 Resume tailoring — GPT-4o rewrites resume for specific job emphasising matching skills, tailored PDF rendered and stored at resumes/{user_id}/{job_id}.pdf, URL saved to jobs.resume_url, is_tailored set to true
- 20 Manual apply — agent opens company careers page in new Browserbase session, fills form using profile + tailored resume, submits, status updated to applied

---

## Phase 7 — Dashboard

- 21 Agent controls — job title input, location input, Find Jobs button calls /api/agent/find, Stop button calls /api/agent/stop, controls disabled while agent is running
- 22 Stats bar — total found, auto applied, manually applied, match rate, success rate, reads from agent_runs table
- 23 Live agent feed — real-time log via InsForge Realtime subscription on agent_logs table, color coded by level, newest entries at top
- 24 Browserbase session recording — embedded session recording shown while agent is running, Browserbase session URL used as embed source
- 25 Auto-applied jobs table — all jobs with status applied or failed, columns: company, title, match score, status badge, applied at, expandable row showing cover letter and external URL
- 26 Dashboard incomplete profile banner — if profiles.is_complete is false show banner with link to profile page, hide banner when complete

---

## Phase 8 — Analytics

- 27 PostHog setup — PostHog initialised in app layout, server-side client in lib/posthog.ts, all events listed in code-standards.md added throughout the codebase
- 28 Analytics section — funnel chart (found → matched → applied), applications over time line chart, match score distribution bar chart, all powered by PostHog data

---

## Phase 9 — Deployment

- 29 Environment variables — all production environment variables configured in Vercel dashboard
- 30 Vercel deployment — project connected to GitHub repo, deployed to Vercel, production build passes with no errors
- 31 Production smoke test — full end-to-end run in production: sign up, fill profile, generate resume, find jobs, auto-apply, review queue, job details, manual apply, dashboard updates correctly

---

## Feature Count

| Phase                 | Features |
| --------------------- | -------- |
| Phase 1 — Foundation  | 4        |
| Phase 2 — Profile     | 3        |
| Phase 3 — Resume      | 2        |
| Phase 4 — Agent Core  | 4        |
| Phase 5 — Auto Apply  | 3        |
| Phase 6 — Review Flow | 4        |
| Phase 7 — Dashboard   | 6        |
| Phase 8 — Analytics   | 2        |
| Phase 9 — Deployment  | 3        |
| **Total**             | **31**   |
