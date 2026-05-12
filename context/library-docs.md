# Library Docs

Project-specific rules for every third party library used in this project. The installed skills handle general API knowledge. This file only covers how we use each library in this specific project — rules, patterns, and constraints that the skills won't know.

Read the relevant section before implementing any feature that uses these libraries.

---

## Browserbase

**Project-specific rules:**

- Always create a brand new session for each company careers page — never reuse the LinkedIn session
- The LinkedIn session is for browsing only — all form filling happens in separate isolated sessions
- Always end sessions when done — call `status: 'REQUEST_RELEASE'` to avoid consuming session quota
- Session recording URL format: `https://browserbase.com/sessions/{session.id}` — use this for the dashboard embed
- Pass `session.id` directly to Stagehand as `browserbaseSessionID` — do not connect via Playwright separately
- Project ID comes from `process.env.BROWSERBASE_PROJECT_ID` — never hardcode it
- Client lives in `lib/browserbase.ts` — always import from there, never initialise inline

---

## Stagehand

**Project-specific rules:**

- Always use `act()` with the variables syntax when inserting user data — avoids prompt injection
- Always use `extract()` with a Zod schema — never parse raw HTML or use regex on page content
- Always wrap every `act()` call in try/catch — company career page forms vary wildly in structure
- Never use hardcoded Playwright selectors — always let Stagehand find elements via natural language
- Always call `stagehand.close()` when done — this also ends the Browserbase session
- Stagehand init lives in `lib/stagehand.ts` — always import the helper from there
- Model is always `gpt-4o` — never use other models for Stagehand

**LinkedIn-specific rules:**

- Only extract jobs where `isEasyApply: false` — never touch Easy Apply listings
- After extracting job listings always filter for jobs that have a valid `externalApplyUrl`
- Add a 3-5 second delay between navigating to each company page — avoids rate limiting

---

## OpenAI GPT-4o

**Project-specific rules:**

- Model string is always `'gpt-4o'` — never use other model names anywhere in this project
- Use `response_format: { type: 'json_object' }` for matching, scoring, and resume generation
- Always parse `response.choices[0].message.content` as a string — even with json_object format it returns a string
- Always validate parsed JSON before using — never assume the structure is correct
- Temperature settings are fixed:
  - `0.3` for matching and scoring — deterministic results
  - `0.7` for cover letters and resume writing — natural variation
- Max tokens settings:
  - Cover letters: `max_tokens: 400` — company forms have character limits
  - Resume content: `max_tokens: 800`
  - Matching and scoring: `max_tokens: 200`
- Match threshold is always `MATCH_THRESHOLD` from `lib/utils.ts` — never hardcode 70

---

## AgentSpan

**Project-specific rules:**

- Run `agentspan server start` before any agent session — execution UI available at localhost:6767
- Wrap the apply loop only — LinkedIn browsing and GPT-4o matching run outside AgentSpan
- Step ID format must always be `apply-{job_id}` — ensures idempotency on retry, prevents duplicate applications
- Save `agentspan_run_id` to the `agent_runs` table after starting a run — needed for status tracking
- Agent entry point lives in `agent/index.ts` — AgentSpan wrapping only, never inline in API routes
- Never call agent functions directly when AgentSpan is wrapping them — always go through `runtime.run()`

---

## PostHog

**Project-specific rules:**

- Client-side: import from `posthog-js` — initialised in `app/providers.tsx`
- Server-side: import from `lib/posthog-server.ts` — never initialise PostHog inline in routes or agent functions
- Server-side instances must always have `flushAt: 1` and `flushInterval: 0` — Next.js server functions are short-lived
- Always call `await posthog.shutdown()` at the end of every server-side function — ensures events are sent before function ends
- Always call `posthog.identify(userId)` after login — connects all events to the known user
- Always call `posthog.reset()` on logout — disconnects anonymous events from the identified user
- Event names must match exactly the list in `code-standards.md` — never invent new event names
- Always include `userId` as a property on every server-side event — minimum required property

---

## @react-pdf/renderer

**Project-specific rules:**

- Server-side only — never import in client components or files with `use client`
- Always use `renderToBuffer` in API routes — not `renderToStream` or `PDFDownloadLink`
- PDF generation always happens in `app/api/resume/` routes — never in Server Actions or agent functions
- Generated buffer is uploaded directly to InsForge Storage — never written to disk
- Storage path format: `resumes/{user_id}/resume.pdf` for base resume, `resumes/{user_id}/{job_id}.pdf` for tailored resume
- After upload always save the public URL back to the relevant DB record — `profiles.resume_pdf_url` or `jobs.resume_url`
- Only a subset of CSS properties work — use only: padding, margin, fontSize, color, fontFamily, flexDirection, alignItems, justifyContent, borderRadius, width, height
