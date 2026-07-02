# **13. Telemetry and Analytics**

## **Purpose**

Telemetry and Analytics measure user engagement while preserving visitor privacy. The platform tracks page visits, audience preference distribution, and document downloads. It does not store personally identifiable information (PII) and complies fully with GDPR guidelines.

---

# **Telemetry Architecture**

The analytics tracking pipeline runs server-side during the request lifecycle to avoid client-side javascript tracking libraries (e.g. Google Analytics), which degrade performance and block privacy tools:

```text
  [HTTP Request]
        │
        ▼
  ┌───────────────────────────┐
  │   src/proxy.ts Middleware  │
  └─────────────┬─────────────┘
                ▼
  ┌───────────────────────────┐
  │   Spam & Crawler Filter   │  ── Discards bot user-agents / honeypot paths
  └─────────────┬─────────────┘
                ▼
  ┌───────────────────────────┐
  │  GDPR Anonymization Engine│  ── Hashes (IP + UserAgent + Daily Salt)
  └─────────────┬─────────────┘
                ▼
  ┌───────────────────────────┐
  │   Geolocator (Country)    │  ── Extracts x-vercel-ip-country only
  └─────────────┬─────────────┘
                ▼
  ┌───────────────────────────┐
  │  Log Insert to Supabase   │
  └───────────────────────────┘
```

---

# **Proxy Middleware Interception (`src/proxy.ts`)**

All incoming page requests pass through the Next.js proxy middleware:
* **Headers**: It reads HTTP headers for User-Agent, Referrer, and IP.
* **Country Geolocation**: It reads Vercel's country header `x-vercel-ip-country`. To prevent inaccurate geolocating caused by ISP routing, region and city headers (`x-vercel-ip-country-region`, `x-vercel-ip-city`) are intentionally ignored and logged as `null`.

---

# **Anonymization Engine (Daily IP Hashing)**

To ensure GDPR compliance, raw IP addresses are never written to the database:
1. **Hashing Formula**: `SHA256(IP Address + User Agent + Daily Salt)`.
2. **Daily Salt Rotation**: The salt is generated programmatically and changes every 24 hours.
3. **Outcome**: The database logs an anonymous identifier (`ip_hash`) that allows counting unique daily visitors, but makes it impossible to reconstruct the visitor's real IP address.

---

# **Spam and Bot Filtration**

Before making any database insert write, the proxy filters out noise:
* **User Agents**: Discards search engine web crawlers, indexers, and automated API agents.
* **Path Exclusions**: Requests targeting common vulnerability scans or honeypot paths (e.g., `/wp-admin`, `.php` files, `.env`, `sitemap-xml`) are aborted immediately, preventing log bloating.

---

# **Aggregations and High-Performance RPC**

To avoid heavy calculations during dashboard loads, analytics are aggregated directly in the database:
* **SQL Stored Procedure**: `get_analytics_summary(cutoff_time)` returns key stats (total views, bots, unique visitors, devices, top pages, referrers) in a single optimized JSON payload.
* **Database Indexes**: Composite index `idx_page_visits_dashboard` optimized for filtering conditions (`created_at DESC` where `is_bot = FALSE`).
* **Degraded Fallback**: If the custom RPC is missing during migration phases, Next.js falls back to fetching the last 2,000 raw visit records and aggregates them client-side.

---

# **90-Day Retention & Probabilistic Pruning**

Database storage overhead is managed through an automated trigger:
* **Function**: `purge_old_page_visits()`.
* **Execution**: Triggered on every page visit insert. To avoid CPU and write lock overhead, the delete query executes probabilistically on approximately 1% of insert requests.
* **Log Lifetime**: Clears records older than 90 days.

---

# **Acceptance Criteria**
- Request geolocation relies exclusively on `x-vercel-ip-country`.
- Bot traffic and honeypot requests are ignored before DB insert occurs.
- Raw IP addresses are hashed using a rotating daily salt.
- Database records older than 90 days are pruned automatically.
- Dashboard queries run through the optimized `get_analytics_summary` RPC.
