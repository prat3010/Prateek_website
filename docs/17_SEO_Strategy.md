# **17. SEO Strategy**

## **Purpose**

The Search Engine Optimization (SEO) Strategy ensures that Adaptive Portfolio is highly discoverable, crawls efficiently, and displays beautiful previews when shared across social channels. The strategy implements semantic code structure, dynamic metadata adaptation, sitemaps, robots rules, and structured schema data.

---

# **Dynamic Metadata Hierarchy**

Under Next.js App Router, metadata is configured programmatically. Because the website adapts to the visitor, the metadata structure supports audience-specific customization:

```text
                  [Metadata Resolution]
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      [Developer Mode]             [Business Mode]
      Title: "Prateek Sharma       Title: "Prateek Sharma
              | Full-Stack"                | Web Developer"
      Desc: "Technical skills,     Desc: "Premium website
              portfolio, projects"         solutions, rates"
```

* **Standard Default**: The root page serves general metadata describing Prateek Sharma's dual capabilities.
* **Open Graph (OG) Previews**: Previews dynamically configure descriptions and image previews matching the active theme personality.

---

# **Semantic HTML & Indexing Structure**

Search bots must parse page context easily:
1. **Single H1 Rule**: The landing page layout contains exactly one `<h1>` title element that declares the primary brand identity (Prateek Sharma).
2. **Heading Sequence**: Subheadings follow sequential ordering (`<h2>` for sections, `<h3>` for component cards). Headings are never used for style overrides.
3. **HTML5 Landmarks**: Content blocks use semantic landmark elements (`<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) to assist crawler categorization.

---

# **Structured JSON-LD Schema Data**

To enable search engine rich results, the page injects a structured schema JSON-LD block inside the root layout:

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Prateek Sharma",
  "url": "https://prateeq.in",
  "image": "https://prateeq.in/images/profile.jpg",
  "jobTitle": "Software Engineer & Web Developer",
  "sameAs": [
    "https://github.com/prat3010",
    "https://linkedin.com/in/freshlimevodka"
  ],
  "knowsAbout": [
    "Web Development",
    "React",
    "Next.js",
    "TypeScript",
    "Supabase",
    "Cloud Architecture"
  ]
}
```

---

# **Sitemaps & Crawler Guidance**

* **Sitemap Generation**: The App Router dynamically generates `src/app/sitemap.ts` at build-time, listing all public routes:
  * `/` (Home page)
  * `/terminal` (Diagnostics CLI page)
  * `/blog` (Post indexes)
* **Robots Configuration**: `src/app/robots.ts` establishes crawler boundaries. Standard rules:
  ```text
  User-agent: *
  Allow: /
  Disallow: /api/
  Sitemap: https://prateeq.in/sitemap.xml
  ```

---

# **Open Graph & Social Previews**

* **Open Graph (OG) Previews**: Azure and Noir themes serve matching social graphic previews:
  * Azure: Modern, bright preview with creative taglines.
  * Noir: Refined, high-contrast monochrome branding layout.
* **Meta Properties**: Standardized configurations for Open Graph and Twitter tags:
  * `og:type`: `website`
  * `og:site_name`: `Prateek Sharma Portfolio`
  * `twitter:card`: `summary_large_image`

---

# **Interactive Element IDs**

To assist both search crawlers and automated tests (e.g. Playwright or Selenium browser tools), all primary interactive controls must feature unique, descriptive HTML IDs:
* Audience select buttons: `id="btn-audience-dev"`, `id="btn-audience-biz"`
* Contact Form: `id="form-contact"`
* Navigation: `id="nav-hero"`, `id="nav-about"`, etc.

---

# **Acceptance Criteria**
- Metatags are generated using standard App Router patterns.
- Exactly one `<h1>` exists on the main entry page.
- Robots config correctly restricts crawlers from accessing API route directories.
- Dynamically generated sitemap maps all public page links.
- Schema JSON-LD markup validates without syntax warnings on Google Rich Results tools.
- Major actions contain explicit and unique HTML identifiers.
