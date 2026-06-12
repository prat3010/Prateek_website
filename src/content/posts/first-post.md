---
title: "Direct Vector PDF Downloads in Next.js"
date: "2026-06-12"
excerpt: "How we bypassed the print dialog entirely to generate high-fidelity, ATS-friendly vector resumes using jsPDF."
tags: ["Next.js", "jsPDF", "Frontend"]
coverImage: "/images/blog/pdf-download.jpg"
---

Writing a developer resume is all about making it parseable. While a simple browser print layout works, triggering a direct file download on click provides a much cleaner user experience.

### Why jsPDF?
We chose **jsPDF** because it is a lightweight client-side PDF builder. By calling `doc.text()` programmatically, we construct a vector document. Unlike canvas-based screenshots, the text remains selectable, searchable, and fully readable by job-board **ATS (Applicant Tracking System)** scanners.
