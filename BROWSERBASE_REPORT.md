# Browserbase Integration Report — JobPilot

This document covers how Browserbase and Stagehand are used in JobPilot, the full history of what was attempted with automated job application form filling, what worked, what didn't, and the current project state.

---

## Goal

Automate the full job application workflow: discover jobs from LinkedIn, score them against a candidate profile, and submit applications to external ATS forms (Greenhouse, Lever, Workday, etc.) without manual input from the user.

---

## What Is Currently Working in the Project

### 1. LinkedIn Job Discovery via Context Sessions

**Files:** `lib/browserbase.ts`, `lib/stagehand.ts`, `agent/linkedin.ts`

The most reliable use of Browserbase in this project. The flow:

1. The user connects their LinkedIn account by opening a live Browserbase session in their browser, logging in to LinkedIn, and saving the resulting context ID to their profile.
2. When "Find Jobs" runs, a new Browserbase session is created using `createSession` with that saved `contextId`. Because the context is authenticated, LinkedIn search and job listing pages load without re-login or CAPTCHA challenges.
3. Stagehand navigates LinkedIn job search, extracts job cards (title, company, location, source URL, external apply URL), and saves them to the database.
4. After discovery, each job is scored against the user's profile by an LLM. Jobs above the match threshold are saved as `found` for user review.

**Browserbase features used:**

- `contextId` with `persistContext: true` — keeps the LinkedIn session alive across runs
- `waitForCaptchaSolves: true` — handles any LinkedIn bot checks automatically
- `userMetadata` — per-session tagging with run ID, job ID, and feature name for the Browserbase dashboard

This path works reliably. Context persistence is the key — without it, every discovery run would require manual LinkedIn login.

---

### 2. Session Recording Saved Per Apply Attempt

**Files:** `agent/recording.ts`, `agent/apply.ts`

Every Browserbase session created for an apply attempt saves the `recordingUrl` to the database immediately after session creation. This means even when the apply attempt fails, the Browserbase session recording is saved and visible in the job detail page.

This is intentional — the recordings are the primary evidence for reviewing what the automation actually did on each form.

---

### 3. Metadata Sanitization for Browserbase Sessions

**File:** `lib/browserbase.ts`

Browserbase `userMetadata` values have strict character requirements. Job titles and company names from real listings often contain commas, parentheses, and long strings that cause `400 Value is not a valid metadata value` errors. A sanitization step converts raw values into safe slug-like strings before session creation.

---

## What Was Attempted — Apply Automation History

### Attempt 1: DOM Mode

**Stagehand configuration:** `stagehand.agent({ mode: "dom" })`

DOM mode uses the accessibility tree exclusively to identify and interact with form elements. The idea was that explicit DOM structure would prevent the coordinate-misfill problem seen in hybrid mode.

**Result:** Did not work after approximately 3 days of iteration. DOM mode struggled with Greenhouse/ATS forms because many fields have ambiguous accessibility labels and the agent could not reliably distinguish between visually adjacent inputs (e.g. First Name vs Last Name in a two-column layout). The agent would either skip fields or interact with the wrong element.

---

### Attempt 2: Hybrid Mode with System Prompt

**Stagehand configuration:** `stagehand.agent({ mode: "hybrid" })` with a detailed instruction listing every candidate variable explicitly mapped to each field label

The instruction used `%variable%` substitution syntax:

```
First Name field → %firstName%
Last Name field → %lastName%
Email field → %email%
...
```

**Result:** Variable substitution itself worked — the correct values reached the agent. The problem was field targeting. In hybrid mode, Stagehand uses both the accessibility tree and vision (screenshots). It exposed a `fillFormVision` tool that targets fields using pixel coordinates estimated from screenshots.

The Browserbase viewport size did not always match what the agent's coordinate estimation expected, so `fillFormVision` sometimes clicked into the wrong field. On top of that, after `fillFormVision` finished the agent would re-examine the form, conclude that some fields looked wrong, and retry using natural language element targeting (`type` tool). These retries landed on wrong elements and stacked values on top of existing content without clearing first.

**Specific failure observed (Automattic Greenhouse form):**

```
First Name field: metalshohan4@gmail.commetalshohan4@gmail.commetalshohan4@gmail.com
Preferred First Name: 01647416416  (phone number)
Last Name: (empty)
Email: metalshohan4@gmail.com  ✓
Phone: 01647416416  ✓
```

The email and phone were correct. The agent knew the right values. The problem was purely field targeting — the agent typed email into First Name three times across three retry attempts, and Tab-based keyboard navigation landed the phone value into Preferred First Name instead.

Total time for this attempt: ~6 minutes for a 5-field form (caused by GPT-5.4 model latency × 28+ tool calls in the retry loop).

---

### Attempt 3: Experimental Mode (`experimental: true`)

**Stagehand configuration:** `experimental: true` on the session, hybrid mode agent

The `experimental` flag was added specifically to the external apply path for manual-trigger attempts from the job detail page. It was not applied to Easy Apply or auto-queued sessions.

**Result:** Enabled the Stagehand hybrid agent but did not resolve the field-targeting problem. The retry loop behavior was the same.

---

### Attempt 4: Post-Fill Review Extraction

**File:** `agent/apply.ts` — `extractExternalApplyReview()`

After the agent finishes (success or failure), a separate `stagehand.extract()` call reads the current form state and returns a structured review:

```typescript
{
  filledFields: [{ label, value, expectedApplicantField, confidence }],
  emptyRequiredFields: string[],
  possibleMisfilledFields: [{ label, value, reason }],
  blockers: string[],
  canSubmit: boolean,
  summary: string
}
```

This was added to catch cases where the agent called `done` but the form was not actually complete or correct. `canSubmit: false` blocks submission and surfaces the real reason to the user instead of silently failing.

**Result:** This works well as a safety net. It correctly identified the misfilled fields in every test run and accurately reported `canSubmit: false` with specific blockers. This is now the primary mechanism that prevents bad submissions from going through.

---

### Attempt 5: LinkedIn Easy Apply via DOM Mode with Context

**Stagehand configuration:** `stagehand.agent({ mode: "dom" })` with `contextId` from saved LinkedIn connection

The LinkedIn Easy Apply path is different from the external ATS path. Because the Browserbase context has saved LinkedIn authentication, the Easy Apply modal opens in the same session without re-login. DOM mode is used here because the LinkedIn Easy Apply modal has a well-structured, consistent accessibility tree.

**Result:** The Easy Apply path reaches the modal and attempts to fill fields. It is marked as experimental in the UI. It has not been tested at sufficient scale to confirm reliability across all job types.

---

## Hard Stops — What Cannot Be Automated Regardless of Approach

Some application forms have requirements that no browser automation can satisfy:

1. **External secret/API challenge** — The Automattic application form requires the applicant to call a specific WordPress.com API endpoint and paste the returned secret value. This cannot be derived from the candidate profile.
2. **Custom take-home assessments** — Some applications redirect to a skills test that requires human judgment.
3. **Mandatory CAPTCHA with account creation wall** — Some ATS platforms require creating an account before the form can be accessed.

The review extraction schema (`blockers`) explicitly catches and surfaces these cases so the agent stops rather than submitting an incomplete application.

---

## Root Cause Analysis — Why Form Filling Failed

The problems were not with Browserbase session reliability or variable substitution. The root causes were:

1. **`fillFormVision` coordinate mismatch** — vision-based field targeting uses pixel coordinates from screenshots. When the rendered viewport size differs from the LLM's coordinate estimate, the click lands on the wrong element. This is inherent to coordinate-based vision targeting on arbitrary external forms.

2. **No clear-before-type discipline** — The agent retried fields without selecting and clearing existing content first, causing values to accumulate (email typed 3 times into the same field).

3. **Tab keyboard navigation** — The agent used `Tab` and `Shift+Tab` to move between fields. On forms with hidden fields or non-standard tab order, this lands on unpredictable elements.

4. **Retry loop amplification** — When the agent saw a field looked wrong, it retried with a different strategy. Each retry compounded the problem instead of fixing it. With 28+ tool calls and a slow model (GPT-5.4), this produced ~6 minute sessions for a 5-field form.

---

## Current Project State

| Feature                                        | Status                                       |
| ---------------------------------------------- | -------------------------------------------- |
| LinkedIn job discovery via Browserbase context | ✅ Working                                   |
| Context persistence for authenticated sessions | ✅ Working                                   |
| CAPTCHA solving (`waitForCaptchaSolves`)       | ✅ Working                                   |
| Session recording saved per attempt            | ✅ Working                                   |
| Metadata sanitization for session tagging      | ✅ Working                                   |
| Post-fill review extraction (safety net)       | ✅ Working                                   |
| LinkedIn Easy Apply via DOM mode               | ⚗️ Experimental                              |
| External ATS form filling via hybrid mode      | ⚗️ Experimental — field targeting unreliable |
| Unattended auto-submit to external ATS         | ❌ Not shipped                               |

---

## Product Decision

The discovery, match scoring, and apply-link workflow is stable and working. The Browserbase session infrastructure works correctly for authenticated LinkedIn browsing.

The Stagehand apply automation is kept in the codebase and accessible from each job's detail page, labeled as experimental, for review. It is not presented as a reliable submission path. The post-fill review extraction (`canSubmit` check) ensures no application is silently submitted in a bad state.

The primary value of the Browserbase integration at this stage is **authenticated job discovery** — running LinkedIn searches from a real saved user session, which produces better job data than any public scraping approach.
