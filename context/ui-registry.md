# UI Registry

Living document. Updated after every component is built. Claude must read this before building any new component and match existing patterns exactly. Never invent new patterns when an existing one can be extended.

---

## How to Use This File

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes for background, border, text, padding, radius, and hover states
3. If no — build it following ui-rules.md, then add it here immediately after

After building any component:
Claude updates this file with the component name, where it lives, and its exact Tailwind classes.

---

## Registry Format

```
### ComponentName
File: components/path/ComponentName.tsx
Wrapper:    [classes]
Header:     [classes]
Body:       [classes]
Text:       [classes]
Interactive:[classes]
Notes:      [any important pattern notes]
```

---

## Components Built

### AppShell

File: components/layout/AppShell.tsx
Last updated: 2026-05-21

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-base`, `bg-surface`, `bg-elevated`, `bg-overlay`, `bg-accent-dim` |
| Border           | `border-r border-default`, `border-b border-default`, `border-t border-default`, `border border-default`, `border-accent-border` |
| Border radius    | `rounded-xl`                                                          |
| Text — primary   | `text-base font-semibold text-text-primary`                           |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-text-faint`, `text-accent-text` |
| Spacing          | `h-16 px-4`, `px-2 py-3`, `p-3`, `px-3 py-2`, `h-10 px-3`, `gap-1`, `mt-1`, `mt-3` |
| Hover state      | `transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary` |
| Shadow           | `none`                                                                |
| Accent usage     | `border-accent-border bg-accent-dim text-accent-text`                 |

**Pattern notes:**
AppShell is the authenticated app navigation shell built on shadcn sidebar primitives: `SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarTrigger`, `SidebarHeader`, `SidebarContent`, `SidebarMenu`, `SidebarMenuButton`, `SidebarFooter`, and `SidebarRail`. It follows the documented shadcn pattern: `SidebarTrigger` toggles desktop and mobile state, desktop uses `collapsible="icon"`, mobile uses the built-in sheet drawer, active nav links use the accent treatment, and mobile navigation closes after a route click.

### AuthenticatedAppPagePattern

File: app/(app)/dashboard/page.tsx, app/(app)/jobs/page.tsx, app/(app)/profile/page.tsx, app/(app)/jobs/[id]/page.tsx
Last updated: 2026-05-21

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `none` at page wrapper; inherited `bg-base` from `AppShell`           |
| Border           | `none` for standard page headers and page-level layout                |
| Border radius    | `none` for standard page headers and page-level layout                |
| Text — primary   | `text-3xl font-semibold text-text-primary`                            |
| Text — secondary | `text-sm text-accent-text`, `text-sm text-text-muted`                 |
| Spacing          | `grid gap-6`, `mt-1`, `mt-2`, `max-w-2xl`                             |
| Hover state      | `none`                                                                |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text` page eyebrow                                       |

**Pattern notes:**
Authenticated pages use a flat page header inside `AppShell` rather than a decorative parent card. Dashboard is the overview surface with stats, run summary, and analytics placement. Jobs is the operational workspace with controls, filters, pagination, and job inventory. Profile is the setup/resume workspace with flattened form sections and framed repeated evidence entries only. Job details remain a drill-in workflow and may use distinct panels for match analysis, resume preview, and apply actions.

### AutoAppliedTable

File: components/dashboard/AutoAppliedTable.tsx
Last updated: 2026-05-21

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-subtle`, `bg-elevated`, `bg-state-success-dim`, `bg-state-error-dim` |
| Border           | `border border-default`, `border-b border-default`, `border-state-success/20`, `border-state-error/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-3xl font-semibold text-text-primary`, `text-sm font-medium text-text-primary`, `text-base font-medium text-text-muted` |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-text-faint`, `text-accent-text`, `text-state-success`, `text-state-warning`, `text-state-error` |
| Spacing          | `px-5 py-4`, `p-5`, `px-4 py-3`, `px-4 py-4`, `p-4`, `py-16`, `gap-4`, `gap-3`, `gap-2` |
| Hover state      | `transition-colors hover:bg-elevated hover:bg-subtle hover:text-text-secondary hover:text-text-primary hover:border-subtle` |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text` section label and detail icon                      |

**Pattern notes:**
AutoAppliedTable is a legacy dashboard outcome table component from the pre-redesign dashboard. The redesigned app does not render it on `/dashboard`; application outcomes now belong in the `/jobs` workspace through `JobsInventoryTable`. Keep this component only if a future route needs the narrower auto-apply outcome surface.

### ExternalApplyReviewPanel

File: app/(app)/linkedin-test/page.tsx
Last updated: 2026-05-26

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-elevated`, `bg-surface`, `bg-subtle`, `bg-state-warning-dim`, `bg-state-error-dim`, `bg-state-success-dim` |
| Border           | `border border-default`, `border-state-warning/20`, `border-state-error/20`, `border-state-success/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-lg`, `rounded-full`             |
| Text — primary   | `text-sm font-medium text-text-primary`, `text-sm text-text-primary`  |
| Text — secondary | `text-sm text-text-muted`, `text-text-secondary`, `text-text-faint`, `text-accent-text`, `text-state-warning`, `text-state-error`, `text-state-success` |
| Spacing          | `p-4`, `p-3`, `px-3 py-2`, `px-2.5 py-1`, `mt-4`, `mt-2`, `mt-1`, `gap-3`, `gap-2`, `gap-1.5` |
| Hover state      | `none`                                                                |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text` small section labels                               |

**Pattern notes:**
ExternalApplyReviewPanel is part of the temporary LinkedIn Test page. It renders the post-fill external apply review returned by the Browserbase route: filled fields, possible misfilled fields, empty required fields, blockers, and a ready/needs-review badge. Keep it scoped to the experiment until the main apply flow has a production review surface.

### LiveFeed

File: components/dashboard/LiveFeed.tsx
Last updated: 2026-05-20

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-elevated`, `bg-state-neutral-dim`, `bg-state-error-dim` |
| Border           | `border border-default`, `border-b border-default`, `border-state-neutral/20`, `border-state-error/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-3xl font-semibold text-text-primary`, `text-base font-medium text-text-muted` |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-text-faint`, `text-accent-text`, `text-state-success`, `text-state-warning`, `text-state-error`, `text-state-neutral` |
| Spacing          | `px-5 py-4`, `p-5`, `px-5 py-2`, `py-2.5`, `py-16`, `gap-3`, `gap-2` |
| Hover state      | `none`                                                                |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text` section label                                      |

**Pattern notes:**
LiveFeed is a legacy dashboard operational component from the pre-redesign dashboard. The redesigned `/dashboard` no longer renders full logs; operational run context belongs on `/jobs`. If reused later, keep it as a single panel shell with a log list, not inside another card or panel.

### SessionRecording

File: components/dashboard/SessionRecording.tsx
Last updated: 2026-05-20

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-elevated`, `bg-subtle`, `bg-state-info-dim`         |
| Border           | `border border-default`, `border-b border-default`, `border-state-info/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-3xl font-semibold text-text-primary`, `text-sm font-medium text-text-primary`, `text-base font-medium text-text-muted` |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-text-faint`, `text-accent-text`, `text-state-info` |
| Spacing          | `px-5 py-4`, `p-5`, `py-16`, `gap-3`, `gap-2`, `mt-4`, `mt-1`        |
| Hover state      | `transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary` |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text` section label                                      |

**Pattern notes:**
SessionRecording is a legacy dashboard operational component from the pre-redesign dashboard. The redesigned `/dashboard` no longer renders Browserbase recordings; recording playback should live with operational job/run workflows if restored.

### StatsBar

File: components/dashboard/StatsBar.tsx
Last updated: 2026-05-20

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-elevated`, `bg-accent-dim`                                        |
| Border           | `border border-default`, `border-accent-border`                       |
| Border radius    | `rounded-2xl`, `rounded-xl`                                           |
| Text — primary   | `text-2xl font-bold text-text-primary`                                |
| Text — secondary | `text-xs font-medium uppercase tracking-wide text-text-muted`, `text-sm text-text-secondary`, `text-accent-text` |
| Spacing          | `p-5`, `p-2`, `gap-4`, `mt-1`, `mt-4`                                 |
| Hover state      | `none`                                                                |
| Shadow           | `none`                                                                |
| Accent usage     | `bg-accent-dim`, `border-accent-border`, `text-accent-text` icon tile |

**Pattern notes:**
StatsBar uses the approved dashboard stats card pattern with five compact elevated cards in a responsive grid. The component is presentation-only and receives already-normalized dashboard metrics from the server-loaded dashboard page.

### AgentControls

File: components/dashboard/AgentControls.tsx
Last updated: 2026-05-20

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-elevated`, `bg-subtle`, `bg-accent-primary`, `bg-state-warning-dim`, `bg-state-success-dim`, `bg-state-error-dim` |
| Border           | `border border-default`, `border-b border-default`, `border-state-warning/20`, `border-state-success/20`, `border-state-error/20`, `border-state-error/25` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-text-primary font-semibold`, `text-text-primary`                |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-accent-text`, `text-bg-base`, `text-state-warning`, `text-state-success`, `text-state-error` |
| Spacing          | `px-5 py-4`, `p-5`, `gap-4`, `gap-2`, `gap-1.5`, `mt-4`              |
| Hover state      | `transition-colors hover:bg-accent-hover hover:shadow-accent hover:bg-state-error/20 disabled:hover:bg-accent-primary disabled:hover:bg-state-error-dim` |
| Shadow           | `hover:shadow-accent` on Find Jobs                                    |
| Accent usage     | `text-accent-text`, `bg-accent-primary`, `text-bg-base`               |

**Pattern notes:**
AgentControls now belongs on `/jobs`, not `/dashboard`. It uses one operational panel shell for the search tool; avoid adding another decorative parent card around it. Inputs use icon-leading tokenized form fields, Find Jobs uses the primary CTA treatment, Stop uses the destructive button treatment, and active-run state is shown with the warning status badge while server-loaded active runs disable new searches.

### ReviewQueue

File: components/dashboard/ReviewQueue.tsx
Last updated: 2026-05-20

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-elevated`, `bg-subtle`, `bg-state-neutral-dim`      |
| Border           | `border border-default`, `border-b border-default`, `border-state-neutral/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-text-primary font-semibold`, `text-text-primary font-medium`    |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-text-faint`, `text-accent-text`, `text-state-success`, `text-state-warning`, `text-state-error`, `text-state-neutral` |
| Spacing          | `px-5 py-4`, `p-5`, `py-16`, `gap-5`, `gap-4`, `gap-3`, `gap-2`       |
| Hover state      | `transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary hover:text-text-secondary` |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text` section label                                      |

**Pattern notes:**
ReviewQueue is a legacy standalone review surface from the pre-redesign dashboard. Review behavior now belongs in `/jobs` through the unified inventory table. If this component is reused, the parent page should stay flat and the repeated review cards may be framed.

### DismissReviewJobButton

File: components/dashboard/DismissReviewJobButton.tsx
Last updated: 2026-05-20

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `hover:bg-subtle`                                                     |
| Border           | `none`                                                                |
| Border radius    | `rounded-xl`                                                          |
| Text — primary   | `none`                                                                |
| Text — secondary | `text-text-muted hover:text-text-secondary`, `text-state-error`       |
| Spacing          | `h-8 px-3 gap-1.5`, `gap-2`                                           |
| Hover state      | `transition-colors hover:bg-subtle hover:text-text-secondary`         |
| Shadow           | `none`                                                                |
| Accent usage     | `none`                                                                |

**Pattern notes:**
DismissReviewJobButton is the tiny client-only control used inside each review card. It uses `useTransition` for pending state, `router.refresh()` after successful dismissal, and a compact tokenized error message while all mutation logic stays in `actions/jobs.ts`.

### JobDetails

File: components/jobs/JobDetails.tsx
Last updated: 2026-05-20

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-elevated`, `bg-subtle`, `bg-accent-dim`, `bg-state-neutral-dim`, `bg-state-success-dim`, `bg-state-error-dim`, `bg-state-warning-dim`, `bg-state-info-dim` |
| Border           | `border border-default`, `border-b border-default`, `border-state-neutral/20`, `border-state-success/20`, `border-state-error/20`, `border-state-warning/20`, `border-state-info/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-text-primary font-semibold`, `text-text-primary font-medium`    |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-text-faint`, `text-accent-text`, `text-state-success`, `text-state-error`, `text-state-warning`, `text-state-info`, `text-state-neutral` |
| Spacing          | `px-5 py-4`, `p-5`, `py-16`, `gap-6`, `gap-5`, `gap-3`, `gap-2`       |
| Hover state      | `transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary hover:text-text-secondary` |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text`, `bg-accent-dim` icon tiles                        |

**Pattern notes:**
Job details uses the established dashboard panel shell and elevated inner cards. The header keeps the job status, location, title, company, and external company apply link together, while detail content stays in separate panels for match analysis, description, resume preview, and the tailor action. The resume preview panel prefers an owner-checked tailored resume iframe and download link when `jobs.is_tailored` and `jobs.resume_url` are set, otherwise it falls back to the base resume preview.

### JobsInventoryTable
File: components/jobs/JobsInventoryTable.tsx
Last updated: 2026-05-21

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-subtle`, `bg-elevated`, `bg-state-neutral-dim`, `bg-state-info-dim`, `bg-state-warning-dim`, `bg-state-success-dim`, `bg-state-error-dim` |
| Border           | `border border-default`, `border-b border-default`, `border-state-neutral/20`, `border-state-info/20`, `border-state-warning/20`, `border-state-success/20`, `border-state-error/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-xl font-semibold text-text-primary`, `text-sm font-medium text-text-primary`, `text-base font-medium text-text-muted` |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-text-faint`, `text-accent-text`, `text-state-neutral`, `text-state-info`, `text-state-warning`, `text-state-success`, `text-state-error` |
| Spacing          | `px-5 py-4`, `p-5`, `px-4 py-3`, `px-4 py-4`, `p-4`, `py-16`, `gap-4`, `gap-3`, `gap-2` |
| Hover state      | `transition-colors hover:bg-elevated hover:bg-subtle hover:text-text-secondary hover:text-text-primary hover:border-subtle` |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text` section label and detail icons                     |

**Pattern notes:**
JobsInventoryTable is the Phase 3 operational jobs table for `/jobs`. It receives server-normalized owner-scoped paginated rows, covers all job statuses with tokenized badges, uses the established threshold-aware match score bar, keeps below-threshold `found` jobs dismissible, links every row to `/jobs/[id]`, and expands one row at a time for cover letter or match context, external apply URL, failure reason, and tailored-resume state.

### MatchBreakdown

File: components/jobs/MatchBreakdown.tsx
Last updated: 2026-05-20

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-elevated`, `bg-subtle`, `bg-accent-dim`, `bg-state-success`, `bg-state-warning`, `bg-state-error` |
| Border           | `border border-default`, `border-b border-default`                    |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-text-primary font-semibold`, `text-2xl font-bold`               |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-accent-text`, `text-state-success`, `text-state-warning`, `text-state-error` |
| Spacing          | `px-5 py-4`, `p-5`, `gap-4`, `gap-3`, `mt-4`, `mt-3`                  |
| Hover state      | `none`                                                                |
| Shadow           | `none`                                                                |
| Accent usage     | `bg-accent-dim`, `text-accent-text` icon tile and section label       |

**Pattern notes:**
MatchBreakdown reuses the same threshold-aware score text and approximate utility-width progress bar pattern from ReviewQueue. It must continue reading the threshold from `MATCH_THRESHOLD` rather than hardcoding the cutoff.

### TailorAndApply

File: components/jobs/TailorAndApply.tsx
Last updated: 2026-05-28

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-elevated`, `bg-accent-dim`, `bg-accent-primary`, `bg-state-success-dim`, `bg-state-error-dim` |
| Border           | `border border-default`, `border-b border-default`, `border-state-success/20`, `border-state-error/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`                                           |
| Text — primary   | `text-text-primary font-medium`                                       |
| Text — secondary | `text-text-secondary`, `text-accent-text`, `text-bg-base`, `text-state-success`, `text-state-error` |
| Spacing          | `px-5 py-4`, `p-5`, `gap-3`, `gap-2`, `mt-5`, `mt-2`                  |
| Hover state      | `transition-colors hover:bg-accent-hover hover:shadow-accent disabled:hover:bg-accent-primary disabled:hover:shadow-none` |
| Shadow           | `none`                                                                |
| Accent usage     | `bg-accent-dim`, `text-accent-text`, `bg-accent-primary`, `text-bg-base` |

**Pattern notes:**
TailorAndApply is now a resume-tailoring-only job-details panel. It requires a base resume before tailoring, posts `{ jobId }` to `/api/resume/tailor`, shows pending/success/error states, and refreshes job details on success. Do not add Browserbase apply controls back to this component; users apply through saved external/source links outside JobPilot.

### Feature 20 Manual Apply
File: agent/apply.ts, agent/cover-letter.ts, app/api/jobs/[id]/apply/route.ts
Last updated: 2026-05-20

No standalone visual component was added. Feature 20 extends the existing job-details action panel and server-only apply logic with owner-scoped manual apply, tailored-resume enforcement, just-in-time cover letter generation, Browserbase/Stagehand company-form submission, and job status logging.

### RunSummary
File: components/dashboard/RunSummary.tsx
Last updated: 2026-05-21

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-elevated`, `bg-state-warning-dim`, `bg-state-success-dim`, `bg-state-error-dim`, `bg-state-neutral-dim` |
| Border           | `border border-default`, `border-b border-default`, `border-r border-default`, `border-state-warning/20`, `border-state-success/20`, `border-state-error/20`, `border-state-neutral/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-xl font-semibold text-text-primary`, `text-sm font-medium text-text-primary`, `text-2xl font-bold text-text-primary` |
| Text — secondary | `text-text-muted`, `text-text-faint`, `text-accent-text`, `text-state-warning`, `text-state-success`, `text-state-error`, `text-state-neutral` |
| Spacing          | `px-5 py-4`, `p-5`, `p-4`, `py-16`, `gap-5`, `gap-4`, `gap-3`, `gap-2` |
| Hover state      | `none`                                                                |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text` section label and detail icons                     |

**Pattern notes:**
RunSummary is the redesigned dashboard overview panel for the current or latest agent run. It uses one panel shell, small elevated metric/action surfaces inside the body, tokenized status badges, and an empty state when the user has no runs.

### AnalyticsPreview
File: components/dashboard/AnalyticsPreview.tsx
Last updated: 2026-05-21

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-elevated`, `bg-accent-dim`                          |
| Border           | `border border-default`, `border-b border-default`, `border-accent-border` |
| Border radius    | `rounded-2xl`, `rounded-xl`                                           |
| Text — primary   | `text-xl font-semibold text-text-primary`, `text-sm font-medium text-text-primary` |
| Text — secondary | `text-text-muted`, `text-accent-text`                                 |
| Spacing          | `px-5 py-4`, `p-5`, `p-4`, `gap-4`, `mt-4`, `mt-1`                   |
| Hover state      | `none`                                                                |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text` section label and icon tiles                       |

**Pattern notes:**
AnalyticsPreview reserves the Phase 8 analytics area without fake chart data. It keeps the dashboard lighter by showing three compact elevated preview tiles inside one panel shell.

### Feature 16 AgentSpan Wrapping
File: agent/index.ts
Last updated: 2026-05-20

No UI component or visual pattern was added. Feature 16 is server-only AgentSpan runtime wrapping for the auto-apply phase, per-job `apply-{job_id}` idempotency, AgentSpan execution ID persistence, and agent logging.

### Feature 15 Apply Agent
File: agent/apply.ts
Last updated: 2026-05-20

No UI component or visual pattern was added. Feature 15 is server-only auto-apply logic, Browserbase/Stagehand form submission, resume attachment attempts, status persistence, and agent logging.

### Feature 14 Cover Letter Generation
File: agent/cover-letter.ts
Last updated: 2026-05-19

No UI component or visual pattern was added. Feature 14 is server-only cover letter generation, queued-job persistence, failure routing, and agent logging.

### Feature 13 GPT-4o Matching
File: agent/matcher.ts
Last updated: 2026-05-19

No UI component or visual pattern was added. Feature 13 is server-only matching, scoring, status routing, run count updates, and agent logging.

### Feature 12 LinkedIn Job Discovery
File: agent/linkedin.ts
Last updated: 2026-05-26

No UI component or visual pattern is active for Feature 12 discovery. The production Find Jobs flow now uses LinkedIn discovery through the saved Browserbase/LinkedIn context, saves the LinkedIn job URL to `jobs.linkedin_url`, saves the external company apply URL when available to `jobs.external_apply_url`, and leaves matching to `agent/matcher.ts`.

### Feature 11 Stagehand Setup

File: lib/stagehand.ts
Last updated: 2026-05-19

No UI component or visual pattern was added. Feature 11 is server-only Stagehand initialization, Browserbase-backed session lifecycle, and connection verification.

### Navbar

File: components/layout/Navbar.tsx
Last updated: 2026-05-18

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`                                                          |
| Border           | `border-b border-default`                                             |
| Border radius    | `none`                                                                |
| Text — primary   | `text-text-primary font-semibold`                                          |
| Text — secondary | `text-text-secondary hover:text-text-primary`                                   |
| Spacing          | `h-16 px-6 gap-3 gap-8`                                               |
| Hover state      | `transition-colors hover:text-text-primary hover:bg-accent-hover hover:border-subtle hover:bg-subtle` |
| Shadow           | `hover:shadow-accent` on primary CTA                                  |
| Accent usage     | `bg-accent-primary text-bg-base hover:bg-accent-hover`                |

**Pattern notes:**
Navbar is the public-page navigation only after the authenticated app shell redesign. Logged-out users see the brand and Login CTA. Signed-in users may see a Dashboard entry point from public pages, but authenticated app navigation belongs to `AppShell`, not this navbar.

### Footer

File: components/layout/Footer.tsx
Last updated: 2026-05-18

| Property         | Class                                       |
| ---------------- | ------------------------------------------- |
| Background       | `bg-surface`                                |
| Border           | `border-t border-default`                   |
| Border radius    | `none`                                      |
| Text — primary   | `none`                                      |
| Text — secondary | `text-text-muted hover:text-text-secondary`           |
| Spacing          | `px-6 py-8 gap-4 gap-5`                     |
| Hover state      | `transition-colors hover:text-text-secondary`    |
| Shadow           | `none`                                      |
| Accent usage     | `none`                                      |

**Pattern notes:**
Footer is restrained and matches the navbar surface treatment, using muted text and simple hover transitions.

### Login

File: app/login/page.tsx
Last updated: 2026-05-18

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-base`, `bg-surface`, `bg-elevated`, `bg-state-error-dim`          |
| Border           | `border border-default`, `border-b border-default`, `border-state-error/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`                                           |
| Text — primary   | `text-text-primary font-semibold`                                     |
| Text — secondary | `text-text-secondary`, `text-accent-text`, `text-state-error`         |
| Spacing          | `px-6 pt-16 py-16 p-6 gap-3 mb-4 mb-6 mt-2 mt-3`                     |
| Hover state      | `transition-colors hover:bg-accent-hover hover:shadow-accent hover:border-subtle hover:bg-subtle hover:text-text-primary` |
| Shadow           | `shadow-card`, `hover:shadow-accent`                                  |
| Accent usage     | `bg-accent-primary`, `text-accent-text`, `text-bg-base`               |

**Pattern notes:**
Login uses a single centered auth panel with locked primary and secondary button treatments. Error messages use the approved destructive state dim background and tokenized state text.

### Hero

File: components/homepage/Hero.tsx
Last updated: 2026-05-19

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-elevated`, `bg-accent-dim`                          |
| Border           | `border border-default`, `border-b border-default`, `border-accent-border` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-text-primary font-semibold`, `text-text-primary font-medium`              |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-accent-text`                    |
| Spacing          | `px-6 py-14 p-5 px-5 py-4 gap-3 gap-4 gap-10 gap-14`                  |
| Hover state      | `transition-colors hover:bg-accent-hover hover:border-subtle hover:bg-subtle hover:text-text-primary` |
| Shadow           | `shadow-elevated`, `hover:shadow-accent`                              |
| Accent usage     | `bg-accent-primary`, `bg-accent-dim`, `border-accent-border`, `text-accent-text` |

**Pattern notes:**
Hero establishes the product UI preview pattern: panels use `bg-surface rounded-2xl border border-default`, nested cards use `bg-elevated rounded-2xl border border-default`, and primary actions follow the locked primary button classes. Hero headings use `text-4xl md:text-5xl xl:text-6xl` to avoid oversized first-viewport typography on wide screens. Feature 12 copy now describes public company and ATS job discovery instead of LinkedIn discovery.

### HowItWorks

File: components/homepage/HowItWorks.tsx
Last updated: 2026-05-19

| Property         | Class                                               |
| ---------------- | --------------------------------------------------- |
| Background       | `bg-surface`, `bg-elevated`                         |
| Border           | `border-y border-default`, `border border-default`  |
| Border radius    | `rounded-2xl`                                       |
| Text — primary   | `text-text-primary font-semibold`, `text-text-primary font-medium` |
| Text — secondary | `text-text-secondary`, `text-accent-text`                |
| Spacing          | `px-6 py-32 lg:py-36 p-8 gap-6 mt-14`               |
| Hover state      | `none`                                              |
| Shadow           | `none`                                              |
| Accent usage     | `text-accent-text`                                  |

**Pattern notes:**
Homepage step cards use the approved card shell and reserve accent color for section labels and step numbers. Feature 12 copy now describes public job-result discovery with company or ATS apply links.

### Features

File: components/homepage/Features.tsx
Last updated: 2026-05-18

| Property         | Class                                               |
| ---------------- | --------------------------------------------------- |
| Background       | `bg-base`, `bg-elevated`, `bg-accent-primary`       |
| Border           | `border border-default`                             |
| Border radius    | `rounded-2xl`, `rounded-full`                       |
| Text — primary   | `text-text-primary font-semibold`, `text-text-primary font-medium` |
| Text — secondary | `text-text-secondary`, `text-accent-text`                |
| Spacing          | `px-6 py-32 lg:py-36 p-8 gap-6 gap-14`              |
| Hover state      | `none`                                              |
| Shadow           | `none`                                              |
| Accent usage     | `text-accent-text`, `bg-accent-primary`             |

**Pattern notes:**
Feature cards match the approved card pattern. Small accent bars can be reused as non-interactive visual markers in marketing/product sections.

### ProfileForm

File: components/profile/ProfileForm.tsx
Last updated: 2026-05-21

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-subtle`, `bg-elevated`, `bg-state-success-dim`, `bg-state-error-dim`, `bg-state-warning-dim` |
| Border           | `border border-default`, `border-t border-default`, `border-accent-border`, `border-state-success/20`, `border-state-error/20`, `border-state-warning/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-text-primary font-semibold`, `text-text-primary font-medium`, `text-text-secondary font-medium` |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-accent-text`, `text-state-error`, `text-state-success`, `text-state-warning` |
| Spacing          | `pt-6`, `pt-5`, `p-4`, `mb-5`, `gap-8`, `gap-5`, `gap-4`, `gap-3`, `gap-2` |
| Hover state      | `transition-colors hover:bg-accent-hover hover:shadow-accent hover:border-subtle hover:bg-subtle hover:text-text-primary` |
| Shadow           | `hover:shadow-accent` on primary actions                              |
| Accent usage     | `bg-accent-primary`, `bg-accent-dim`, `border-accent-border`, `text-accent-text`, `text-bg-base` |

**Pattern notes:**
Profile form is the Redesign Phase 4 flattened setup workspace. The outer form is unframed and organized as one page header, a compact readiness row, and top-divided sections for contact details, target role, skills, application preferences, resume evidence, resume PDF actions, and final save actions. Field groups sit directly on the page instead of inside large elevated section cards. Skill tags match the pre-approved skill tag treatment from `ui-rules.md`. Returning users get edit-aware heading, success, and submit copy. After a complete successful save, the dashboard CTA uses the approved secondary button treatment. Resume evidence keeps app-native repeated framed cards for work, project, and education entries, with `gap-8` between evidence categories so each subsection header has breathing room after the previous card. Resume generation uses a single surface action band with primary icon+text generation or regeneration, secondary icon+text PDF preview/download, tokenized success/error feedback, a warning blocker panel whenever generation is disabled, and a modal PDF preview once a resume exists. The previous LinkedIn connection section was removed when Feature 12 moved to unauthenticated Google/public web discovery.

### ProfileReadiness

File: components/profile/ProfileForm.tsx
Last updated: 2026-05-21

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-elevated`, `bg-subtle`, `bg-state-success-dim`, `bg-state-warning-dim` |
| Border           | `border border-default`, `border-b border-default`, `border-state-success/20`, `border-state-warning/20` |
| Border radius    | `rounded-2xl`, `rounded-full`                                         |
| Text — primary   | `text-text-primary font-bold`, `text-state-success font-medium`, `text-state-warning font-medium` |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-state-warning`        |
| Spacing          | `pt-5`, `p-4`, `gap-4`, `gap-3`, `gap-2`                              |
| Hover state      | `none`                                                                |
| Shadow           | `none`                                                                |
| Accent usage     | `bg-accent-primary` progress segments                                 |

**Pattern notes:**
Profile readiness is embedded directly below the page header, not rendered as a sidebar. It uses one status block plus one compact progress counter in the same grid and lists missing required fields as compact chips only; detailed validation remains inline beside each field.

### ResumePreview

File: components/profile/ProfileForm.tsx
Last updated: 2026-05-21

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-overlay`, `bg-surface`, `bg-base`                                 |
| Border           | `border border-default`, `border-b border-default`, `border-0`        |
| Border radius    | `rounded-3xl`, `rounded-xl`, `rounded-2xl`                            |
| Text — primary   | `text-text-primary font-semibold`, `text-text-muted font-medium`      |
| Text — secondary | `text-accent-text`, `text-text-faint`, `text-text-muted`              |
| Spacing          | `p-4`, `px-5 py-4`, `px-5 py-12`, `gap-2`, `gap-3`, `gap-4`           |
| Hover state      | `transition-colors hover:bg-subtle hover:text-text-secondary`         |
| Shadow           | `shadow-elevated`                                                     |
| Accent usage     | `none`                                                                |

**Pattern notes:**
Resume preview opens from a secondary icon+text `Preview` button inside the flattened resume action band. Resume actions use compact `h-10 shrink-0 whitespace-nowrap` controls so labels do not wrap in dense layouts. Empty state is unframed centered muted text below the action band; generated state keeps the form compact and renders the authenticated PDF iframe inside a modal overlay pointed at `/api/resume/preview`. The modal sits outside the form tree and uses `bg-overlay`, `rounded-3xl`, `shadow-elevated`, click-outside close, Escape close, and an icon-only close button.

### EvidenceEntryCard

File: components/profile/EvidenceEntryCard.tsx
Last updated: 2026-05-19

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-elevated`, `hover:bg-subtle`                                      |
| Border           | `border border-default`, `border-t border-default`                    |
| Border radius    | `rounded-2xl`, `rounded-xl`                                           |
| Text — primary   | `text-text-primary font-medium`                                       |
| Text — secondary | `text-text-muted`, `hover:text-state-error`                           |
| Spacing          | `px-4 py-4`, `px-4 pb-4 pt-4`, `gap-3`, `gap-4`                       |
| Hover state      | `transition-colors hover:bg-subtle hover:text-state-error`            |
| Shadow           | `shadow-card`                                                         |
| Accent usage     | `none`                                                                |

**Pattern notes:**
Evidence entry cards use a compact app-native disclosure pattern instead of accordion primitives: title and meta are left aligned, the chevron sits beside the text, remove is an icon-only action on the right, and expanded fields appear below a `border-t border-default` divider inside the same elevated card.

### Accordion

File: components/ui/accordion.tsx
Last updated: 2026-05-19

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `none` by default; consumers provide tokenized surfaces               |
| Border           | `border-transparent`, `focus-visible:border-accent-border`            |
| Border radius    | `rounded-xl`                                                          |
| Text — primary   | `font-sans text-sm font-medium text-text-primary`                     |
| Text — secondary | `text-text-muted` for icons                                           |
| Spacing          | `py-3`, `pb-3`, `flex w-full flex-col`                                |
| Hover state      | `hover:text-text-primary`                                             |
| Shadow           | `none`                                                                |
| Accent usage     | `focus-visible:ring-accent-border`                                    |

**Pattern notes:**
Accordion is the shadcn/Radix primitive restyled for JobPilot tokens. Consumers provide surfaces and may further suppress focus rings inside dense form cards, but typography and icon color should stay aligned with the app.

### CompletionIndicator

File: components/profile/CompletionIndicator.tsx
Last updated: 2026-05-19

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-subtle`, `bg-elevated`, `bg-accent-primary`, `bg-state-success-dim`, `bg-state-warning-dim` |
| Border           | `border border-default`, `border-b border-default`, `border-state-success/20`, `border-state-warning/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-text-primary font-medium`, `text-state-success font-medium`, `text-state-warning font-medium` |
| Text — secondary | `text-text-secondary`, `text-text-muted`                              |
| Spacing          | `px-5 py-4`, `p-5`, `p-4`, `px-3 py-2`, `gap-3`, `gap-2`, `gap-1`     |
| Hover state      | `none`                                                                |
| Shadow           | `none`                                                                |
| Accent usage     | `bg-accent-primary` progress segments                                 |

**Pattern notes:**
Completion indicator exports the required-field helpers used by the embedded profile readiness summary. The sidebar visual pattern is deprecated for `/profile`; do not add it back unless the panel contains high-value actions beyond validation bookkeeping.

### ProfileLoadError

File: app/profile/page.tsx
Last updated: 2026-05-18

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-state-error-dim`                                    |
| Border           | `border border-default`, `border-b border-default`, `border-state-error/20` |
| Border radius    | `rounded-2xl`                                                         |
| Text — primary   | `text-text-primary font-semibold`, `text-state-error font-medium`     |
| Text — secondary | `text-accent-text`                                                    |
| Spacing          | `px-5 py-4`, `p-5`, `p-4`, `mt-1`                                     |
| Hover state      | `none`                                                                |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text` section label                                      |

**Pattern notes:**
Profile load failure uses the standard panel shell and destructive state panel treatment. It is intentionally server-rendered inline on `/profile` and does not render the editable form when profile data cannot be loaded.

### SmartRedirect

File: app/api/auth/callback/route.ts
Last updated: 2026-05-18

No UI component or visual pattern was added. Feature 06 is route behavior only: OAuth redirects are gated by `profiles.is_complete`, sending incomplete users to `/profile` and complete users to a safe requested destination or `/dashboard`.

### LinkedInTestPage

File: app/(app)/linkedin-test/page.tsx
Last updated: 2026-05-22

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-elevated`, `bg-surface`, `bg-subtle`, `bg-accent-primary`, `bg-state-neutral-dim`, `bg-state-warning-dim`, `bg-state-success-dim`, `bg-state-error-dim` |
| Border           | `border border-default`, `border-state-neutral/20`, `border-state-warning/20`, `border-state-success/20`, `border-state-error/20` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-3xl font-semibold text-text-primary`, `text-xl font-semibold text-text-primary`, `text-base font-medium text-text-muted`, `text-sm font-medium text-text-primary` |
| Text — secondary | `text-sm text-accent-text`, `text-sm text-text-muted`, `text-text-faint`, `text-state-neutral`, `text-state-warning`, `text-state-success`, `text-state-error`, `text-bg-base`, `text-text-secondary` |
| Spacing          | `grid gap-6`, `grid gap-5`, `p-5`, `p-4`, `p-3`, `mt-1`, `mt-2`, `mt-3`, `mt-5`, `gap-4`, `gap-3`, `gap-2`, `px-4`, `px-5 py-12` |
| Hover state      | `transition-colors hover:bg-accent-hover hover:shadow-accent hover:border-subtle hover:bg-subtle hover:text-text-primary` |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text`, `bg-accent-primary`, `text-bg-base`, `hover:shadow-accent` |

**Pattern notes:**
LinkedInTestPage is a temporary experiment page under the authenticated app shell. It uses the existing flat page header pattern plus three standalone elevated section cards for Connect LinkedIn, Find Jobs, and Test Apply. The Connect section is client-side and opens `/api/linkedin-test/connect`, then shows a success/error panel, a secondary reopen link, and a confirmation action that saves the Browserbase context through `/api/linkedin-test/save-context`. The Find Jobs section calls `/api/linkedin-test/find-jobs`, renders in-memory job cards with tokenized status badges, and allows selecting only jobs with an external apply URL or explicit Easy Apply signal. Jobs with neither are marked as unsupported. The Test Apply section calls `/api/linkedin-test/apply` as an SSE stream, shows live activity, success/error states, and links to the Browserbase recording.

---

## Approved Patterns Locked In Advance

These patterns are pre-approved from ui-rules.md and must be used exactly as written. Do not deviate.

### Primary Button

```
bg-accent-primary hover:bg-accent-hover text-bg-base font-medium h-9 px-4 rounded-xl transition-colors
```

### Secondary Button

```
bg-elevated hover:bg-subtle border border-default hover:border-subtle text-text-secondary hover:text-text-primary h-9 px-4 rounded-xl transition-colors
```

### Ghost Button (icon only)

```
hover:bg-subtle text-text-muted hover:text-text-secondary h-8 w-8 rounded-xl transition-colors
```

### Card

```
bg-elevated rounded-2xl border border-default p-5
```

### Panel

```
bg-surface rounded-2xl border border-default
Panel header: px-5 py-4 border-b border-default
Panel body:   p-5
```

### Input

```
bg-subtle border border-default rounded-xl h-10 px-3 text-text-primary placeholder:text-text-muted focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors outline-none
```

### Status Badge — Applied

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-state-success-dim text-state-success border border-state-success/20
```

### Status Badge — Failed

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-state-error-dim text-state-error border border-state-error/20
```

### Status Badge — Applying

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-state-warning-dim text-state-warning border border-state-warning/20
```

### Status Badge — Matched

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-state-info-dim text-state-info border border-state-info/20
```

### Status Badge — Skipped / Dismissed

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-state-neutral-dim text-state-neutral border border-state-neutral/20
```

### Stat Card

```
bg-elevated rounded-2xl border border-default p-5
Number: text-2xl font-bold text-text-primary
Label:  text-xs text-text-muted uppercase tracking-wide mt-1
```

### Table Wrapper

```
bg-surface rounded-2xl border border-default overflow-hidden
```

### Table Header Row

```
bg-subtle border-b border-default
```

### Table Header Cell

```
px-4 py-3 text-xs text-text-muted uppercase tracking-wide font-medium text-left
```

### Table Body Row

```
border-b border-default last:border-0 hover:bg-elevated transition-colors
```

### Table Body Cell

```
px-4 py-3 text-sm text-text-secondary
```

### Empty State

```
flex flex-col items-center justify-center py-16 gap-3
Icon:    h-10 w-10 text-text-faint
Heading: text-base font-medium text-text-muted
Body:    text-sm text-text-faint text-center max-w-xs
```

### Skill Tag

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-accent-dim text-accent-text border border-accent-border
```

### Live Feed Entry

```
flex items-start gap-3 py-2.5 border-b border-default last:border-0
Timestamp:    text-xs text-text-faint font-mono w-16 shrink-0 pt-0.5
Level dot:    h-2 w-2 rounded-full shrink-0 mt-1.5
Message:      text-sm text-text-secondary
Company name: text-accent-text font-medium
```

### Loading Skeleton

```
bg-subtle animate-pulse rounded-xl
```

### Spinner

```
h-4 w-4 border-2 border-accent-border border-t-accent-primary rounded-full animate-spin
```

### Profile Application Questions

File: components/profile/ProfileForm.tsx
Last updated: 2026-05-22

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-state-success-dim`, `bg-state-warning-dim`, `bg-subtle`, `bg-surface` |
| Border           | `border border-state-success/20`, `border-state-warning/20`, `border-default` |
| Border radius    | `rounded-2xl`, `rounded-xl`, `rounded-full`                           |
| Text — primary   | `text-xl font-semibold text-text-primary`, `text-sm font-medium text-state-success`, `text-state-warning` |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-accent-text`          |
| Spacing          | `border-t border-default pt-6`, `grid gap-4 md:grid-cols-2`, `mb-5 p-4`, `mt-3 flex flex-wrap gap-2` |
| Hover state      | `none`                                                                |
| Shadow           | `none`                                                                |
| Accent usage     | `text-accent-text` step label                                         |

**Pattern notes:**
The Application Questions section is part of the existing flat `/profile` workflow, not a nested card. It uses the same tokenized input/select classes as the rest of ProfileForm and shows application-answer readiness in a compact status panel. Missing answers render as small warning chips so the user can scan what may block application review without making those fields part of core profile completion.

### Profile Contact Name Split

File: components/profile/ProfileForm.tsx
Last updated: 2026-05-26

**Pattern notes:**
The profile contact section now collects first and last name as separate fields in the existing `grid gap-4 md:grid-cols-2` layout. Keep these as ordinary tokenized inputs using `INPUT_CLASS`, `LABEL_CLASS`, and `ERROR_CLASS`; do not reintroduce a visible full-name input unless the database is migrated to store split name columns. The saved backend value remains the composed `full_name` for compatibility with resume, matching, and apply agents.

### Jobs Inventory Cleanup

File: components/jobs/JobsInventoryTable.tsx
Last updated: 2026-05-26

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Container        | `min-w-0 overflow-hidden rounded-2xl border border-default bg-surface` |
| Table primitive  | shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` |
| Table width      | `min-w-[48rem]`                                                       |
| Row state        | `cursor-pointer hover:bg-elevated focus:bg-elevated focus:outline-none` |
| Status badge     | shadcn `Badge variant="outline"` with `h-6 rounded-full px-2.5`       |
| Apply type badge | shadcn `Badge variant="outline"` with `h-6 rounded-full px-2.5`       |
| URL action       | `inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-muted` |
| Empty URL text   | `text-xs text-text-faint`                                             |

**Pattern notes:**
The jobs inventory is now a row-navigation shadcn table instead of an action-button table. Rows use `role="link"`, keyboard Enter/Space navigation, and route to `/jobs/[id]`; source and external URL anchors call `stopPropagation()` so they open normally without triggering row navigation. Visible statuses are simplified to `Applied` and `Not applied`, while legacy internal statuses remain normalized upstream. The row identity intentionally shows only the job title to keep the inventory dense; source/apply URLs are compact icon links in one `Links` column.

### Shadcn Table And Badge Primitives

Files: components/ui/table.tsx, components/ui/badge.tsx
Last updated: 2026-05-26

**Pattern notes:**
Installed from shadcn for the jobs inventory cleanup. Prefer these primitives for future data-table surfaces instead of hand-rolled table markup, and keep badge overrides tokenized with project semantic classes.

### Job Details Review Page

File: components/jobs/JobDetails.tsx, components/jobs/TailorAndApply.tsx
Last updated: 2026-05-26

| Property       | Class / Pattern                                                        |
| -------------- | ---------------------------------------------------------------------- |
| Header surface | `border-b border-default pb-6`                                         |
| Badge          | shadcn `Badge variant="outline"` with tokenized state classes          |
| Action rail    | `rounded-xl border border-default bg-surface`                          |
| Link button    | `inline-flex h-9 items-center justify-center gap-2 rounded-xl border`  |
| Content grid   | `grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]`                       |
| Warning copy   | `text-xs leading-5 text-state-warning`                                 |
| Buttons        | Existing tokenized `rounded-xl` primary and outline-style buttons      |

**Pattern notes:**
The job detail page is now an application-detail style review surface, not an auto-submit page. The header gives status/apply type/location context and a compact summary metric strip. The main column prioritizes job description and match analysis. The right rail contains posting links, resume download/generation, resume tailoring, and saved metadata. Browserbase apply attempts are not exposed in production UI.

### ImportJobUrl

File: components/jobs/ImportJobUrl.tsx
Last updated: 2026-05-28

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Wrapper          | `rounded-2xl border border-default bg-surface`                        |
| Header           | `border-b border-default px-5 py-4`                                   |
| Body             | `p-5`, inner tool `rounded-2xl border border-default bg-elevated p-5` |
| Input            | `h-10 w-full rounded-xl border border-default bg-subtle px-9 text-sm text-text-primary` |
| Primary action   | `inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent-primary px-5 text-sm font-medium text-bg-base` |
| State messages   | `rounded-xl border border-state-error/20 bg-state-error-dim px-4 py-3`, `rounded-xl border border-state-success/20 bg-state-success-dim px-4 py-3` |

**Pattern notes:**
ImportJobUrl is the manual import panel on `/jobs`. It follows the operational panel pattern used by job controls: one surface header, one elevated form tool, icon-leading URL input, primary CTA, and compact tokenized success/error states. Keep it as a jobs-workspace operation rather than moving it to the overview dashboard. Its API now performs DOM snapshot extraction, Stagehand schema extraction, and GPT-4o validation before saving so non-job pages produce clear errors.
