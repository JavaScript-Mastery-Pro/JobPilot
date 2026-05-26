# JobPilot

JobPilot is a job discovery and match-tracking tool for technical job seekers. It discovers jobs from LinkedIn using saved Browserbase browser sessions, scores each listing against your profile, organizes source and apply links, and lets you generate and tailor resumes for individual roles.

An experimental Browserbase/Stagehand apply path is included for review — see [BROWSERBASE_REPORT.md](BROWSERBASE_REPORT.md) for full details on what was attempted and where it currently stands.

---

## Features

- **LinkedIn job discovery** — authenticated LinkedIn search using a saved Browserbase context session, fetching job titles, companies, locations, and source/apply URLs
- **Match scoring** — each discovered job is scored against your profile by an LLM and ranked by match percentage
- **Job inventory** — a filterable table of matched jobs with source links, external apply links, apply type, and status
- **Job details** — per-job review page with match breakdown, description, resume controls, and apply attempt trigger
- **Resume generation and tailoring** — generate a base resume from your profile, then tailor it to a specific job description
- **LinkedIn Easy Apply** — experimental LinkedIn Easy Apply path using saved LinkedIn context and Stagehand DOM mode
- **External apply attempt** — experimental external ATS form-filling path using Stagehand hybrid mode (see Browserbase report)
- **Session recordings** — Browserbase session recording URLs saved per apply attempt for review

---

## Tech Stack

- **Next.js 15** (App Router, Server Actions, API Routes)
- **InsForge** — PostgreSQL database, auth, and file storage
- **Browserbase** — cloud browser sessions with context persistence and CAPTCHA solving
- **Stagehand** — AI browser agent on top of Browserbase
- **AgentSpan** — durable agent orchestration with idempotency
- **OpenAI GPT-4o** — matching, cover letter generation, resume tailoring, and form-filling agent
- **Tailwind CSS v3.4** + shadcn/ui

---

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd JobPilot
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
# InsForge (backend database + auth)
NEXT_PUBLIC_INSFORGE_URL=https://your-app.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-insforge-anon-key
INSFORGE_SERVICE_ROLE_KEY=your-insforge-service-role-key

# Browserbase
BROWSERBASE_API_KEY=your-browserbase-api-key
BROWSERBASE_PROJECT_ID=your-browserbase-project-id

# Optional: enable Browserbase advanced stealth mode
# BROWSERBASE_ADVANCED_STEALTH=true

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# AgentSpan (durable agent orchestration)
AGENTSPAN_API_KEY=your-agentspan-api-key

# App URL (used for OAuth callback and AgentSpan webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: PostHog analytics
# NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
# NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How It Works

1. **Set up your profile** — fill in your experience, skills, target role, salary expectations, and upload a base resume PDF
2. **Connect LinkedIn** — save a LinkedIn browser session via Browserbase so job discovery can run authenticated
3. **Find Jobs** — the agent searches LinkedIn for roles matching your target, scores each one, and saves strong matches to your job inventory
4. **Review matches** — browse the `/jobs` list, click into any role for the full description, match breakdown, and apply links
5. **Tailor and apply** — generate a tailored resume for a specific role, then use the apply links directly or trigger the experimental Browserbase apply attempt

---

## Browserbase Integration

See [BROWSERBASE_REPORT.md](BROWSERBASE_REPORT.md) for a detailed report on how Browserbase and Stagehand are used in this project, including the full history of the apply automation experiments and the current project state.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
