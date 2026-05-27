# Build Plan

## Core Principle

UI and logic built together for every feature. Every feature must be visible and testable before moving to the next. No invisible backend phases. No building logic without something to click and verify immediately.

---

## Phase 1 — Foundation

### 01 Homepage

Build the complete homepage UI and content.

**UI:**

- Navbar with logo and Sign In button
- Hero section — headline, subheadline, Get Started CTA button
- How it works — 3 steps with icons: Set up profile → Find jobs → Review and apply
- Features section — 4 key features with icons and descriptions
- Footer with links
- Fully responsive

**Logic:**

- Get Started CTA → /login if not authenticated, /dashboard if authenticated
- Sign In button → /login

**Test:** Visit homepage. All sections visible. CTA button navigates correctly.

---

### 02 Auth

InsForge authentication.

**UI:**

- Login page — clean card with Google and GitHub OAuth buttons

**Logic:**

- Google OAuth via InsForge
- GitHub OAuth via InsForge
- OAuth callback handler
- Session management
- Middleware protecting /dashboard, /profile, /jobs, /jobs/[id]

**Test:** Click Sign in with Google. Complete OAuth. Session created. Redirected correctly.

---

### 03 Database Schema

All InsForge tables created before any data is written.

**Logic:**

- Create `profiles` table with all columns from architecture.md
- Create `agent_runs` table
- Create `jobs` table with all columns including tailored fields
- Create `agent_logs` table
- Create `resumes` storage bucket
- Row level security policies on all tables

**Test:** Open InsForge dashboard. All four tables visible with correct columns. Storage bucket exists.

---

## Phase 2 — Profile + Resume

### 04 Profile Page UI

Build the full profile form UI. No save logic yet.

**UI:**

- Page layout with completion indicator
- Personal info section — name, email, phone, location, LinkedIn URL, portfolio URL, work authorization
- Professional info section — current title, experience level, years experience, skills tag input, industries
- Work experience section — up to 3 roles, company, title, dates, responsibilities
- Education section — degree, field, institution, graduation year
- Job preferences section — job titles seeking, remote preference, preferred locations, salary, cover letter tone
- Resume upload section — drag and drop PDF upload, file name display
- Save button

**Test:** Visit /profile. Full form visible. All fields interactive. Upload a PDF — filename shows.

---

### 05 Profile Save Logic

Wire the profile form to InsForge DB.

**Logic:**

- Server Action saves all form fields to profiles table
- Resume PDF uploaded to InsForge Storage at resumes/{user_id}/resume.pdf
- resume_pdf_url saved to profiles table
- is_complete set to true when all required fields filled
- Completion indicator updates as fields are filled
- Form pre-fills with existing data on return visits

**Test:** Fill form completely. Click Save. Check InsForge DB — profile row exists with all fields. Resume PDF in storage bucket.

---

### 06 AI Profile Extraction

Extract from Resume button — GPT-4o reads uploaded resume and fills form fields.

**UI:**

- Extract from Resume button appears after resume is uploaded
- Loading state while processing
- Form fields populate automatically after extraction
- User reviews and corrects if needed

**Logic:**

- pdf-parse extracts raw text from uploaded PDF
- GPT-4o reads text and returns structured JSON matching profile fields
- Form fields populated with extracted data
- User can edit anything before saving

**Test:** Upload a real resume PDF. Click Extract from Resume. Watch form fields populate. Verify data accuracy.

---

### 07 Smart Redirect

Route users based on profile completion status.

**Logic:**

- On login check profiles.is_complete
- is_complete false or profile missing → redirect to /profile
- is_complete true → redirect to /dashboard
- Dashboard shows incomplete profile banner if is_complete is false
- Banner links to /profile
- Banner disappears when profile is complete

**Test:** Log in with incomplete profile → lands on /profile. Complete profile → log in again → lands on /dashboard.

---

## Phase 3 — Dashboard Shell

### 08 Dashboard UI Shell

Build the dashboard layout with all sections visible. Static empty state.

**UI:**

- Stats bar — Jobs Found, Resumes Tailored, Cover Letters Generated (all zeros)
- Agent controls section — Find Jobs button, URL paste input with Fetch Job button
- Live browser embed placeholder — empty state
- Live agent feed — empty state
- Recent jobs section — empty state
- Analytics section — empty charts placeholder
- Incomplete profile banner if profile not complete

**Logic:**

- PostHog initialised in app layout
- posthog-client.ts and posthog-server.ts set up
- dashboard_viewed event fires on page load

**Test:** Visit /dashboard. All sections visible. Empty states show correctly. PostHog dashboard shows dashboard_viewed event.

---

## Phase 4 — LinkedIn Connection

### 09 Connect LinkedIn

User connects their LinkedIn account via Browserbase Context live view.

**UI:**

- Connected Accounts section on profile page
- Connect LinkedIn button
- Live view modal — real browser embedded inside app
- User logs in manually inside modal
- I'm logged in button
- Status updates to LinkedIn Connected

**Logic:**

- Browserbase session creation in lib/browserbase.ts
- Stagehand initialisation in lib/stagehand.ts
- POST /api/linkedin/connect — creates Browserbase Context, returns live view URL
- Live view URL embedded in modal iframe
- POST /api/linkedin/save-context — saves context ID to profiles.linkedin_context_id
- profiles.linkedin_connected set to true

**Test:** Click Connect LinkedIn. Modal opens with real browser. Log in to LinkedIn manually. Click I'm logged in. Check profiles table — linkedin_context_id populated, linkedin_connected true.

---

## Phase 5 — Job Discovery

### 10 LinkedIn Job Discovery

Agent browses LinkedIn job search using saved context and extracts listings.

**UI:**

- Find Jobs button on dashboard becomes active when LinkedIn connected
- Job title and location inputs appear
- Loading state while agent runs
- Live browser embed shows actual Browserbase session browsing LinkedIn
- Jobs appear in Recent Jobs section as they are found
- Live agent feed shows activity

**Logic:**

- POST /api/agent/find — triggers LinkedIn browsing
- agent/sources/linkedin.ts — creates session with saved linkedin_context_id
- Stagehand navigates LinkedIn job search with user's job title and location
- Extracts job listings — title, company, location, source URL
- For each job — Browserbase Fetch API gets job description page
- GPT-4o structures job description into clean fields
- GPT-4o scores job against user profile
- Job saved to InsForge jobs table with source: 'linkedin'
- agent_logs updated with each action
- Live view URL saved to agent_runs for dashboard embed

**Test:** Click Find Jobs. Watch Browserbase session open in live embed browsing LinkedIn. Jobs appear in dashboard in real time. Check InsForge DB — jobs table has entries with correct fields and source: 'linkedin'.

---

### 11 URL Input Discovery

User pastes any job URL from any platform — agent fetches and scores it.

**UI:**

- URL input field on dashboard
- Fetch Job button
- Loading state
- Job appears in Recent Jobs section with match score

**Logic:**

- POST /api/agent/fetch-url
- Browserbase Fetch API retrieves page content from URL
- GPT-4o extracts structured job data — title, company, description, requirements, benefits
- GPT-4o scores job against user profile
- Job saved to jobs table with source: 'url', run_id: null

**Test:** Paste a real job URL from LinkedIn, Indeed, or any company career page. Click Fetch Job. Job appears with match score and structured description.

---

## Phase 6 — Jobs Page

### 12 Jobs Page

Full paginated list of all discovered jobs.

**UI:**

- Filter tabs — All / High Match / Low Match / Tailored / Dismissed
- Job cards — company, title, match score badge, source badge, location, date found
- Pagination
- Click job card → /jobs/[id]

**Logic:**

- Reads from InsForge jobs table for current user
- Filter logic per tab
- Pagination — 20 jobs per page

**Test:** Jobs page shows all discovered jobs. Filters work correctly. Clicking a job navigates to details page.

---

## Phase 7 — Job Details Page

### 13 Job Details Page

Full job details page wired to real data.

**UI:**

- Job info header — title, company, location, salary, source badge, date
- Match score section — score number, visual indicator, matched skills, missing skills, match reason
- Job description section — About the Role, Responsibilities, Requirements, Nice to Have, Benefits, About Company
- Resume section — current resume filename, Tailor Resume button, download link
- Cover letter section — empty state, Generate Cover Letter button
- Job-specific profile form — editable fields, Recalculate Score button
- Apply Now button — links to external_apply_url
- Dismiss Job button

**Test:** Navigate to a job. All sections visible with real data from DB. Match score and skills show correctly.

---

### 14 Cover Letter Generation

GPT-4o generates personalized cover letter per job.

**UI:**

- Generate Cover Letter button on job details page
- Loading state while generating
- Cover letter appears in section
- Copy button
- Regenerate button

**Logic:**

- POST /api/cover-letter/generate
- GPT-4o reads job description + user profile + cover letter tone preference
- Cover letter saved to jobs.cover_letter

**Test:** Click Generate Cover Letter. Cover letter appears. Content is relevant to the specific job. Copy button works.

---

### 15 Resume Tailoring

GPT-4o rewrites resume for specific job.

**UI:**

- Tailor Resume button on job details page
- Warning modal — This will replace your current resume PDF. Your profile data will not change.
- Loading state while tailoring
- After tailoring — score comparison shown
- Regenerate Resume button appears

**Logic:**

- POST /api/resume/tailor
- GPT-4o rewrites resume content to match job description
- @react-pdf/renderer renders new PDF
- New PDF overwrites resumes/{user_id}/resume.pdf in InsForge Storage
- Tailored resume also saved at resumes/{user_id}/{job_id}-tailored.pdf
- Tailored PDF URL saved to jobs.tailored_resume_url
- Resume parsed → job-specific profile snapshot saved to jobs.tailored_profile_data
- jobs.is_tailored set to true
- Match score recalculated using tailored_profile_data
- jobs.tailored_match_score updated
- Score comparison displayed

**Test:** Click Tailor Resume. Confirm warning. New PDF generated. Score updates. Comparison shown.

---

### 16 Job-Specific Profile Editing + Score Recalculation

User edits job-specific profile form and recalculates score.

**UI:**

- Job-specific profile form pre-filled from tailored_profile_data
- Editable fields
- Recalculate Score button
- Score updates after recalculation

**Logic:**

- Server Action saves edits to jobs.tailored_profile_data only — never touches profiles table
- POST /api/jobs/[id]/score — GPT-4o rescores using updated tailored_profile_data
- jobs.tailored_match_score updated
- Score comparison updated

**Test:** Edit a field in job profile form. Click Recalculate Score. Score updates. Check profiles table — main profile unchanged.

---

## Phase 8 — Dashboard Complete

### 17 Live Agent Feed

Real-time log via InsForge Realtime.

**UI:**

- Live feed section shows log entries appearing in real time
- Color coded by level — info, success, warning, error
- Newest entries at top
- Timestamps

**Logic:**

- InsForge Realtime subscription on agent_logs table
- New INSERT events push to feed immediately

**Test:** Run a job search. Watch log entries appear live without refreshing.

---

### 18 Stats Bar

Dashboard stats populated from real data.

**UI:**

- Jobs Found count
- Resumes Tailored count
- Cover Letters Generated count

**Logic:**

- Reads from agent_runs and jobs tables
- Updates via InsForge Realtime subscription on jobs table

**Test:** Run a search. Stats update in real time as jobs are found.

---

### 19 Analytics Section

PostHog-powered charts on dashboard.

**UI:**

- Jobs found over time — line chart
- Match score distribution — bar chart
- Resume tailoring activity

**Logic:**

- PostHog server-side client queries event data
- Charts rendered with recharts

**Test:** After several agent runs, charts show meaningful data.

---

## Phase 9 — Deployment

### 20 Environment Variables

All production env vars configured in Vercel dashboard.

### 21 Vercel Deployment

Project connected to GitHub, deployed, production build passes with no errors.

### 22 Production Smoke Test

Full end-to-end run in production:

- Sign up → complete profile → upload resume → extract profile
- Connect LinkedIn → find jobs
- Paste a job URL
- Open job details — generate cover letter, tailor resume
- Edit job profile form — recalculate score
- Dismiss a job
- Dashboard updates correctly throughout

---

## Feature Count

| Phase                         | Features |
| ----------------------------- | -------- |
| Phase 1 — Foundation          | 3        |
| Phase 2 — Profile + Resume    | 4        |
| Phase 3 — Dashboard Shell     | 1        |
| Phase 4 — LinkedIn Connection | 1        |
| Phase 5 — Job Discovery       | 2        |
| Phase 6 — Jobs Page           | 1        |
| Phase 7 — Job Details         | 4        |
| Phase 8 — Dashboard Complete  | 3        |
| Phase 9 — Deployment          | 3        |
| **Total**                     | **22**   |
