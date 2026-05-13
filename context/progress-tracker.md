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

**Phase:** 1 — Foundation
**Current feature:** Completed 01 Homepage
**Next up:** 02 InsForge auth
**Blocking issues:** None

---

## Build Phases

### Phase 1 — Foundation

- [x] 01 Homepage
- [ ] 02 InsForge auth
- [ ] 03 Database schema
- [ ] 04 Smart redirect

### Phase 2 — Profile

- [ ] 05 Profile form
- [ ] 06 Profile load
- [ ] 07 Profile edit

### Phase 3 — Resume

- [ ] 08 Resume generation
- [ ] 09 Resume preview

### Phase 4 — Agent Core

- [ ] 10 Browserbase setup
- [ ] 11 Stagehand setup
- [ ] 12 LinkedIn browsing
- [ ] 13 GPT-4o matching

### Phase 5 — Auto Apply

- [ ] 14 Cover letter generation
- [ ] 15 Apply agent
- [ ] 16 AgentSpan wrapping

### Phase 6 — Review Flow

- [ ] 17 Review queue
- [ ] 18 Job details page
- [ ] 19 Resume tailoring
- [ ] 20 Manual apply

### Phase 7 — Dashboard

- [ ] 21 Agent controls
- [ ] 22 Stats bar
- [ ] 23 Live agent feed
- [ ] 24 Browserbase session recording
- [ ] 25 Auto-applied jobs table
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

### ✅ 01 Homepage — completed 2026-05-13
Notes: shadcn/ui init (v4, Tailwind v4 compatible) and lucide-react installed as part of this feature. globals.css token system added alongside shadcn's base variables — our @theme inline block appended after shadcn's, overriding --color-primary/secondary/muted with our warm text palette. Border token classes are border-border-default / border-border-subtle / border-border-strong (Tailwind v4 generates border-<colorname> from --color-border-<x>). Font variables fixed in layout.tsx from --font-geist-sans → --font-sans. MATCH_THRESHOLD = 70 added to lib/utils.ts. All components are Server Components — no use client anywhere on this page.

---

## Architecture Decisions

_Decisions made during the build that deviate from or extend the context files._

_None yet._

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

_None yet._

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

_None yet._

Format when adding:

```
### Session — [date]
Built: [what was completed]
Left off: [exactly where the session ended]
Next session starts with: [first thing to do next time]
```
