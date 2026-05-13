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

### Navbar
File: components/layout/Navbar.tsx
Wrapper:    `fixed top-0 z-50 h-16 w-full bg-surface border-b border-border-default`
Inner:      `max-w-7xl mx-auto px-6 h-full flex items-center justify-between`
Logo:       `text-primary font-semibold text-base tracking-tight`
Nav links:  `text-sm text-muted hover:text-secondary transition-colors duration-150`
CTA link:   `h-9 px-4 rounded-xl bg-accent-primary hover:bg-accent-hover text-bg-base text-sm font-medium transition-colors duration-150 inline-flex items-center`
Notes:      Static Server Component. CTA is a styled Link, not Button component. Find Jobs → /login until auth is wired.

### Footer
File: components/layout/Footer.tsx
Wrapper:    `bg-surface border-t border-border-default`
Inner:      `max-w-7xl mx-auto px-6 py-6`
Text:       `text-sm text-muted`
Notes:      Homepage only. Minimal — copyright text only.

### Hero
File: components/homepage/Hero.tsx
Wrapper:    `min-h-screen flex flex-col items-center justify-center text-center px-6`
Headline:   `text-5xl font-bold text-primary leading-tight max-w-2xl`
Subhead:    `mt-4 text-lg text-secondary max-w-xl`
CTA link:   `mt-8 h-11 px-6 rounded-xl bg-accent-primary hover:bg-accent-hover hover:shadow-accent text-bg-base text-base font-medium transition-colors duration-150 inline-flex items-center`
Notes:      Hero CTA is larger than standard (h-11 px-6 vs h-9 px-4). hover:shadow-accent on primary CTA only.

### HowItWorks
File: components/homepage/HowItWorks.tsx
Section:    `py-24 px-6`
Grid:       `grid grid-cols-1 md:grid-cols-3 gap-6`
Card:       `bg-elevated rounded-2xl border border-border-default p-6`
Step num:   `text-accent-primary font-mono text-sm font-bold mb-3`
Title:      `text-base font-semibold text-primary mb-2`
Body:       `text-sm text-muted`
Notes:      Data lives in a typed const array in the component file. Pattern for all future step/feature card grids.

### Features
File: components/homepage/Features.tsx
Section:    `py-24 px-6 bg-surface`
Grid:       `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`
Card:       `bg-elevated rounded-2xl border border-border-default p-6`
Icon:       `h-8 w-8 text-accent-primary mb-3` with `strokeWidth={1.5}`
Title:      `text-base font-semibold text-primary mb-2`
Body:       `text-sm text-muted`
Notes:      Feature type defined inline above component. LucideIcon type used for icon prop. bg-surface section background creates contrast with HowItWorks (bg-base).

---

## Approved Patterns Locked In Advance

These patterns are pre-approved from ui-rules.md and must be used exactly as written. Do not deviate.

### Primary Button

```
bg-accent-primary hover:bg-accent-hover text-bg-base font-medium h-9 px-4 rounded-xl transition-colors
```

### Secondary Button

```
bg-elevated hover:bg-subtle border border-default hover:border-subtle text-secondary hover:text-primary h-9 px-4 rounded-xl transition-colors
```

### Ghost Button (icon only)

```
hover:bg-subtle text-muted hover:text-secondary h-8 w-8 rounded-xl transition-colors
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
bg-subtle border border-default rounded-xl h-10 px-3 text-primary placeholder:text-muted focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors outline-none
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
Number: text-2xl font-bold text-primary
Label:  text-xs text-muted uppercase tracking-wide mt-1
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
px-4 py-3 text-xs text-muted uppercase tracking-wide font-medium text-left
```

### Table Body Row

```
border-b border-default last:border-0 hover:bg-elevated transition-colors
```

### Table Body Cell

```
px-4 py-3 text-sm text-secondary
```

### Empty State

```
flex flex-col items-center justify-center py-16 gap-3
Icon:    h-10 w-10 text-faint
Heading: text-base font-medium text-muted
Body:    text-sm text-faint text-center max-w-xs
```

### Skill Tag

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-accent-dim text-accent-text border border-accent-border
```

### Live Feed Entry

```
flex items-start gap-3 py-2.5 border-b border-default last:border-0
Timestamp:    text-xs text-faint font-mono w-16 shrink-0 pt-0.5
Level dot:    h-2 w-2 rounded-full shrink-0 mt-1.5
Message:      text-sm text-secondary
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
