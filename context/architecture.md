# Architecture

## Stack

| Layer                          | Tool                     | Purpose                                                  |
| ------------------------------ | ------------------------ | -------------------------------------------------------- |
| Framework                      | Next.js 16 (App Router)  | Full stack framework                                     |
| Auth + DB + Storage + Realtime | InsForge                 | Entire backend                                           |
| Cloud browser                  | Browserbase              | Cloud browser sessions                                   |
| AI browser control             | Stagehand                | AI-driven page interaction                               |
| AI model                       | OpenAI GPT-4o            | Matching, form filling, cover letters, resume generation |
| Agent durability               | AgentSpan                | Keeps agent alive across long runs                       |
| Analytics                      | PostHog                  | Event tracking and dashboard charts                      |
| PDF generation                 | @react-pdf/renderer      | Resume PDF rendering                                     |
| Styling                        | Tailwind CSS + shadcn/ui | UI components and styling                                |
| Language                       | TypeScript               | Strict throughout                                        |

---

## Folder Structure

```
/
├── CLAUDE.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── app/
│   ├── layout.tsx                          → Root layout, PostHog provider
│   ├── page.tsx                            → Homepage
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                   → Login page
│   │   └── callback/
│   │       └── page.tsx                   → OAuth callback handler
│   ├── dashboard/
│   │   └── page.tsx                       → Main dashboard
│   ├── profile/
│   │   └── page.tsx                       → Profile form + resume builder
│   ├── jobs/
│   │   └── [id]/
│   │       └── page.tsx                   → Job details page
│   └── api/
│       ├── agent/
│       │   ├── find/route.ts              → Trigger LinkedIn browsing
│       │   ├── apply/route.ts             → Trigger auto-apply loop
│       │   └── stop/route.ts             → Stop active agent run
│       ├── resume/
│       │   ├── generate/route.ts          → Generate base resume PDF
│       │   └── tailor/route.ts            → Generate job-specific resume PDF
│       └── jobs/
│           └── [id]/
│               └── apply/route.ts         → Manual apply from job details
├── agent/
│   ├── index.ts                           → AgentSpan entry point
│   ├── linkedin.ts                        → LinkedIn browsing + extraction
│   ├── apply.ts                           → Company page form filling
│   ├── matcher.ts                         → GPT-4o job matching logic
│   ├── cover-letter.ts                    → GPT-4o cover letter generation
│   └── types.ts                           → Agent-specific TypeScript types
├── actions/
│   ├── profile.ts                         → Profile save + update
│   ├── jobs.ts                            → Dismiss job, update status
│   └── resume.ts                          → Trigger resume generation
├── components/
│   ├── ui/                                → shadcn/ui components only
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── homepage/
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   └── Features.tsx
│   ├── dashboard/
│   │   ├── StatsBar.tsx
│   │   ├── AgentControls.tsx
│   │   ├── LiveFeed.tsx
│   │   ├── SessionRecording.tsx
│   │   ├── AutoAppliedTable.tsx
│   │   ├── ReviewQueue.tsx
│   │   └── AnalyticsSection.tsx
│   ├── profile/
│   │   ├── ProfileForm.tsx
│   │   ├── ResumePreview.tsx
│   │   └── CompletionIndicator.tsx
│   └── jobs/
│       ├── JobDetails.tsx
│       ├── MatchBreakdown.tsx
│       └── TailorAndApply.tsx
├── lib/
│   ├── insforge.ts                        → InsForge browser client
│   ├── insforge-server.ts                 → InsForge server client
│   ├── browserbase.ts                     → Browserbase session management
│   ├── stagehand.ts                       → Stagehand initialisation
│   ├── posthog.ts                         → PostHog client + event helpers
│   └── utils.ts                           → Shared utility functions
└── types/
    └── index.ts                           → Global TypeScript types
```

---

## System Boundaries

### What lives where

| Folder        | Owns                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `app/`        | Pages and API routes only. No business logic.                                                                         |
| `agent/`      | All agent logic. LinkedIn browsing, matching, form filling, cover letter generation. Nothing from here touches React. |
| `actions/`    | Server Actions for UI-triggered mutations only. Profile save, job dismiss, status updates from UI.                    |
| `components/` | UI only. No data fetching logic. No direct DB calls.                                                                  |
| `lib/`        | Third party client initialisation and shared utilities only.                                                          |
| `types/`      | TypeScript types shared across the project.                                                                           |

---

## Data Flow

### UI Mutations (Server Actions)

```
User interaction in component
        ↓
Server Action in actions/
        ↓
InsForge DB write
        ↓
Revalidate or redirect
```

### Agent Operations (API Routes)

```
User clicks Find Jobs or Apply
        ↓
API route in app/api/agent/
        ↓
Calls agent/ functions
        ↓
Agent writes results to InsForge DB
        ↓
InsForge Realtime pushes updates
        ↓
Dashboard updates live
```

### Resume Generation (API Routes)

```
User clicks Generate Resume or Tailor Resume
        ↓
API route in app/api/resume/
        ↓
GPT-4o generates resume content
        ↓
@react-pdf/renderer renders PDF
        ↓
PDF uploaded to InsForge Storage
        ↓
URL saved to profiles table
```

---

## InsForge Database Schema

### `profiles`

| Column            | Type        | Notes                                |
| ----------------- | ----------- | ------------------------------------ |
| id                | uuid        | References auth.users                |
| full_name         | text        |                                      |
| email             | text        |                                      |
| phone             | text        |                                      |
| location          | text        |                                      |
| job_title         | text        | Job they are seeking                 |
| experience_level  | text        | junior / mid / senior / lead         |
| years_experience  | integer     |                                      |
| skills            | text[]      | Array of skills                      |
| remote_preference | text        | remote / onsite / hybrid / any       |
| cover_letter_tone | text        | formal / casual / enthusiastic       |
| linkedin_url      | text        |                                      |
| portfolio_url     | text        |                                      |
| resume_pdf_url    | text        | InsForge Storage URL                 |
| is_complete       | boolean     | True when all required fields filled |
| created_at        | timestamptz |                                      |
| updated_at        | timestamptz |                                      |

### `agent_runs`

| Column             | Type        | Notes                                                       |
| ------------------ | ----------- | ----------------------------------------------------------- |
| id                 | uuid        |                                                             |
| user_id            | uuid        | References profiles                                         |
| status             | text        | running / finding / applying / completed / stopped / failed |
| job_title_searched | text        |                                                             |
| location_searched  | text        |                                                             |
| jobs_found         | integer     |                                                             |
| jobs_matched       | integer     | 70%+ score                                                  |
| jobs_applied       | integer     |                                                             |
| jobs_failed        | integer     |                                                             |
| jobs_in_review     | integer     | Below 70%                                                   |
| started_at         | timestamptz |                                                             |
| completed_at       | timestamptz |                                                             |
| agentspan_run_id   | text        |                                                             |

### `jobs`

| Column             | Type        | Notes                                                    |
| ------------------ | ----------- | -------------------------------------------------------- |
| id                 | uuid        |                                                          |
| run_id             | uuid        | References agent_runs                                    |
| user_id            | uuid        | References profiles                                      |
| title              | text        |                                                          |
| company            | text        |                                                          |
| location           | text        |                                                          |
| linkedin_url       | text        | Original listing URL                                     |
| external_apply_url | text        | Company careers page                                     |
| description        | text        | Full job description                                     |
| match_score        | integer     | 0–100                                                    |
| match_reason       | text        | Why it scored this way                                   |
| status             | text        | found / queued / applying / applied / failed / dismissed |
| cover_letter       | text        | Generated cover letter                                   |
| resume_url         | text        | Original or tailored resume used                         |
| is_tailored        | boolean     | Was resume tailored for this job                         |
| found_at           | timestamptz |                                                          |
| applied_at         | timestamptz |                                                          |
| error_message      | text        | If failed                                                |

### `agent_logs`

| Column     | Type        | Notes                            |
| ---------- | ----------- | -------------------------------- |
| id         | uuid        |                                  |
| run_id     | uuid        | References agent_runs            |
| user_id    | uuid        | References profiles              |
| message    | text        | Human readable log entry         |
| level      | text        | info / success / warning / error |
| job_id     | uuid        | Optional — related job           |
| created_at | timestamptz |                                  |

---

## InsForge Storage

| Bucket  | Path                           | Contents                |
| ------- | ------------------------------ | ----------------------- |
| resumes | resumes/{user_id}/resume.pdf   | Base resume PDF         |
| resumes | resumes/{user_id}/{job_id}.pdf | Tailored resume per job |

Access: authenticated users only, own files only.

---

## Authentication

- Provider: InsForge Auth
- Methods: Google OAuth, GitHub OAuth
- Protected routes: /dashboard, /profile, /jobs/[id]
- Public routes: /, /login
- Middleware checks session on every protected route
- On login: check profiles.is_complete → redirect to /profile or /dashboard

---

## Realtime

InsForge Realtime powers the live dashboard feed.

| Table      | Event  | Dashboard reaction             |
| ---------- | ------ | ------------------------------ |
| agent_logs | INSERT | New entry appears in live feed |
| jobs       | INSERT | New job card appears in table  |
| jobs       | UPDATE | Status badge updates in place  |
| agent_runs | UPDATE | Stats bar numbers update       |

---

## Invariants

Rules Claude must never violate:

- API routes do not contain UI logic. Components do not contain DB logic.
- Agent code in `/agent` never imports from `/components` or `/actions`.
- Server Actions never call agent functions. Agent functions are only called from API routes.
- All InsForge DB writes from the agent go through `/lib/insforge-server.ts` only.
- No hardcoded hex values or raw Tailwind color classes anywhere in components.
- Every Stagehand action is wrapped in try/catch. Failures are logged to agent_logs, never thrown to crash the run.
- Resume PDF URL is always a valid InsForge Storage URL before being passed to the agent.
- Easy Apply is never touched. Agent only processes jobs with external apply URLs.
- Match threshold is 70. Never hardcoded in components — always read from a single config constant.
- AgentSpan step IDs always use job ID format: apply-{job_id}. Ensures idempotency on retry.
