# **Contact Section**

## **Purpose**

The Contact section is the primary conversion portal of Adaptive Portfolio. It allows visitors to send secure emails, schedule project discussions, or request follow-up calls.

---

## **Product Philosophy**

Getting in touch should feel effortless. The contact workflow should be reassuring, secure, validate input clearly, and present logical next steps based on the visitor's goal.

---

## **User Goals**

* **All Audiences**: Send messages directly from the website, find primary contact email, or schedule video calls via link redirects.

---

## **Behavior**

* Renders a clean input form: Name, Email, Communication Intent selection, and Message body.
* Submitting the form displays immediate visual feedback: a loading state, followed by a success confirmation or an error notice.

---

## **Adaptive Behavior**

* **Communication Identity (Developer vs. Business)**:
  * The form's pre-populated subject line or "Intent dropdown" changes to fit the active mode.
  * Developer Mode options: "Hiring Opportunity", "Open-Source Collaboration", "General Inquiry".
  * Business Mode options: "New Project", "Performance Audit", "Maintenance Support".
  * The descriptive text accompanying the form highlights either resume details or project consultation availability.
* **Visual Theme (Azure/Noir)**:
  * Azure: Uses rounded, colorful inputs, animated success checkmarks, and float labels.
  * Noir: Uses precise black-and-white borders, flat inputs, and monospace alert labels.

---

## **Integration & Routing Pipeline**

* **Email Dispatch API**: Submissions call a secure Next.js route handler (`/api/contact`) that integrates with the Resend email service.
* **Key Protection**: The `RESEND_API_KEY` is kept server-side; it is never exposed in client bundles.
* **Input Escaping**: All inputs are HTML-escaped and validated to prevent cross-site scripting (XSS) or header injection.
* **Rate Limiting**: Basic client rate limits are enforced programmatically (based on visitor IP hashes) to block spam bots.

---

## **Acceptance Criteria**
- Submitting valid form inputs triggers emails via Resend.
- Form inputs are validated and sanitized server-side.
- Success and error states display clearly on all viewports.
- Rate-limiting rules successfully block rapid form submissions.
