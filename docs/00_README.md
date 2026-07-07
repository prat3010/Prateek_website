# **00. Documentation Directory Guide**

Welcome to the documentation folder for Version 2 (v2) of Prateek Sharma's personal portfolio website: **Adaptive Portfolio**.

This folder contains the complete vision, specifications, system designs, and engineering guidelines for the project. These documents are designed to serve as the single source of truth for the product's behavior and implementation.

---

# **Documentation Map**

Below is a summary of all documentation files, categorized by their domain.

## **Overview & Strategy**
* [00_README.md](00_README.md): You are here. A guide and navigation index for this folder.
* [01_Vision_and_Philosophy.md](01_Vision_and_Philosophy.md): The underlying "why" of the website and non-negotiable product principles.
* [03_Product_Goals_Objectives_and_Success_Metrics.md](03_Product_Goals_Objectives_and_Success_Metrics.md): Measurable qualitative and quantitative goals for success.
* [04_Adaptive_Portfolio_Experience.md](04_Adaptive_Portfolio_Experience.md): Core mechanism of audience adaptation and journeys.
* [05_User_Experience_and_Interaction_Design.md](05_User_Experience_and_Interaction_Design.md): General motion, layout density, and timing principles.
* [06_Adaptive_Identity_System.md](06_Adaptive_Identity_System.md): Composition of Visual Themes and Communication Identities.
* [07_Content_Strategy.md](07_Content_Strategy.md): Copywriting tone of voice and positioning checklist.
* [08_Information_Architecture.md](08_Information_Architecture.md): How information relates and flows progressively.

## **Section Specifications**
* [09_Section_Specifications/](09_Section_Specifications/README.md): Individual section specs for Hero, About, Skills, Projects, Playground, Resume, Pricing, Contact, Footer, Terminal, and Blog.

## **System Architecture Specifications**
* [10_Content_Platform_Architecture.md](10_Content_Platform_Architecture.md): Tech specs of the content database tables, caches, and fallbacks.
* [11_Content_Management_System.md](11_Content_Management_System.md): The local Streamlit-based Content Synchronizer specifications.
* [12_AI_Integration_Strategy.md](12_AI_Integration_Strategy.md): Safe usage guidelines for Google Gemini in the local synchronizer.
* [13_Telemetry_and_Analytics.md](13_Telemetry_and_Analytics.md): GDPR-compliant, privacy-first session telemetry.
* [15_Performance_and_Accessibility.md](15_Performance_and_Accessibility.md): Core Web Vitals targets, Lighthouse metrics, and accessibility standards.
* [16_Security_and_Privacy.md](16_Security_and_Privacy.md): Row-Level Security (RLS), keys protection, and data privacy rules.
* [17_SEO_Strategy.md](17_SEO_Strategy.md): Search engine optimization rules, OG images, and structured metadata.

## **Operational and Implementation Rules**
* [18_Codebase_Modernization_and_Refactoring.md](18_Codebase_Modernization_and_Refactoring.md): Guidelines on updating React/Next versions and refactoring rules.
* [19_Testing_and_Quality_Assurance.md](19_Testing_and_Quality_Assurance.md): Validation check scripts and deployment verification lists.
* [20_Deployment_Strategy.md](20_Deployment_Strategy.md): Host mappings (Vercel), domains routing (`prateeq.in`), and CDN cache invalidations.
* [21_Future_Roadmap.md](21_Future_Roadmap.md): Post-v2 milestones and future feature explorations.
* [23_Glossary.md](23_Glossary.md): Alphabetical definitions of the technical and product terms used.
* [99_DECISIONS.md](99_DECISIONS.md): Architecture Decision Records (ADR) registry.

## **Archive**
Historical documents that have been superseded or merged into other files:
* [archive/00_EXECUTIVE_SUMMARY.md](archive/00_EXECUTIVE_SUMMARY.md): Superseded by 01_Vision_and_Philosophy.md and AGENTS.md.
* [archive/02_Existing_Product_Analysis_and_Discovery.md](archive/02_Existing_Product_Analysis_and_Discovery.md): Discovery phase completed.
* [archive/14_Engineering_Architecture.md](archive/14_Engineering_Architecture.md): Merged into AGENTS.md.
* [archive/22_Implementation_Guidelines_for_AI_Agents.md](archive/22_Implementation_Guidelines_for_AI_Agents.md): Merged into AGENTS.md.
* [archive/checklist.md](archive/checklist.md): Phase model outdated; superseded by current implementation.

---

# **How to Use and Maintain**

1. **Read Before Writing**: Any agent or developer working on the project must read these documents first to understand the boundaries, principles, and expected behaviors.
2. **Synchronous Updates**: When adding a new feature, database table, or capability to the codebase, the developer must update the corresponding specification file.
3. **Markdown Guidelines**: Use relative file schema paths for linking and clean headings to keep documents highly readable.
