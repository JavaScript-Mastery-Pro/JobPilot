# JobPilot

## Overview

A full stack AI-powered job application agent. The user sets up their profile once, hits a button, and the agent autonomously discovers public company and ATS job postings, scores job listings against their profile using GPT-4o, and applies to the best matches on company career pages — automatically.

Jobs that score below the match threshold go into a review queue where the user can open the job details, let AI tailor their resume specifically for that role, and apply with one click.

The entire process is tracked on a live dashboard with real-time status updates, analytics, and an embedded browser session recording.

---

## Problem It Will Solve

Applying to jobs manually is one of the most repetitive and time-consuming tasks a developer faces. The same form, the same resume, the same cover letter — submitted dozens of times with minimal return.

AI should have solved this already. This project does.

It also serves as the proof of concept for the Directed AI Development workflow — a system where the engineer architects the structure and AI executes the implementation. The job agent is the most compelling real-world demonstration of what that workflow produces.

---

## Pages

```
/               → Homepage
/login          → Auth page (Google + GitHub OAuth)
/dashboard      → Main control center
/profile        → Profile form + resume builder
/jobs/[id]      → Job details page
```

---

## Navigation

Top navbar. No sidebar. Three navigation items: Dashboard, Profile, and a Find Jobs CTA button. Full width layout on all pages.

---

## Core User Flow

### Homepage

- Hero section — headline, subheadline, Get Started CTA button
- How it works section — 3 steps: Set up profile, Find jobs, AI applies
- Features section — 3-4 key features with icons
- Footer
- Logged in users clicking Get Started go directly to dashboard
- Logged out users go to login

### Onboarding

- User signs up or logs in via InsForge auth (Google or GitHub OAuth)
- On login, app checks if profile exists in InsForge DB
- Profile incomplete or missing → redirect to /profile
- Profile complete → redirect to /dashboard
- On dashboard, if profile is incomplete a banner shows: "Complete your profile to start the agent →"
- Profile page shows a completion indicator so users know exactly what is missing

### Profile Setup

- User fills profile form once — name, email, phone, location, job title seeking, experience level, years of experience, skills, remote preference, cover letter tone, LinkedIn URL, portfolio URL
- User generates resume PDF from their profile with one click
- GPT-4o formats profile into ATS-friendly resume
- PDF stored in InsForge Storage
- User can edit profile and regenerate resume any time

### Finding Jobs

- User goes to dashboard
- Enters job title and location
- Clicks Find Jobs
- Agent searches Google for public company and ATS job postings
- Filters only jobs with external apply links and no required job-board account
- GPT-4o scores each listing 0–100 against user profile
- Jobs appear live on dashboard as they are found
- 70%+ jobs go to auto-apply queue
- Below 70% jobs go to review queue

### Auto Apply (70%+ matches)

- Agent applies to matched jobs in batches
- Each batch is wrapped with AgentSpan for durability
- For each job a new Browserbase session opens on the company careers page
- GPT-4o generates a custom cover letter per job
- Stagehand fills every form field using profile data
- Resume PDF attached if file upload field exists
- Form submitted
- Status updated live on dashboard

### Review Queue (Below 70% matches)

- User sees jobs that did not meet the threshold
- Each job card shows title, company, match score, and reason it missed
- User can dismiss or open job details

### Job Details Page

- Full job description
- Match score and detailed reason
- Current resume preview
- Tailor Resume and Apply button
- GPT-4o rewrites resume specifically for this job
- Tailored resume PDF generated and stored
- User confirms — agent opens company page and submits application
- Status updated on dashboard

### Dashboard

- Stats bar — total found, auto applied, manually applied, match rate, success rate
- Live agent feed — real-time log of agent activity via InsForge Realtime
- Browserbase session recording embed — watch the browser live
- Auto-applied jobs table — company, title, match score, status, cover letter preview
- Review queue — below threshold jobs waiting for user decision
- PostHog analytics section — funnel chart, applications over time, match score distribution
- Start and Stop agent controls

---

## Features In Scope

- Homepage with hero, how it works, features, and footer sections
- Top navbar with Dashboard, Profile, and Find Jobs CTA
- InsForge authentication (Google + GitHub OAuth)
- User profile form and profile editing
- AI resume generation from profile (PDF)
- Google/public web job discovery for external company and ATS apply pages
- GPT-4o job matching with score and reason
- Auto-apply to 70%+ matches in batches
- AgentSpan durability wrapping the apply loop
- Per-job AI cover letter generation
- Stagehand form filling on company career pages
- Resume PDF attachment on file upload fields
- Review queue for below-threshold jobs
- Job details page with match breakdown
- Per-job resume tailoring with GPT-4o
- Manual apply from job details page
- Live dashboard with real-time updates via InsForge Realtime
- Browserbase session recording embedded in dashboard
- PostHog event tracking throughout
- PostHog analytics charts on dashboard
- Full jobs table with status tracking
- Start and Stop agent controls

---

## Features Out of Scope

- LinkedIn account automation and Easy Apply — never touched, external apply only
- Email notifications
- Mobile app
- Team or multi-user accounts
- Scheduling — agent runs are manually triggered only
- Resume upload — resume is always generated from profile
- Account-gated job board integrations
- Payment or subscription system
- Browser extension

---

## Success Criteria

- Homepage clearly communicates what the product does within 5 seconds
- User can sign up, fill profile, and generate a resume PDF in under 5 minutes
- Agent finds and scores public company/ATS job listings accurately
- Auto-apply successfully fills and submits forms on at least 3 different company career page layouts
- Dashboard updates in real time during an agent run
- Review queue correctly shows only below-threshold jobs
- Tailored resume is visibly different from the base resume and relevant to the specific job
- All application records stored correctly in InsForge with status, cover letter, and resume URL
- PostHog funnel accurately reflects the agent run data
- UI is visually consistent across all pages and components

---

## Target User

A developer or technical job seeker who:

- Is actively applying to jobs
- Understands basic web concepts
- Wants to automate a painful manual process
- Wants applications focused on public company and ATS apply pages
