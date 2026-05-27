# UI Tokens

All colors, typography, spacing, and border radius values for the project. These are the single source of truth. Claude must never use hardcoded hex values or raw Tailwind color classes anywhere in the codebase. Only use the CSS variables and Tailwind tokens defined here.

---

## How Tokens Are Defined

All tokens are defined as CSS custom properties in `app/globals.css` and mapped to Tailwind via `@theme inline`. Always use the Tailwind utility class — never the raw CSS variable directly in JSX.

---

## Color Tokens

### Backgrounds

| Role             | CSS Variable    | Hex                  | Tailwind Class |
| ---------------- | --------------- | -------------------- | -------------- |
| Page background  | `--bg-base`     | `#0C0A08`            | `bg-base`      |
| Surface          | `--bg-surface`  | `#131108`            | `bg-surface`   |
| Elevated surface | `--bg-elevated` | `#1A1710`            | `bg-elevated`  |
| Subtle surface   | `--bg-subtle`   | `#222016`            | `bg-subtle`    |
| Overlay          | `--bg-overlay`  | `rgba(12,10,8,0.85)` | `bg-overlay`   |

The base background is a very deep warm near-black with a slight brown undertone. Not pure black — the warmth makes the amber accent feel intentional rather than random.

### Borders

| Role           | CSS Variable       | Hex       | Tailwind Class   |
| -------------- | ------------------ | --------- | ---------------- |
| Default border | `--border-default` | `#2C2A1E` | `border-default` |
| Subtle border  | `--border-subtle`  | `#3A3828` | `border-subtle`  |
| Strong border  | `--border-strong`  | `#4A4830` | `border-strong`  |

### Text

| Role           | CSS Variable       | Hex       | Tailwind Class   |
| -------------- | ------------------ | --------- | ---------------- |
| Primary text   | `--text-primary`   | `#F5F0E8` | `text-primary`   |
| Secondary text | `--text-secondary` | `#C4B898` | `text-secondary` |
| Muted text     | `--text-muted`     | `#857A60` | `text-muted`     |
| Faint text     | `--text-faint`     | `#504A38` | `text-faint`     |

Warm whites and tans — not cold blue-whites. Matches the warm dark background.

### Accent — Amber Gold

| Role           | CSS Variable       | Hex                     | Tailwind Class   |
| -------------- | ------------------ | ----------------------- | ---------------- |
| Accent primary | `--accent-primary` | `#F59E0B`               | `accent-primary` |
| Accent hover   | `--accent-hover`   | `#D4A853`               | `accent-hover`   |
| Accent dim     | `--accent-dim`     | `rgba(245,158,11,0.12)` | `accent-dim`     |
| Accent text    | `--accent-text`    | `#FCD34D`               | `accent-text`    |
| Accent border  | `--accent-border`  | `rgba(245,158,11,0.25)` | `accent-border`  |

### Status Colors

| Role        | CSS Variable          | Hex                      | Tailwind Class      |
| ----------- | --------------------- | ------------------------ | ------------------- |
| Success     | `--state-success`     | `#34D399`                | `state-success`     |
| Success dim | `--state-success-dim` | `rgba(52,211,153,0.12)`  | `state-success-dim` |
| Error       | `--state-error`       | `#F87171`                | `state-error`       |
| Error dim   | `--state-error-dim`   | `rgba(248,113,113,0.12)` | `state-error-dim`   |
| Warning     | `--state-warning`     | `#F59E0B`                | `state-warning`     |
| Warning dim | `--state-warning-dim` | `rgba(245,158,11,0.12)`  | `state-warning-dim` |
| Info        | `--state-info`        | `#60A5FA`                | `state-info`        |
| Info dim    | `--state-info-dim`    | `rgba(96,165,250,0.12)`  | `state-info-dim`    |
| Neutral     | `--state-neutral`     | `#6B7280`                | `state-neutral`     |
| Neutral dim | `--state-neutral-dim` | `rgba(107,114,128,0.12)` | `state-neutral-dim` |

### Job Status Mapping

| Job Status          | Color Token     | Dim Token           |
| ------------------- | --------------- | ------------------- |
| Applied ✅          | `state-success` | `state-success-dim` |
| Failed ❌           | `state-error`   | `state-error-dim`   |
| Applying ⏳         | `state-warning` | `state-warning-dim` |
| Matched             | `state-info`    | `state-info-dim`    |
| Skipped / Dismissed | `state-neutral` | `state-neutral-dim` |
| Found               | `state-neutral` | `state-neutral-dim` |

---

## Typography

| Role        | Font       | CSS Variable  | Tailwind Class |
| ----------- | ---------- | ------------- | -------------- |
| UI text     | Geist Sans | `--font-sans` | `font-sans`    |
| Code / mono | Geist Mono | `--font-mono` | `font-mono`    |

Both loaded via `next/font/google`. Applied as CSS variables on `<html>`. Body uses Geist Sans with `antialiased`.

### Font Size Scale

Use standard Tailwind font size classes. No custom sizes.

| Usage           | Class                    |
| --------------- | ------------------------ |
| Page heading    | `text-3xl font-semibold` |
| Section heading | `text-xl font-semibold`  |
| Card heading    | `text-base font-medium`  |
| Body            | `text-sm`                |
| Caption / label | `text-xs`                |
| Stat number     | `text-2xl font-bold`     |

---

## Border Radius

Radius increases with surface depth. Smaller for inner elements, larger for outer containers.

| Context                | Class          |
| ---------------------- | -------------- |
| Badges / tags / inputs | `rounded-lg`   |
| Buttons                | `rounded-xl`   |
| Cards / panels         | `rounded-2xl`  |
| Modal / overlay        | `rounded-3xl`  |
| Full circle            | `rounded-full` |

---

## Spacing Scale

Use standard Tailwind spacing. These are the most common values used in this project.

| Context            | Value              |
| ------------------ | ------------------ |
| Card padding       | `p-5` or `p-6`     |
| Section gap        | `gap-6` or `gap-8` |
| Navbar height      | `h-16`             |
| Stats bar padding  | `px-6 py-4`        |
| Table cell padding | `px-4 py-3`        |
| Badge padding      | `px-2.5 py-1`      |
| Input height       | `h-10`             |
| Button height      | `h-9`              |
| Icon button size   | `h-8 w-8`          |

---

## Shadows

| Role            | CSS Variable        | Value                            |
| --------------- | ------------------- | -------------------------------- |
| Card shadow     | `--shadow-card`     | `0 1px 3px rgba(0,0,0,0.4)`      |
| Elevated shadow | `--shadow-elevated` | `0 4px 12px rgba(0,0,0,0.5)`     |
| Accent glow     | `--shadow-accent`   | `0 0 20px rgba(245,158,11,0.15)` |

Accent glow is used sparingly — only on primary CTA buttons and active agent state indicators.

---

## globals.css Token Definitions

```css
@theme inline {
  /* Backgrounds */
  --color-base: var(--bg-base);
  --color-surface: var(--bg-surface);
  --color-elevated: var(--bg-elevated);
  --color-subtle: var(--bg-subtle);
  --color-overlay: var(--bg-overlay);

  /* Borders */
  --color-border-default: var(--border-default);
  --color-border-subtle: var(--border-subtle);
  --color-border-strong: var(--border-strong);

  /* Text */
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-text-faint: var(--text-faint);

  /* Accent */
  --color-accent-primary: var(--accent-primary);
  --color-accent-hover: var(--accent-hover);
  --color-accent-dim: var(--accent-dim);
  --color-accent-text: var(--accent-text);
  --color-accent-border: var(--accent-border);

  /* Status */
  --color-success: var(--state-success);
  --color-success-dim: var(--state-success-dim);
  --color-error: var(--state-error);
  --color-error-dim: var(--state-error-dim);
  --color-warning: var(--state-warning);
  --color-warning-dim: var(--state-warning-dim);
  --color-info: var(--state-info);
  --color-info-dim: var(--state-info-dim);
  --color-neutral: var(--state-neutral);
  --color-neutral-dim: var(--state-neutral-dim);
}

:root {
  /* Backgrounds */
  --bg-base: #0c0a08;
  --bg-surface: #131108;
  --bg-elevated: #1a1710;
  --bg-subtle: #222016;
  --bg-overlay: rgba(12, 10, 8, 0.85);

  /* Borders */
  --border-default: #2c2a1e;
  --border-subtle: #3a3828;
  --border-strong: #4a4830;

  /* Text */
  --text-primary: #f5f0e8;
  --text-secondary: #c4b898;
  --text-muted: #857a60;
  --text-faint: #504a38;

  /* Accent */
  --accent-primary: #f59e0b;
  --accent-hover: #d4a853;
  --accent-dim: rgba(245, 158, 11, 0.12);
  --accent-text: #fcd34d;
  --accent-border: rgba(245, 158, 11, 0.25);

  /* Status */
  --state-success: #34d399;
  --state-success-dim: rgba(52, 211, 153, 0.12);
  --state-error: #f87171;
  --state-error-dim: rgba(248, 113, 113, 0.12);
  --state-warning: #f59e0b;
  --state-warning-dim: rgba(245, 158, 11, 0.12);
  --state-info: #60a5fa;
  --state-info-dim: rgba(96, 165, 250, 0.12);
  --state-neutral: #6b7280;
  --state-neutral-dim: rgba(107, 114, 128, 0.12);

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-accent: 0 0 20px rgba(245, 158, 11, 0.15);
}
```
