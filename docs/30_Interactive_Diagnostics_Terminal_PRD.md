---
id: PRD_30_Interactive_Diagnostics_Terminal
title: "PRD: Interactive Diagnostics Terminal & CLI Scoping Console (/terminal)"
tier: 5_content_platform
platform: Prateek_website
status: production
auth_level: public_read_write
blast_radius: LOW
file_path: src/app/terminal/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/terminal/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/terminal/"
runbook: docs/runbooks/RUNBOOK_TERMINAL_OPERATIONS.md
tags:
  - prd/terminal
  - tier/5_content_platform
  - cli/scoping
  - web_audio
  - games/retro
  - platform/prateek_website
invariants:
  - "Fullscreen overlays (Matrix rain, modals) rendered inside the terminal MUST use <Portal> to escape containing blocks."
  - "Web Audio API contexts MUST only initialize upon explicit user interaction to comply with browser autoplay policies."
  - "Terminal telemetry MUST query authentic performance APIs (PerformanceObserver, live Supabase counts) with zero simulated fake numbers."
  - "Headless scoping commands (scope, cart, checkout) MUST enforce identical dependency rules as the visual /scoping wizard."
test_suites:
  - src/components/ui/__tests__/SiteInfoConsole.test.tsx
  - src/lib/__tests__/terminalScoping.test.ts
downstream:
  - docs/UNIFIED_MASTER_ROADMAP.md
  - docs/99_DECISIONS.md#adr-05
  - docs/architecture_nodes/Route_terminal.md
---

# 30. Product Requirements Document: Interactive Diagnostics Terminal & CLI Console

#prd #terminal #cli #site_console #headless_scoping #web_audio #retro_gaming #prateeq_website

> **Comprehensive system specification for the `/terminal` Interactive Diagnostics Console, Command Dispatcher, Headless Project Scoping Engine, Web Audio Synthesizer, CRT Scanline Shaders, and Retro Arcade Ecosystem.**

---

## 1. Executive Summary & Philosophy

For senior engineers, engineering directors, and technical founders, a browser-based CLI represents the pinnacle of developer craftsmanship. It provides a tactile, keyboard-driven alternative to graphical navigation while proving mastery of browser internals (Canvas shaders, Web Audio APIs, PerformanceObservers, and terminal state machines).

The **Interactive Diagnostics Terminal** (`/terminal`) serves a dual purpose:
1. **Developer Showcase & Telemetry Cockpit:** An authentic UNIX-style shell exposing system health, live Git commit histories, memory heap metrics, Web Vitals, and architecture dependencies.
2. **Headless Project Scoping & QR Checkout:** Developers can configure custom project scopes directly from the CLI (`scope engine saas`, `scope add auth`, `cart`, `checkout`), receiving ASCII QR codes for instant mobile payment or redirection to the graphical checkout wizard.
3. **Immersive Retro Computing:** Web Audio oscillator sound effects, CRT phosphor bloom, matrix digital rain, interactive A* pathfinding, and a retro Snake arcade game with a global Supabase leaderboard.

---

## 2. System Architecture & Component Hierarchy

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         /terminal (TerminalPage)                            │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         SiteInfoConsole.tsx                                 │
 │  • CRT Scanlines & Phosphor Bloom CSS Shaders                               │
 │  • Keyboard Event Listener (History Up/Down, Autocomplete Tab)              │
 └──────┬───────────────────────────────┬───────────────────────────────┬──────┘
        │                               │                               │
        ▼                               ▼                               ▼
 ┌──────────────┐              ┌─────────────────┐             ┌────────────────┐
 │ Telemetry    │              │ Command Engine  │             │ Audio / Visual │
 │ Grid         │              │ useTerminal-    │             │ Overlays       │
 │ • Web Vitals │              │ Commands.ts     │             │ • Audio Synth  │
 │ • Memory     │              │ • Dispatcher    │             │ • Matrix Rain  │
 │ • Supabase   │              │ • Headless Cart │             │ • Snake Arcade │
 └──────────────┘              └────────┬────────┘             └────────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
                 ┌───────────────┐             ┌───────────────┐
                 │ Backend APIs  │             │ Headless      │
                 │ • /api/query  │             │ Scoping       │
                 │ • /api/qrcode │             │ • pricing.ts  │
                 │ • /leaderboard│             │ • dependencies│
                 └───────────────┘             └───────────────┘
```

---

## 3. Command Dispatcher & Feature Set

The terminal command processor (`useTerminalCommands.ts`) handles 19 primary commands and sub-commands:

| Command | Arguments | Description & Output |
| :--- | :--- | :--- |
| `help` | None | Lists all available system commands, syntax guides, and shortcut keys. |
| `scope` | `engine <type>`, `add <mod>`, `rm <mod>`, `clear` | Headless project scoping engine: selects architecture, adds modules, resolves dependencies. |
| `cart` | None | Displays active headless scoping cart, itemized breakdown, and estimated totals (INR/USD). |
| `checkout` | None | Finalizes scope, generates an ASCII QR code, and outputs a 1-click payment link. |
| `inspect` | `<project-slug>` | Fetches live architectural blueprints, tech stacks, and Git commit logs for a portfolio project. |
| `stack` | None | Displays the production technology stack (Next.js 16, React 19, Supabase, FastAPI, pgvector). |
| `git-info` | None | Queries `/api/git-log` to return the last 10 verified Git commits across all repositories. |
| `qrcode` | `<url-or-text>` | Calls `/api/terminal/qrcode` to render terminal-native ASCII and SVG QR codes. |
| `analytics` | None | Fetches live visitor telemetry, pageview trends, and country distributions from `/api/analytics-summary`. |
| `snake` | None | Launches retro Canvas Snake arcade game with WASD controls and global leaderboard integration. |
| `pathfinder` | None | Launches interactive A* pathfinding algorithm visualization on an ASCII obstacle grid. |
| `matrix` | None | Toggles full-viewport falling green glyph rain (rendered via `<Portal>`). |
| `sfx` | `on` \| `off` | Enables or mutes the Web Audio oscillator sound effects synthesizer. |
| `pizzarat` | None | Easter-egg retro narrative game following a subway rat navigating NYC engineering infrastructure. |
| `clear` | None | Purges output history buffer and restores fresh terminal prompt. |

---

## 4. Headless Scoping Engine (`terminalScoping.ts`)

The terminal implements a full-featured, headless equivalent of the graphical `/scoping` wizard:
1. **Engine Selection:** `scope engine saas` sets the foundational architecture tier.
2. **Dependency Resolution:** Calling `scope add rag` automatically evaluates `dependsOn` arrays in `intakeQuestionnaireDefaults.json`. If prerequisites are missing (e.g. `vector_db`), the terminal automatically auto-resolves or warns the operator.
3. **Cart Serialization:** Scopes configured in the terminal generate a base64 state token that can be loaded seamlessly into `/scoping` or `/dashboard` via deep-link:
   ```text
   https://prateeq.in/scoping?config=eydlbmdpbmUnO...
   ```
4. **Direct Checkout & QR Generation:** Executing `checkout` contacts `/api/terminal/qrcode` to render an inline ASCII QR code that opens Razorpay checkout on the operator's smartphone.

---

## 5. Web Audio Sound Synthesizer (`terminalAudio.ts`)

The audio engine utilizes the native Web Audio API (`AudioContext`) with zero external asset downloads:
- **Mechanical Keypress Click:** 5ms burst of bandpass-filtered white noise mimicking tactile mechanical keyboard switches (Cherry MX Blue).
- **Command Success Beep:** Dual-tone frequency glide (800Hz ➔ 1200Hz sine wave over 40ms).
- **Command Error Glitch:** Low square-wave buzz (150Hz ➔ 80Hz over 80ms with subtle distortion).
- **Arcade Eating Chime:** High arpeggio sine ping for Snake food collection.
- **Autoplay Compliance:** AudioContext is initialized strictly after the first user keydown event (`state === 'suspended' ? audioCtx.resume() : null`).

---

## 6. Non-Negotiable Invariants & Safety Constraints

| Invariant ID | Rule Description | Enforcement Mechanism |
| :--- | :--- | :--- |
| **INV-TERM-01** | **Containing Block Escape** | `MatrixRainOverlay` and modal games MUST be wrapped in `<Portal>` (`src/components/ui/Portal.tsx`) to prevent CSS `will-change: transform` traps. |
| **INV-TERM-02** | **Audio Autoplay Safety** | `terminalAudio.ts` must never instantiate audio playback before an explicit user keydown or click. |
| **INV-TERM-03** | **Zero-Mock Telemetry** | Metrics rendered in `ConsoleTelemetryGrid` must pull directly from `window.performance.memory`, `PerformanceObserver`, or live `/api/*` endpoints. |
| **INV-TERM-04** | **Input Sanitization** | User inputs in the terminal shell are treated as untrusted strings; ANSI rendering escapes raw HTML to prevent XSS. |

---

## 7. Verification & Automated Test Plan

1. **Component Tests (`src/components/ui/__tests__/SiteInfoConsole.test.tsx`):**
   - Assert terminal prompt renders with active user blinking caret.
   - Assert `help`, `stack`, `clear` commands output expected strings.
   - Assert arrow-up and arrow-down keys navigate command history buffer.
2. **Scoping CLI Logic Tests (`src/lib/__tests__/terminalScoping.test.ts`):**
   - Assert `scope engine` switches base package.
   - Assert `scope add` enforces transitive feature dependencies.
   - Assert `cart` calculates totals identical to `calcQuote()` in `src/lib/pricing.ts`.
