# **15. Public Visitor Analytics Dashboard (`/analytics`)**

## **Purpose**

The **Public Visitor Analytics Dashboard** (`/analytics`) provides a transparent, privacy-first, GDPR-compliant overview of website visitor traffic, audience persona engagement, geographic distribution, and session telemetry.

---

## **Key Capabilities & Architecture**

1. **Privacy-First Daily Hashed Telemetry**:
   - Zero cookies or intrusive trackers. Visitor telemetry is logged via Next.js proxy middleware ([`src/proxy.ts`](../../src/proxy.ts)) into the `page_visits` table using daily rotating salt SHA-256 IP hashes.
   - City and region headers are discarded to avoid ISP routing inaccuracy, retaining only country-level Geo-IP metadata (`x-vercel-ip-country`).

2. **Real-Time Traffic Aggregations via `/api/analytics-summary`**:
   - Total pageviews, unique daily visitors, and average session dwell time.
   - Interactive 30-day time-series traffic charts rendered using lightweight SVG paths.
   - Top visited routes: `/`, `/scoping`, `/rag`, `/terminal`, `/dashboard`, `/blog`.

3. **Audience Persona Distribution & Device Breakdown**:
   - Tracks audience persona toggles (Developer vs Business identity).
   - Device categories (Desktop, Mobile, Tablet) and browser distributions.
   - Global country distribution map with flag pills and session volume counters.

4. **Design System 2.0 Dual-Theme Parity**:
   - Full contrast and readability across Azure cold-press paper and Noir dark obsidian glass.
