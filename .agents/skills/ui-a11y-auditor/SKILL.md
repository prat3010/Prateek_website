---
name: ui-a11y-auditor
description: Audits UI components, CSS modules, Framer Motion containing block safety (<Portal>), and WCAG accessibility standards.
---

# UI & Accessibility Auditor Skill

This skill guarantees that all frontend components conform to the responsive design system, theme tokens, and accessibility standards.

## Core Audit Rules

1. **Containing Block & Modal Safety**:
   - Any modal, drawer, popover, or fullscreen overlay rendered inside a `ScrollSection` MUST use `<Portal>` (`src/components/ui/Portal.tsx`) to escape `will-change: transform` containing blocks.

2. **Design Tokens & Theme Consistency**:
   - Styling must use co-located CSS modules with CSS variables from `globals.css` (`--color-bg`, `--color-text`, `--surface-primary`, `--font-headline`, etc.).
   - Visual Theme (`azure` / `noir`) and Communication Identity (`dev` / `business`) must render seamlessly without layout shifts.

3. **Accessibility (WCAG 2.1 AA)**:
   - Interactive elements (`button`, `a`, `input`) must have legible contrast ratios, focus outlines, and appropriate `aria-label` tags if icon-only.
   - Images and icons must provide informative `alt` text or `aria-hidden="true"`.

## Audit Command
When invoked, run:
```bash
node scripts/audit_ui_visuals.mjs
```
