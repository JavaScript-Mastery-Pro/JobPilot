<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

## Read These Files First — Every Session, No Exceptions

Read in this exact order before any implementation or architectural decision:

1. `context/project-overview.md` — what we are building and why
2. `context/architecture.md` — system structure, boundaries, and invariants
3. `context/ui-tokens.md` — design constants, colors, typography
4. `context/ui-rules.md` — how to use the tokens, component patterns
5. `context/ui-registry.md` — every component already built and its exact classes
6. `context/code-standards.md` — TypeScript, Next.js, API conventions
7. `context/library-docs.md` — project-specific rules for all third party libraries
8. `context/build-plan.md` — ordered feature list and phases
9. `context/progress-tracker.md` — current phase, what is done, what is next

Do not write a single line of code before reading all nine files.

---

## Before Any Implementation

- Confirm you have read all nine context files
- Summarise the current task from `progress-tracker.md` before starting
- If the task involves a third party library — re-read the relevant section in `library-docs.md`
- If the task involves UI — re-read `ui-registry.md` and match existing patterns exactly

---

## Before Writing Any UI Component

- Read `ui-tokens.md` — use only defined CSS variable token classes
- Read `ui-registry.md` — find the closest existing component and match it exactly
- Never use hardcoded hex values anywhere
- Never use raw Tailwind color classes — no zinc-_, gray-_, slate-_, amber-_, yellow-\*
- Never invent new patterns — extend existing ones
- Update `ui-registry.md` immediately after building any new component

---

## Before Any Third Party Library Usage

- Read the relevant section in `context/library-docs.md`
- The rules there are authoritative for this project
- Do not use patterns from training data if they conflict with `library-docs.md`
- Installed skills provide general API knowledge — `library-docs.md` provides project-specific rules

---

## After Completing Any Feature

- Update `context/progress-tracker.md` — mark feature complete, add session notes
- Update `context/ui-registry.md` — add any new components built with exact classes
- If architecture changed — update `context/architecture.md` before continuing
- If new patterns introduced — update `context/ui-rules.md` before continuing

---

## Hard Stop Rule

If the same problem persists after one corrective prompt:

1. Stop immediately — do not send another corrective prompt
2. Run `/handoff` to document current state
3. Start a completely fresh session
4. Re-read `context/library-docs.md` relevant section
5. Re-implement from scratch with docs in context

Iterating on broken code always makes it worse. A fresh session with the right context always works faster.

---

## Invariants — Never Violate These

- API routes contain no UI logic. Components contain no DB logic.
- Agent code in `agent/` never imports from `components/` or `actions/`
- Server Actions never call agent functions — agent functions are only called from API routes
- All InsForge DB writes from the agent go through `lib/insforge-server.ts` only
- Easy Apply is never touched — agent only processes jobs with external apply URLs
- Every Stagehand `act()` call is wrapped in try/catch — failures logged to agent_logs, never crash the run
- Match threshold always comes from `MATCH_THRESHOLD` in `lib/utils.ts` — never hardcoded
- AgentSpan step IDs always use format `apply-{job_id}` — ensures idempotency on retry
- No hardcoded hex values or raw Tailwind color classes anywhere in components

---

## Available Skills

- `/grill-with-docs` — run before implementing any feature spec. Finds gaps and builds shared language.
- `/handoff` — run at the end of every session. Compacts state for the next session.
- `/diagnose` — run when stuck after one failed correction. Disciplined debug loop.
- `/caveman` — compressed prompt mode for token efficiency.
