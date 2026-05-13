<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

Next.js 16 with React 19.2. Read node_modules/next/dist/docs/
before implementing any Next.js feature. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Read Before Anything Else

Read in this exact order before any implementation.
After reading, summarise the current task from progress-tracker.md before writing any code.

1. context/project-overview.md
2. context/architecture.md
3. context/ui-tokens.md
4. context/ui-rules.md
5. context/ui-registry.md
6. context/code-standards.md
7. context/library-docs.md
8. context/build-plan.md
9. context/progress-tracker.md

## Rules That Never Change

- Never use hardcoded hex values or raw Tailwind color classes
- Update progress-tracker.md and ui-registry.md after every feature
- Before implementing any third party library — load its installed skill first, then read context/library-docs.md for project-specific rules

## Available Skills

- /grill-with-docs — before implementing any feature
- /handoff — at the end of every session
- /diagnose — when stuck after one failed correction
- /caveman — compressed mode for token efficiency
