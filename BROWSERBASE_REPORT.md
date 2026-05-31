# Browserbase Integration Report — JobPilot

---

## What We Tried Based on Your Feedback

After the initial session recordings, the Browserbase team provided four recommendations. Here's what we implemented and the result for each.

---

### 1. Viewport set to `1288 × 711`

**Result:** Reduced `fillFormVision` coordinate misses. Vision-based actions now hit the correct fields more consistently on standard ATS forms.

---

### 2. Switched from GPT to Claude Sonnet (`anthropic/claude-sonnet-4-6`)

**Result:** Meaningful improvement. Standard fields (name, email, phone, LinkedIn, resume) fill correctly on the first attempt. The "no-clear-before-input" problem that stacked duplicate values is gone. Claude's field accuracy is noticeably better than GPT.

---

### 3. Capped `maxSteps`

Set `maxSteps: 40` on external apply and `maxSteps: 30` on LinkedIn Easy Apply.

**Result:** No more unbounded retry loops. The agent stops and reports its state instead of spinning indefinitely.

---

### 4. `observe()` + `act()` for standard fields

Replaced free-running agent typing with an `observe()` → `act()` sequence for known fields (name, email, phone, LinkedIn, portfolio, location). `observe()` finds the element once; `act()` fills it using the discovered selector directly.

Open-ended textareas (e.g. "Why do you want to work here?") are now filled via `page.fill()` — a single CDP write using a short LLM-generated answer prepared before the browser session opens. This eliminated the 45-second `keys()` timeout that previously consumed 8+ minutes per form.

**Result:** Standard fields fill fast and accurately. The agent handles only dropdowns, radio buttons, custom widgets, and the submit step.

---

## Current State After All Four Changes

**What's working:**
- Standard field fills (name, email, phone, LinkedIn, resume upload) — fast and correct
- Simple single-page external ATS forms — completing and submitting successfully
- Session recordings, post-fill review extraction, submission confirmation — all working

**What's still struggling:**

| Issue | Detail |
| --- | --- |
| Complex multi-page ATS forms | Still take 8–15 min. Session times out or auth token expires before completion |
| LinkedIn Easy Apply multi-step modal | Single-step works. Multi-step (4+ pages) doesn't complete reliably — agent stalls on custom LinkedIn widgets (numeric steppers, card-style radio groups) or exhausts step budget before Submit |
| Submission false negatives | Fixed — broadened detection to recognise post-submission next-step pages (e.g. "complete your interview") as a successful submission |

---

## Summary

Field fill quality is significantly better after implementing all four recommendations — especially the Claude Sonnet switch and `observe()` + `act()`. The remaining blockers are session duration on complex forms and LinkedIn Easy Apply's non-standard widget types.
