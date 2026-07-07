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
* `stack`: Lists the website technologies.
* `sync`: Shows the local content sync workflow.
* `analytics`: Shows visitor statistics summary. Links to the full analytics dashboard at `/admin/analytics`.
* `cheatcode`: Runs retro developer override (activates the Three.js WebGL gremlin parade easter egg).
* `qrcode`: Renders a PhonePe UPI QR code for payment or donation.
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
