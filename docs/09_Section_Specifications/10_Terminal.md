# **Terminal Diagnostics Page**

## **Purpose**

The Terminal Diagnostics page (`/terminal`) is a custom CLI simulator that provides developer-focused details, system status, git logs, and interactive diagnostics commands.

---

## **Product Philosophy**

A site built for developers should speak their language. The terminal demonstrates technical capability through execution, providing detailed deployment statistics and interactive controls in a retro shell layout.

---

## **User Goals**

* **Developer Audience**: Query git commit details, analyze system status, view dynamic QR codes, trigger system self-tests, and browse help files.

---

## **Interactive CLI Command Registry**

The terminal parses input strings dynamically. Available commands include:

* `help`: Displays a list of all available commands and descriptions.
* `git-info`: Opens the generated portfolio commit log. Subcommand `git-info show <commit_hash>` opens a specific commit record.
* `projects`: Lists portfolio projects and tags.
* `system`: Shows CPU, memory, and display metrics.
* `storage`: Inspects local and session storage. Subcommand `storage clear` or `storage wipe` clears all storage.
* `stack`: Lists the website technology stack and automatically copies the Technical System Dossier to the clipboard.
* `sync`: Shows the local content sync workflow.
* `analytics`: Shows visitor statistics summary. Links to the full analytics dashboard at `/admin/analytics`.
* `inspect`: Probes real-time Supabase latency, JS heap memory footprint, active theme, and DOM node count.
* `matrix`: Toggles retro Matrix green digital rain overlay.
* `sfx`: Toggles Web Audio 8-bit sound synthesizer.
* `snake`: Launches the interactive Snake Game with global Supabase leaderboard.
* `pizzarat`: Toggles the 3D WebGL NYC Pizza Rat physics model.
* `qrcode`: Generates a dynamic Razorpay UPI QR code for custom payment amounts (e.g., `qrcode 500` via `/api/terminal/qrcode`) with base64 PNG fallback and native `upi://pay` URI scheme launch support.
* `scope`: Headless Project Scoping & CPQ CLI Engine (`src/lib/terminalScoping.ts`):
  * `scope new [engine]`: Initialize a new architecture quote (`landing`, `multipage`, `saas`).
  * `scope add <module_id>`: Add module with automatic GraphRAG prerequisite resolution.
  * `scope remove <module_id>`: Remove module with dependent cascade checks.
  * `scope promo <code>`: Apply and validate coupon or partner attribution codes.
  * `scope analyze "<query>"`: Multimodal NLP intent parsing proxying to Retriever's `prateeq_scoping` tenant (`/api/scoping/parse-intent`).
  * `scope export [azure|noir]`: Download client-side generated Scoping Brief PDF.
* `cart`: Architecture Cart & Escrow Checkout Command:
  * `cart status`: Render ASCII tabular summary of selected engine, modules, volume bundle discount meter, and total price.
  * `cart checkout [--deposit 50|40]`: Generate dynamic UPI / Razorpay payment QR code directly in the terminal console for instant mobile checkout.
* `clear`: Clears the terminal screen memory history.

---

## **Layout & Styling Constraints**

* **Design**: Retro monochrome layout, fixed width monospaced typography, static layout heights, and simulated console blink cursors.
* **Themes**: Uses theme-specific neon borders in Azure, and high-contrast lines in Noir.
* **Inputs**: Restricts manual keyboard focuses using automatic focus triggers when the page body is selected.

---

## **Performance & Data Loading**

* **Command Parser**: Written client-side to ensure immediate input response.
* **Metadata Source**: Git commit summaries are written to `git-log.json` before builds, preventing runtime Git CLI execution calls in production.
* **Fail Safe**: If database states are offline, system commands display warnings without crashing.

---

## **Acceptance Criteria**
- Command input field parses the registry commands correctly.
- CLI commands execute and display responses immediately.
- `git-info` reads and displays current commit records.
- Input focus behavior is reliable on both desktop and mobile keyboards.

---

## **Related Architecture & Cross-References**

- [Footer Diagnostics Link](09_Footer.md)
- [Visitor Analytics](../13_Telemetry_and_Analytics.md)
- [Terminal Scoping CLI (`scope new`)](../25_SOTA_Scoping_Engine_PRD.md)
- [Architecture Node: Terminal Route](../architecture_nodes/Route_terminal.md)
- [Architecture Node: Terminal UI](../architecture_nodes/UI_Terminal.md)