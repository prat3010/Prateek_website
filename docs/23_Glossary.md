# **23. Glossary**

## **Purpose**

This glossary defines key technical and product terms used across the Adaptive Portfolio documentation.

---

# **A**
### **Adaptive Identity System**
A design and engineering framework that dynamically composes page content and styling based on the active visitor's Visual Theme and Communication Identity.

### **Azure**
A visual theme representing optimization, curiosity, and energy, featuring vibrant colors, modern layouts, and expressive animations.

---

# **C**
### **Cache Revalidation**
The process of invalidating cached content on the edge CDN or within Next.js memory, forcing the server to fetch the latest data from the database. Triggered via the `/api/revalidate` endpoint.

### **Communication Identity**
A profile setting that alters the language, priorities, case studies, and call-to-actions on the site. Supported modes are:
* **Hiring a Developer** (Developer Mode: technical details, engineering values).
* **Need a Website** (Business Mode: outcome-focused, service terms).

---

# **D**
### **Dual-Write Contract**
The content transaction rule where the Streamlit CMS commits edits to the database (Supabase) first, and writes to the local JSON fallbacks only upon database success.

---

# **G**
### **GDPR Telemetry**
A visitor tracking method that processes metrics in compliance with GDPR privacy guidelines, anonymizing visitor IPs before saving them.

---

# **I**
### **IP Hash**
A secure string created by combining the visitor's IP address, User-Agent, and a daily rotating salt. This allows tracking unique daily visitors without logging PII.

---

# **L**
### **Local JSON Fallback**
Local static data files (`projects.json`, `skills.json`, etc.) that Next.js reads if the Supabase database is unreachable or env keys are missing.

---

# **N**
### **Noir**
A visual theme featuring monochrome styling, clean layouts, and a refined cyber-noir / console aesthetic.

---

# **R**
### **Row-Level Security (RLS)**
A PostgreSQL security feature in Supabase that restricts database access based on user sessions or security policies. Public writes are blocked, while server-side services write using administrative keys.

---

# **S**
### **Streamlit CMS (Synchronizer)**
A local Python dashboard (`scripts/synchronizer.py`) used by the developer to manage certificates, update skills, compile blogs, and sync resume records.

---

# **U**
### **unstable_cache**
Next.js server utility to cache data query results across page renders.

---

# **V**
### **Visual Identity (Theme)**
The styling configurations (colors, transitions, typography) that govern the aesthetic look and feel of the site.

---

# **Acceptance Criteria**
- Definitions accurately reflect implementation details.
- Terminology remains consistent across all documentation files.
