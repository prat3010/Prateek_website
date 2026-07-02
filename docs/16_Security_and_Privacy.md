# **16. Security and Privacy**

## **Purpose**

The Security and Privacy specification defines policies that safeguard keys, secure database access, prevent web spam, and protect visitor identity. It ensures that the Adaptive Portfolio acts as a secure, trustworthy digital product.

---

# **Database Security & Row-Level Security (RLS)**

The Supabase database holds sensitive metrics and content. RLS is enforced across all tables to prevent public tampering:

* **Tables**: `page_visits`, `projects`, `skills`, `certificates`, `profile`.
* **Public Read**: Allowed via anonymous SELECT policies on static content tables (`projects`, `skills`, `certificates`, `profile`).
* **Public Write**: Strictly **disabled**. No public INSERT, UPDATE, or DELETE policies may exist.
* **Server Writes**: All telemetry logs (`page_visits`) and content updates are run server-side or via local scripts using the `SUPABASE_SERVICE_ROLE_KEY`. This key bypasses RLS policies securely.

---

# **Service Key Protection (Server-Only Bounds)**

The service-role key (`SUPABASE_SERVICE_ROLE_KEY`) has full administrative privileges:
1. **Import Restraints**: The client bundle must never import the service key. The file `src/data/supabase.ts` explicitly starts with `import 'server-only'` and throws a runtime exception if referenced by a client-side component:
   ```typescript
   if (typeof window !== 'undefined') {
     throw new Error('Security Error: This database module can only be executed on the server.');
   }
   ```
2. **Key Audits**: Periodic codebase scans check that no references to process variables housing the service key exist inside component files under `src/components/`.

---

# **Contact Form & Email Security**

The contact form connects to the Resend API to dispatch notification emails:
* **Server-Side Route**: Next.js route handlers process form inputs server-side. The client app has no contact with the `RESEND_API_KEY`.
* **Input Sanitization**: Content received from contact inputs is sanitized and HTML-escaped before inclusion in the email template. This prevents cross-site scripting (XSS) and injection payloads.
* **Anti-Abuse Limits**: The route handler implements basic rate-limiting metrics (based on the anonymized visitor IP hash) to prevent bot spam or API flooding.

---

# **GDPR-Compliant Telemetry Privacy**

The proxy telemetry pipeline is structured around strict privacy boundaries:

### **1. Zero PII Storage**
* No raw IP addresses, precise coordinates, regional data, or personal details are logged.
* Geolocation extracts Vercel's `x-vercel-ip-country` header. Region and city trackers are discarded to prevent ISP-based tracking errors.

### **2. Cryptographic Daily Hashing**
* User IPs are anonymized using a cryptographically secure hash formula that combines IP, User-Agent, and a daily rotating salt:
  $$\text{Hash} = \text{SHA-256}(\text{IP} + \text{UA} + \text{rotatingDailySalt})$$
* Because the salt changes daily, logs cannot be reconstructed to track a user's cross-day activity, meeting GDPR erasure requirements.

### **3. Automatic Log Purging**
* Visited page logs are stored for exactly 90 days.
* Probabilistic pruning logic (`purge_old_page_visits()`) deletes expired rows automatically on inserts, ensuring the database remains free of stale data footprints.

---

# **Acceptance Criteria**
- Supabase Row-Level Security (RLS) is enabled on all tables.
- Public write access remains disabled across the database.
- Server-side files throwing runtime errors are never imported client-side.
- Telemetry logs contain no raw IP addresses or precise coordinates.
- Contact route input validation and HTML escaping prevent script injections.
