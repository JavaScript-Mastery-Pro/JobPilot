# Architecture

## Stack

| Layer                          | Tool                     | Purpose                                               |
| ------------------------------ | ------------------------ | ----------------------------------------------------- |
| Framework                      | Next.js 16 (App Router)  | Full stack framework                                  |
| Auth + DB + Storage + Realtime | InsForge                 | Entire backend                                        |
| Cloud browser                  | Browserbase              | Cloud browser sessions for job discovery              |
| AI browser control             | Stagehand                | AI-driven page interaction and extraction             |
| AI model                       | OpenAI GPT-4o            | Matching, cover letters, resume tailoring, extraction |
| Analytics                      | PostHog                  | Event tracking and dashboard charts                   |
| PDF generation                 | @react-pdf/renderer      | Resume PDF rendering                                  |
| Styling                        | Tailwind CSS + shadcn/ui | UI components and styling                             |
| Language                       | TypeScript strict        | Throughout                                            |

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
│   │   └── page.tsx                       → Profile form + resume management
│   ├── jobs/
│   │   ├── page.tsx                       → Full paginated jobs list
│   │   └── [id]/
│   │       └── page.tsx                   → Individual job details page
│   └── api/
│       ├── agent/
│       │   ├── find/route.ts              → Trigger LinkedIn job discovery
│       │   └── fetch-url/route.ts         → Fetch and score a single job URL
│       ├── resume/
│       │   ├── generate/route.ts          → Generate base resume PDF from profile
│       │   ├── extract/route.ts           → Extract profile data from uploaded resume
│       │   └── tailor/route.ts            → Generate job-specific tailored resume PDF
│       ├── cover-letter/
│       │   └── generate/route.ts          → Generate cover letter for a job
│       └── jobs/
│           └── [id]/
│               └── score/route.ts         → Recalculate match score for a job
├── agent/
│   ├── linkedin.ts                        → LinkedIn browsing + extraction (context required)
│   ├── matcher.ts                         → GPT-4o job matching logic
│   ├── extractor.ts                       → GPT-4o job description extraction + structuring
│   ├── cover-letter.ts                    → GPT-4o cover letter generation
│   ├── resume.ts                          → Resume tailoring + PDF generation
│   └── types.ts                           → Agent-specific TypeScript types
├── actions/
│   ├── profile.ts                         → Profile save + update
│   └── jobs.ts                            → Dismiss job, update job-specific profile
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
│   │   ├── UrlInput.tsx
│   │   ├── LiveFeed.tsx
│   │   ├── LiveBrowserEmbed.tsx
│   │   ├── RecentJobs.tsx
│   │   └── AnalyticsSection.tsx
│   ├── profile/
│   │   ├── ProfileForm.tsx
│   │   ├── ResumeUpload.tsx
│   │   ├── ResumePreview.tsx
│   │   ├── ConnectedAccounts.tsx
│   │   └── CompletionIndicator.tsx
│   ├── jobs/
│   │   ├── JobCard.tsx
│   │   ├── JobFilters.tsx
│   │   └── JobsPagination.tsx
│   └── job-details/
│       ├── JobInfo.tsx
│       ├── MatchScore.tsx
│       ├── JobDescription.tsx
│       ├── ResumeSection.tsx
│       ├── JobProfileForm.tsx
│       ├── CoverLetter.tsx
│       └── JobActions.tsx
├── lib/
│   ├── insforge-client.ts                 → InsForge browser client instance
│   ├── insforge-server.ts                 → InsForge server client (takes accessToken)
│   ├── browserbase.ts                     → Browserbase session creation + management
│   ├── stagehand.ts                       → Stagehand initialisation with Browserbase session
│   ├── posthog-client.ts                  → PostHog browser client
│   ├── posthog-server.ts                  → PostHog server client
│   └── utils.ts                           → Shared utility functions
└── types/
    └── index.ts                           → Global TypeScript types
```

---

## System Boundaries

| Folder        | Owns                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `app/`        | Pages and API routes only. No business logic.                                                                         |
| `agent/`      | All agent logic. LinkedIn browsing, matching, extraction, cover letter, resume tailoring. Nothing here touches React. |
| `actions/`    | Server Actions for UI-triggered mutations only. Profile save, job dismiss, job-specific profile updates.              |
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
User clicks Find Jobs or submits URL
        ↓
API route in app/api/agent/
        ↓
Calls agent/ functions
        ↓
Each source runs independently in parallel
        ↓
Agent writes results to InsForge DB
        ↓
InsForge Realtime pushes updates
        ↓
Dashboard updates live
```

### Resume Operations (API Routes)

```
User uploads resume or clicks Generate/Tailor
        ↓
API route in app/api/resume/
        ↓
GPT-4o processes content
        ↓
@react-pdf/renderer renders PDF
        ↓
PDF uploaded to InsForge Storage
        ↓
URL saved to profiles or jobs table
```

### Job Score Recalculation

```
User edits job-specific profile form or tailors resume
        ↓
API route in app/api/jobs/[id]/score/
        ↓
GPT-4o scores job against job-specific profile snapshot
        ↓
tailored_match_score updated in jobs table
        ↓
Score comparison shown: original vs tailored
```

---

## InsForge Database Schema

### `profiles`

| Column              | Type        | Notes                                        |
| ------------------- | ----------- | -------------------------------------------- |
| id                  | uuid        | References auth.users                        |
| full_name           | text        |                                              |
| email               | text        | Pre-filled from auth                         |
| phone               | text        |                                              |
| location            | text        | City, country                                |
| current_title       | text        | Most recent job title                        |
| experience_level    | text        | junior / mid / senior / lead                 |
| years_experience    | integer     |                                              |
| skills              | text[]      | Array of skill tags                          |
| industries          | text[]      | Industries worked in                         |
| work_experience     | jsonb       | Array of up to 3 roles                       |
| education           | jsonb       | Degree, field, institution, year             |
| job_titles_seeking  | text[]      | Roles they want                              |
| remote_preference   | text        | remote / onsite / hybrid / any               |
| preferred_locations | text[]      | Optional preferred locations                 |
| salary_expectation  | text        | Optional                                     |
| cover_letter_tone   | text        | formal / casual / enthusiastic               |
| linkedin_url        | text        |                                              |
| portfolio_url       | text        |                                              |
| work_authorization  | text        | citizen / permanent_resident / visa_required |
| resume_pdf_url      | text        | InsForge Storage URL of current resume       |
| linkedin_context_id | text        | Browserbase Context ID for LinkedIn session  |
| linkedin_connected  | boolean     | True when LinkedIn context is saved          |
| is_complete         | boolean     | True when all required fields filled         |
| created_at          | timestamptz |                                              |
| updated_at          | timestamptz |                                              |

### `agent_runs`

| Column             | Type        | Notes                                  |
| ------------------ | ----------- | -------------------------------------- |
| id                 | uuid        |                                        |
| user_id            | uuid        | References profiles                    |
| status             | text        | running / completed / stopped / failed |
| job_title_searched | text        |                                        |
| location_searched  | text        |                                        |
| sources            | text[]      | Which sources were browsed             |
| jobs_found         | integer     | Total across all sources               |
| jobs_matched       | integer     | Score >= match threshold               |
| started_at         | timestamptz |                                        |
| completed_at       | timestamptz |                                        |
| live_view_url      | text        | Browserbase live view URL              |

### `jobs`

| Column                | Type        | Notes                                          |
| --------------------- | ----------- | ---------------------------------------------- |
| id                    | uuid        |                                                |
| run_id                | uuid        | References agent_runs — null if from URL input |
| user_id               | uuid        | References profiles                            |
| source                | text        | linkedin / url                                 |
| source_url            | text        | Original job listing URL                       |
| external_apply_url    | text        | Direct company apply URL                       |
| title                 | text        |                                                |
| company               | text        |                                                |
| location              | text        |                                                |
| salary                | text        | If available                                   |
| job_type              | text        | fulltime / parttime / contract                 |
| about_role            | text        | 2-3 sentence summary                           |
| responsibilities      | text[]      | Bullet points                                  |
| requirements          | text[]      | Bullet points                                  |
| nice_to_have          | text[]      | Optional                                       |
| benefits              | text[]      | Optional                                       |
| about_company         | text        | Brief company description                      |
| match_score           | integer     | 0-100 scored against main profile              |
| match_reason          | text        | GPT-4o explanation                             |
| matched_skills        | text[]      | Skills user has that match                     |
| missing_skills        | text[]      | Skills user lacks                              |
| cover_letter          | text        | Generated cover letter                         |
| tailored_resume_url   | text        | InsForge Storage URL of tailored resume        |
| tailored_profile_data | jsonb       | Job-specific profile snapshot                  |
| tailored_match_score  | integer     | Score after tailoring                          |
| is_tailored           | boolean     | Default false                                  |
| status                | text        | found / dismissed                              |
| found_at              | timestamptz |                                                |
| dismissed_at          | timestamptz |                                                |

### `agent_logs`

| Column     | Type        | Notes                            |
| ---------- | ----------- | -------------------------------- |
| id         | uuid        |                                  |
| run_id     | uuid        | References agent_runs            |
| user_id    | uuid        | References profiles              |
| message    | text        | Human readable log entry         |
| level      | text        | info / success / warning / error |
| source     | text        | Which source this log is from    |
| job_id     | uuid        | Optional — related job           |
| created_at | timestamptz |                                  |

---

## InsForge Storage

| Bucket  | Path                                    | Contents                         |
| ------- | --------------------------------------- | -------------------------------- |
| resumes | resumes/{user_id}/resume.pdf            | Current active resume PDF        |
| resumes | resumes/{user_id}/{job_id}-tailored.pdf | Tailored resume for specific job |

Access: authenticated users only, own files only.

---

## Authentication

- Provider: InsForge Auth
- Methods: Google OAuth, GitHub OAuth
- Protected routes: /dashboard, /profile, /jobs, /jobs/[id]
- Public routes: /, /login
- Middleware in middleware.ts checks session on every protected route
- On login: check profiles.is_complete → redirect to /profile if false, /dashboard if true

---

## InsForge Client Pattern

Two separate InsForge instances — never mix them:

```typescript
// lib/insforge-client.ts
// Browser-side — used in client components for auth state and realtime
import { createBrowserClient } from "@insforge/client";
export const insforge = createBrowserClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL!,
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
);

// lib/insforge-server.ts
// Server-side — used in API routes, Server Actions, agent code
// Always pass accessToken for RLS to work correctly
import { createServerClient } from "@insforge/client";
export const createInsforgeServer = (accessToken: string) =>
  createServerClient(
    process.env.NEXT_PUBLIC_INSFORGE_URL!,
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    { accessToken },
  );
```

---

## Realtime

InsForge Realtime powers the live dashboard feed.

| Table      | Event  | Dashboard reaction                  |
| ---------- | ------ | ----------------------------------- |
| agent_logs | INSERT | New entry appears in live feed      |
| jobs       | INSERT | New job card appears in recent jobs |
| agent_runs | UPDATE | Stats bar numbers update            |

---

## Browserbase Session Pattern

```typescript
// Always create a fresh session per agent run
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
});

// For LinkedIn — use saved context
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  browserSettings: {
    context: {
      id: profile.linkedin_context_id,
      persist: true,
    },
  },
});

// Get live view URL for dashboard embed
const { debuggerFullscreenUrl } = await bb.sessions.debug(session.id);
```

---

## Job Discovery Pattern

Two methods for job discovery:

**Method 1 — LinkedIn (automated)**

```typescript
// Only runs if user has connected LinkedIn
if (profile.linkedin_connected && profile.linkedin_context_id) {
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    browserSettings: {
      context: {
        id: profile.linkedin_context_id,
        persist: true,
      },
    },
  });
  // Browse LinkedIn job search with Stagehand
}
```

**Method 2 — URL input (manual)**

```typescript
// User pastes any job URL — fetch and score it
const response = await bb.fetchAPI.create({ url: jobUrl });
// GPT-4o extracts structured job data from response.content
// GPT-4o scores against user profile
// Saved to jobs table with source: 'url', run_id: null
```

---

## Invariants

Rules Claude must never violate:

- API routes contain no UI logic. Components contain no DB logic.
- Agent code in `/agent` never imports from `/components` or `/actions`.
- Server Actions never call agent functions. Agent functions are only called from API routes.
- All InsForge server-side writes use `createInsforgeServer(accessToken)` — never the browser client.
- No hardcoded hex values or raw Tailwind color classes in components — use CSS variables from ui-tokens.md.
- Every Stagehand action is wrapped in try/catch. Failures are logged to agent_logs, never thrown to crash the run.
- `profiles` table is never modified by resume tailoring. Tailoring only writes to `jobs.tailored_profile_data` and `jobs.tailored_resume_url`.
- `jobs.tailored_profile_data` is always a complete profile snapshot — never a partial update.
- `run_id` is null on jobs created from URL input — always handle this null case.
- LinkedIn context is only used when `profiles.linkedin_connected` is true AND `profiles.linkedin_context_id` is not null — always check both.
- Match score recalculation uses `jobs.tailored_profile_data` when `jobs.is_tailored` is true, main profile otherwise.
