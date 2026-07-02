# **Terminal Diagnostics Page**

## **Purpose**

The Terminal Diagnostics page (`/terminal`) is a custom CLI simulator that provides developer-focused details, system status, git logs, and interactive diagnostics commands.

---

## **Product Philosophy**

A site built for developers should speak their language. The terminal demonstrates technical capability through execution, providing detailed deployment statistics and interactive controls in a retro shell layout.

---

## **User Goals**

* **Developer Audience**: Query git commit details, analyze network status, view dynamic ASCII art qr codes, trigger system self-tests, and browse help files.

---

## **Interactive CLI Command Registry**

The terminal parses input strings dynamically. Enforced commands include:

* `help`: Displays a list of all available commands and descriptions.
* `git-info` / `git-log`: Parses `src/data/git-log.json` to display recent commit hash, author, commit date, and message.
* `system-status` / `status`: Queries DB connections and displays memory/build statistics.
* `qrcode`: Renders a custom, readable ASCII representation of a dynamic QR code pointing to `https://prateeq.in`.
* `clear`: Clears the terminal screen memory history.
* `theme`: Switches visual themes directly via the command line (e.g. `theme light` or `theme noir`).
* `audience`: Switches communication identities directly (e.g. `audience developer` or `audience business`).

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
- `git-log` reads and displays current commit records.
- Input focus behavior is reliable on both desktop and mobile keyboards.
