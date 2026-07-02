# **12. AI Integration Strategy**

## **Purpose**

Artificial Intelligence (AI) serves as a productivity accelerator for content management and engineering workflows. However, to maintain high performance, stability, and security, AI capabilities are confined strictly to local development tools. The public website has no runtime dependency on AI models.

---

# **AI Integration Boundary**

The line between developer tooling and runtime application code is absolute:

```text
  ┌───────────────────────────────────┐        ┌───────────────────────────────────┐
  │         LOCAL TOOLING LAYER       │        │        PUBLIC RUNTIME LAYER       │
  │     (Synchronizer Dashboard)      │        │          (Next.js App)            │
  ├───────────────────────────────────┤        ├───────────────────────────────────┤
  │ • Gemini-2.5-Flash Integration    │        │ • Pre-generated Static Content    │
  │ • Certificate Analysis            │        │ • Fast cached API fetches         │
  │ • Skill Approval Queue            │        │ • Zero runtime LLM calls          │
  │ • Local ENV Keys Only             │        │ • Client browser security         │
  └─────────────────┬─────────────────┘        └─────────────────▲─────────────────┘
                    │                                            │
                    └────────── Writes to Supabase & JSON ───────┘
```

* **No Public Runtime Overhead**: The Next.js website does not invoke any LLM or AI model APIs. This prevents key leakage, billing spikes, slow page response times, and unpredictable chat hallucination behaviors on the client side.
* **Local Developer Bounds**: All Gemini queries are made inside Python scripts running on the developer's computer.

---

# **Core AI Capabilities (Local Synchronizer)**

The Streamlit dashboard uses the `GEMINI_API_KEY` from `.env.local` to call the `gemini-2.5-flash` model for three specific tasks:

### **1. Certificate Analysis & Parsing**
When the developer uploads a certificate file:
* The Synchronizer sends the image to Gemini.
* Gemini extracts metadata: Issuer, Date, Credential ID, Course Title, and a recommended list of technical tags.
* Output is returned as a structured JSON object to be reviewed by the developer.

### **2. Automated Skill Scanning**
Gemini runs a background scan comparing the developer's project logs, codebases, and blog entries against the active list in `skills.json`:
* Identifies newly introduced frameworks, databases, or languages.
* Flags missing tags or skill descriptions.
* Populates a **Pending Skill Approvals** queue in the Streamlit sidebar.

### **3. Content Variant Generation**
Assists the developer in translating basic text summaries into tone-specific variants:
* **Azure variant request**: "Rewrite this copy to sound modern, creative, and optimistic."
* **Noir variant request**: "Rewrite this copy to sound refined, composed, and quietly confident."

---

# **Key Security & RLS Compliance**

* **API Key Safety**: The `GEMINI_API_KEY` is loaded from local environments only. It is never registered or deployed on Vercel production server variables, as the public web application has no code paths invoking Gemini.
* **Data Flow Limits**: Raw user inputs from the contact form are never sent to AI APIs. They are kept secure in Supabase or emailed via Resend, respecting visitor data privacy.

---

# **Human-in-the-Loop Validation**

AI recommendations are always treated as drafts:
* **Confirmation Required**: No AI-parsed certificates, extracted skill tags, or generated text variants are ever written directly to database tables.
* **Review UI**: The Streamlit dashboard displays the extracted fields in an editable form. The developer can fix, add, or reject items before clicking "Publish".

---

# **Acceptance Criteria**
- Gemini integrations run exclusively inside local synchronizer scripts.
- The `gemini-2.5-flash` model returns structured metadata from uploaded certificates.
- AI recommendations are presented in an approval UI before database write actions.
- The Next.js frontend has zero dependencies on Google Gemini packages or configurations.
