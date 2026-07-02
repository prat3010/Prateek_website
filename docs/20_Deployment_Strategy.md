# **20. Deployment Strategy**

## **Purpose**

The Deployment Strategy defines the hosting platform, environment configuration, custom domain mapping, and cache revalidation pipelines. It ensures that builds are deployed safely to production and serve visitors with minimal latency.

---

# **Hosting Platform: Vercel**

Adaptive Portfolio is hosted on **Vercel** and integrates with GitHub:
* **CI/CD Pipeline**: Commits pushed to the `main` branch of the GitHub repository trigger an automated Vercel build.
* **Build Command**: Runs `scripts/generate-git-log.js` to output commit data under `src/data/git-log.json`, then executes `next build`.
* **Clean Deploys**: Deployments utilize clean environment bundles, with build caching enabled to accelerate build times.

---

# **Custom Domain & DNS Setup**

* **Custom Domain**: Mapped to the root domain `prateeq.in`.
* **Registrar**: Purchased via GoDaddy.
* **DNS Configuration**:
  * **A Record**: Points `@` to Vercel's IP address (`76.76.21.21`).
  * **CNAME Record**: Points `www` to `cname.vercel-dns.com`.
  * **SSL/TLS Certification**: SSL certificates are auto-renewed and managed via Vercel's automated Let's Encrypt integration.

---

# **Production Environment Variables**

The following secrets are registered in Vercel project settings:

| Name | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL endpoint for the Supabase instance. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Administrative key for telemetry writes and synchronization. |
| `RESEND_API_KEY` | Server-only | Token for Resend transactional email services. |
| `CONTACT_EMAIL_TO` | Server-only | Recipient email address for contact form dispatches. |
| `SYNC_API_KEY` | Server-only | Secret token to authenticate `/api/revalidate` cache purges. |

---

# **CDN Architecture & Cache Revalidation**

Next.js pages and content queries are cached aggressively:
* **Edge Caching**: Static pages are cached at Vercel's global CDN locations.
* **On-Demand Revalidation**: When the developer modifies resume sections, project listings, or skills within the local Streamlit dashboard, a revalidation request is dispatched to `/api/revalidate?secret=SYNC_API_KEY`.
* **Edge Proxy Execution**: The request logging proxy (`src/proxy.ts`) executes at Vercel's Edge network locations. It reads geographical headers (`x-vercel-ip-country`) to log visitor origins before request processing reaches server rendering nodes.

---

# **Acceptance Criteria**
- Pull requests and branch merges build successfully on Vercel.
- Custom domain `prateeq.in` resolves correctly over secure HTTPS.
- Environment variables are securely populated on Vercel.
- Cache invalidation triggers successfully purge edge CDN caches on changes.
