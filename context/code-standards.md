# Code Standards

Implementation rules and conventions for the entire project. Claude must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## TypeScript

- Strict mode enabled in tsconfig.json — no exceptions
- Never use `any` — use `unknown` and narrow the type
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why
- All function parameters and return types must be explicitly typed
- Use `type` for object shapes and unions — use `interface` only for extendable component props
- All async functions must have proper error handling — never let promises float unhandled
- Use `const` by default — only use `let` when reassignment is necessary

---

## Next.js 16 Conventions

- App Router only — no Pages Router
- React 19.2 — use React 19 APIs throughout
- All components are Server Components by default
- Only add `"use client"` when the component requires:
  - useState or useReducer
  - useEffect
  - Browser APIs
  - Event listeners
  - Third party client-only libraries (PostHog, Stagehand browser side)
- Never add `"use client"` to layout files unless absolutely required
- Data fetching happens in Server Components — never fetch in Client Components directly
- Route handlers live in `app/api/` — never put business logic directly in route handlers
- Server Actions live in `actions/` — never define Server Actions inline in components
- Caching is uncached by default — all dynamic code runs at request time. Do not assume any caching behavior.
- Use `proxy.ts` for network boundary logic — not middleware.ts (middleware is replaced in Next.js 16)
- Cache Components (`use cache`) are opt-in only — do not use unless explicitly required
- Use Next.js Devtools MCP for debugging during development
- Always read `node_modules/next/dist/docs/` before implementing any Next.js specific feature — APIs may differ from training data

---

## File and Folder Naming

- Folders: kebab-case — `job-details`, `agent-controls`
- Component files: PascalCase — `StatsBar.tsx`, `LiveFeed.tsx`
- Utility files: camelCase — `browserbase.ts`, `posthog.ts`
- Type files: camelCase — `index.ts`
- API route files: always `route.ts`
- Server Action files: camelCase — `profile.ts`, `jobs.ts`
- One component per file — never export multiple components from one file
- Index files only in `components/ui/` — never barrel export from other folders

---

## Component Structure

Every component follows this order:

```typescript
"use client"; // only if needed

// 1. External imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Internal imports
import { StatsCard } from "@/components/dashboard/StatsCard";

// 3. Type definitions
type Props = {
  jobId: string;
  status: JobStatus;
};

// 4. Component
export function ComponentName({ jobId, status }: Props) {
  // state
  // derived values
  // handlers
  // return JSX
}
```

- Never use default exports for components — always named exports
- Props type is always defined directly above the component — not in a separate types file unless shared across multiple components
- No inline styles — all styling via Tailwind classes

---

## API Route Handlers

```typescript
// app/api/agent/find/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // validate body
    // call agent function
    // return response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[agent/find]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- Every route handler has a try/catch
- Every route handler validates the request body before processing
- Errors are logged with the route path as prefix: `[agent/find]`
- Always return `{ success: boolean, data?: T, error?: string }`
- Never return raw data without the success wrapper

---

## Server Actions

```typescript
// actions/profile.ts

"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function saveProfile(formData: ProfileFormData) {
  try {
    const insforge = await createInsforgeServer();
    // validate
    // write to DB
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[actions/profile]", error);
    return { success: false, error: "Failed to save profile" };
  }
}
```

- Every Server Action has a try/catch
- Every Server Action returns `{ success: boolean, error?: string }`
- Always call `revalidatePath` after mutations that affect page data
- Never throw from Server Actions — always return the error

---

## Agent Code

```typescript
// agent/apply.ts

export async function applyToJob(
  job: Job,
  profile: Profile,
  runId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // implementation
    return { success: true };
  } catch (error) {
    // log to agent_logs table
    await logAgentError(runId, job.id, error);
    return { success: false, error: String(error) };
  }
}
```

- Every agent function returns `{ success: boolean, error?: string }`
- Every agent function has a try/catch — never let one job crash the whole run
- Errors are always logged to agent_logs table before returning
- Agent functions never import from components/ or actions/
- Agent functions never use React hooks or browser APIs

---

## InsForge Client Usage

```typescript
// Browser context (Client Components)
import { insforge } from "@/lib/insforge";

// Server context (Server Components, Route Handlers, Server Actions, Agent)
import { createInsforgeServer } from "@/lib/insforge-server";
const insforge = await createInsforgeServer();
```

- Never use the browser client in server context
- Never use the server client in browser context
- Always use the correct client for the context

---

## Error Handling

- Never use empty catch blocks — always log or handle
- Console errors always include the context prefix: `[component/function name]`
- User-facing errors must be human readable — never expose raw error messages
- Agent errors go to agent_logs table — never surface raw agent errors to the UI
- API route errors return `status: 500` with generic message — never expose internals

---

## PostHog Events

All PostHog events must use these exact event names. Never invent new event names — add them here first.

| Event                          | When                                  |
| ------------------------------ | ------------------------------------- |
| `profile_created`              | User saves profile for the first time |
| `profile_updated`              | User updates existing profile         |
| `resume_generated`             | Base resume PDF created               |
| `resume_tailored`              | Job-specific resume created           |
| `agent_started`                | Find jobs phase begins                |
| `job_found`                    | Each job discovered on LinkedIn       |
| `job_matched`                  | Job scores 70%+                       |
| `job_skipped`                  | Job scores below 70%                  |
| `application_submitted`        | Auto-apply success                    |
| `application_failed`           | Auto-apply failure                    |
| `job_dismissed`                | User dismisses from review queue      |
| `application_submitted_manual` | User applies via job details page     |
| `agent_completed`              | Full run finished                     |
| `agent_stopped`                | User manually stops run               |

Event properties must always include `userId` at minimum. Include relevant context properties per event (jobTitle, company, score, etc).

---

## Environment Variables

All environment variables are defined in `.env.local` for development. Never hardcode any key, URL, or secret anywhere in the codebase.

| Variable                        | Used In                |
| ------------------------------- | ---------------------- |
| `NEXT_PUBLIC_INSFORGE_URL`      | lib/insforge.ts        |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | lib/insforge.ts        |
| `INSFORGE_SERVICE_ROLE_KEY`     | lib/insforge-server.ts |
| `BROWSERBASE_API_KEY`           | lib/browserbase.ts     |
| `BROWSERBASE_PROJECT_ID`        | lib/browserbase.ts     |
| `OPENAI_API_KEY`                | agent/ functions       |
| `AGENTSPAN_API_KEY`             | agent/index.ts         |
| `NEXT_PUBLIC_POSTHOG_KEY`       | lib/posthog.ts         |
| `NEXT_PUBLIC_POSTHOG_HOST`      | lib/posthog.ts         |

`NEXT_PUBLIC_` prefix means the variable is exposed to the browser. Never add `NEXT_PUBLIC_` to secret keys.

---

## Match Threshold

The job match threshold is 70. This value is defined once as a constant and never hardcoded anywhere else.

```typescript
// lib/utils.ts
export const MATCH_THRESHOLD = 70;
```

Import and use `MATCH_THRESHOLD` everywhere this value is needed.

---

## Import Aliases

Always use the `@/` alias — never use relative imports that go up more than one level.

```typescript
// Correct
import { Button } from "@/components/ui/button";
import { insforge } from "@/lib/insforge";
import { MATCH_THRESHOLD } from "@/lib/utils";

// Never
import { Button } from "../../../components/ui/button";
```

---

## Comments

- No comments explaining what the code does — code should be self-explanatory
- Comments only for why — explaining a non-obvious decision
- Agent functions may have a brief comment explaining the Browserbase or Stagehand strategy used
- Never leave TODO comments in committed code

---

## Dependencies

Never install a new package without a clear reason. Before installing anything check:

1. Does shadcn/ui already have this component?
2. Does Next.js already provide this functionality?
3. Is there a simpler native solution?

Approved dependencies for this project:

- `@insforge/ssr` — InsForge client
- `@browserbasehq/sdk` — Browserbase sessions
- `@browserbasehq/stagehand` — AI browser control
- `openai` — GPT-4o API
- `agentspan` — Agent durability
- `posthog-js` — PostHog browser client
- `posthog-node` — PostHog server client
- `@react-pdf/renderer` — Resume PDF generation
- `zod` — Schema validation
- `lucide-react` — Icons
- `tailwindcss` — Styling
- `shadcn/ui` components — UI primitives

Do not install any other packages without updating this list first.
