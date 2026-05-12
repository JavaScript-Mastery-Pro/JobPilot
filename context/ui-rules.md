# UI Rules

How to use the tokens defined in ui-tokens.md. These are prescriptive rules — not suggestions. Claude must follow them for every component in every session.

---

## Non-Negotiable Rules

- Never use hardcoded hex values anywhere in JSX or CSS
- Never use raw Tailwind color classes — no zinc-_, gray-_, slate-_, yellow-_, amber-\*
- Never use light mode classes or light mode variants
- Always use the CSS variable token classes defined in ui-tokens.md
- Always check ui-registry.md before building any new component — match existing patterns exactly
- Always use shadcn/ui components from components/ui/ before building anything custom
- Never invent new patterns — extend existing ones

---

## Layout

### Page Structure

Every page follows this structure:

```
<html> bg-base
  <body> font-sans antialiased text-primary
    <Navbar /> fixed top-0 h-16 w-full
    <main> pt-16 min-h-screen bg-base
      {page content}
    </main>
    <Footer /> (homepage only)
```

### Content Width

```
Max content width:  max-w-7xl mx-auto px-6
Dashboard sections: full width within max-w-7xl
Cards and panels:   no fixed width — flex or grid driven
```

### Navbar

```
Background:   bg-surface border-b border-default
Height:       h-16
Padding:      px-6
Logo:         left aligned, text-primary font-semibold
Nav links:    center or right, text-secondary hover:text-primary transition-colors
CTA button:   right aligned, primary button style
```

---

## Component Patterns

### Cards

Used for stats, job listings, review queue items, and feature sections.

```
bg-elevated rounded-2xl border border-default p-5 or p-6
Hover state (if interactive): hover:border-subtle transition-colors
Shadow: shadow-card (optional, use sparingly)
```

Never use bg-base for cards — cards must be visually elevated above the page background.

### Panels

Used for larger sections like the live feed, session recording, and analytics.

```
bg-surface rounded-2xl border border-default
Panel header: px-5 py-4 border-b border-default
Panel body:   p-5
```

### Inputs

```
bg-subtle border border-default rounded-xl h-10 px-3
text-primary placeholder:text-muted
focus:border-accent-border focus:ring-1 focus:ring-accent-border
transition-colors outline-none
```

### Buttons

**Primary button** — main CTA, Find Jobs, Apply, Generate Resume

```
bg-accent-primary hover:bg-accent-hover
text-bg-base font-medium
h-9 px-4 rounded-xl
transition-colors
Active/loading: opacity-70 cursor-not-allowed
Accent glow on hover: hover:shadow-accent (use only on primary CTA)
```

**Secondary button** — cancel, back, secondary actions

```
bg-elevated hover:bg-subtle
border border-default hover:border-subtle
text-secondary hover:text-primary
h-9 px-4 rounded-xl
transition-colors
```

**Ghost button** — icon buttons, dismiss, inline actions

```
hover:bg-subtle
text-muted hover:text-secondary
h-8 w-8 rounded-xl (icon only)
or h-8 px-3 rounded-xl (with label)
transition-colors
```

**Destructive button** — delete, permanent actions only

```
bg-state-error-dim hover:bg-state-error/20
border border-state-error/25
text-state-error
h-9 px-4 rounded-xl
transition-colors
```

### Status Badges

Used in jobs table and review queue for job status display.

```
Base structure:
  inline-flex items-center gap-1.5
  px-2.5 py-1 rounded-full text-xs font-medium

Applied:    bg-state-success-dim text-state-success border border-state-success/20
Failed:     bg-state-error-dim text-state-error border border-state-error/20
Applying:   bg-state-warning-dim text-state-warning border border-state-warning/20
Matched:    bg-state-info-dim text-state-info border border-state-info/20
Skipped:    bg-state-neutral-dim text-state-neutral border border-state-neutral/20
Found:      bg-state-neutral-dim text-state-neutral border border-state-neutral/20
```

Never use plain colored text without the dim background for status badges.

### Match Score Display

Used in jobs table and job details page.

```
Score 70–100 (strong match):  text-state-success font-semibold
Score 50–69 (partial match):  text-state-warning font-semibold
Score 0–49  (weak match):     text-state-error font-semibold

Accompanied by a thin progress bar:
  bg-subtle rounded-full h-1.5 w-24
  Fill color matches score color above
```

### Stats Cards

Used in the dashboard stats bar.

```
bg-elevated rounded-2xl border border-default p-5
Stat number:  text-2xl font-bold text-primary
Stat label:   text-xs text-muted uppercase tracking-wide mt-1
Trend/icon:   text-accent-primary (positive) or text-state-error (negative)
```

### Table

Used for the auto-applied jobs table.

```
Table wrapper:  bg-surface rounded-2xl border border-default overflow-hidden
Header row:     bg-subtle border-b border-default
Header cell:    px-4 py-3 text-xs text-muted uppercase tracking-wide font-medium text-left
Body row:       border-b border-default last:border-0 hover:bg-elevated transition-colors
Body cell:      px-4 py-3 text-sm text-secondary
Expandable row: bg-subtle border-t border-default px-4 py-4
```

### Live Feed Entry

Used in the agent live feed panel.

```
Each entry:   flex items-start gap-3 py-2.5 border-b border-default last:border-0
Timestamp:    text-xs text-faint font-mono w-16 shrink-0 pt-0.5
Level dot:    h-2 w-2 rounded-full shrink-0 mt-1.5
  info:       bg-state-neutral
  success:    bg-state-success
  warning:    bg-state-warning
  error:      bg-state-error
Message:      text-sm text-secondary
Company name: text-accent-text font-medium (when present)
```

### Form Fields

Used in profile form.

```
Field wrapper:  flex flex-col gap-1.5
Label:          text-sm font-medium text-secondary
Input/Select:   (see Inputs pattern above)
Helper text:    text-xs text-muted mt-1
Error message:  text-xs text-state-error mt-1
```

### Skill Tags

Used in profile form for skills array input.

```
Tag:          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
              bg-accent-dim text-accent-text border border-accent-border
Remove icon:  h-3 w-3 text-accent-text hover:text-primary cursor-pointer
```

### Empty States

Used when no jobs are found, review queue is empty, etc.

```
flex flex-col items-center justify-center py-16 gap-3
Icon:     h-10 w-10 text-faint
Heading:  text-base font-medium text-muted
Body:     text-sm text-faint text-center max-w-xs
CTA:      primary or secondary button (if applicable)
```

### Loading States

Used while agent is running or data is loading.

```
Skeleton:   bg-subtle animate-pulse rounded-xl
Spinner:    h-4 w-4 border-2 border-accent-border border-t-accent-primary rounded-full animate-spin
```

---

## Icons

Lucide React only. Stroke-based — never filled variants.

| Context          | Size        |
| ---------------- | ----------- |
| Inline text icon | `h-4 w-4`   |
| Button icon      | `h-4 w-4`   |
| Nav icon         | `h-5 w-5`   |
| Empty state icon | `h-10 w-10` |
| Stat card icon   | `h-5 w-5`   |

Always use `strokeWidth={1.5}` for icons larger than `h-5 w-5`.

---

## Motion and Transitions

- All interactive elements use `transition-colors duration-150`
- Never use complex animations on data-heavy components — tables, feeds, lists
- Skeleton loading uses `animate-pulse` only
- Spinner uses `animate-spin` only
- No entrance animations, slide-ins, or fade-ins on dashboard components — they slow perceived performance

---

## Navbar Rules

- Always visible — `fixed top-0 z-50`
- Never obscured by page content — all pages have `pt-16` on main
- Active nav link: `text-primary` with `border-b-2 border-accent-primary`
- Inactive nav link: `text-muted hover:text-secondary transition-colors`
- Mobile: not in scope — desktop only

---

## Homepage Specific Rules

Homepage is the only page with a footer and marketing sections.

```
Hero section:
  min-h-screen flex flex-col items-center justify-center text-center
  Headline: text-4xl font-bold text-primary (or larger on desktop)
  Subheadline: text-lg text-secondary max-w-xl mx-auto mt-4
  CTA button: primary button, larger — h-11 px-6
  Subtle accent glow behind CTA: shadow-accent

How it works section:
  3 step cards in a row — bg-elevated rounded-2xl border border-default p-6
  Step number: text-accent-primary font-mono text-sm font-bold mb-3
  Step title: text-base font-semibold text-primary
  Step body: text-sm text-muted

Features section:
  Similar to how it works — 3 or 4 feature cards
  Icon: h-8 w-8 text-accent-primary mb-3
  Feature title: text-base font-semibold text-primary
  Feature body: text-sm text-muted
```

---

## Dashboard Layout

```
Page:         pt-16 (navbar offset) bg-base
Content:      max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6

Stats bar:    grid grid-cols-2 md:grid-cols-5 gap-4
Agent controls: flex items-center gap-3 (inputs + buttons inline)

Main area:    grid grid-cols-1 lg:grid-cols-3 gap-6
  Left col (lg:col-span-2): jobs table + review queue
  Right col (lg:col-span-1): live feed + session recording

Analytics:    full width below main area
```

---

## Consistency Checklist

Before submitting any component, verify:

- [ ] All colors use token classes — no hardcoded values
- [ ] Border radius matches the context (badge=rounded-full, button=rounded-xl, card=rounded-2xl)
- [ ] Interactive elements have hover and transition-colors
- [ ] Text hierarchy is correct — primary for headings, secondary for body, muted for labels
- [ ] Status badges use the correct color mapping from ui-tokens.md
- [ ] Icons are Lucide React, stroke-based, correct size for context
- [ ] Component matches the closest existing pattern in ui-registry.md
