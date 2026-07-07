# **2. Existing Product Analysis & Discovery**

## **Purpose**

Adaptive Portfolio is an evolution of an existing product, not a greenfield project.

The current portfolio already contains a significant amount of engineering work, design decisions, infrastructure, tooling, and supporting systems.

Before proposing changes or writing implementation code, the existing product must be fully understood.

The purpose of this phase is to replace assumptions with knowledge.

No implementation work should begin until the Discovery Phase has been completed.

---

# **Discovery Philosophy**

Do not begin by asking:

“How do I implement Adaptive Portfolio?”

Instead ask:

“How does the current product work?”

Only after understanding the existing system should implementation decisions be made.

The objective is to improve the project while preserving everything that already works well.

---

# **Respect The Existing Product**

This project has evolved through many iterations.

Many architectural decisions were made intentionally.

Do not assume that something should be rewritten simply because it appears unfamiliar.

Before replacing an existing system:

- understand why it exists
- determine what problem it solves
- identify its strengths
- identify its limitations
- evaluate whether replacing it creates more value than improving it

Prefer evolution over replacement.

---

# **Repository Exploration**

Perform a complete exploration of the repository.

Build a mental model of:

- overall project structure
- application architecture
- routing
- component hierarchy
- data flow
- state management
- styling architecture
- animation architecture
- API routes
- server components
- client components
- utility libraries
- build pipeline
- deployment workflow

Produce a concise architectural overview before proposing changes.

---

# **Existing Experience Analysis**

Experience the website as an end user.

Navigate every major section.

Evaluate:

- storytelling
- navigation
- interaction quality
- visual hierarchy
- pacing
- responsiveness
- accessibility
- performance

Identify the strongest aspects of the current experience.

Those strengths should be preserved.

---

# **Theme System Analysis**

Study the existing theme architecture.

Current visual identities include:

- Azure
- Noir

Determine:

- how themes are implemented
- how state is managed
- how styles propagate
- how assets differ
- how transitions work

The Adaptive Portfolio must integrate into this system without compromising its elegance.

---

# **Content Platform Analysis**

Understand how content currently flows through the application.

Identify:

- editable content
- static content
- generated content
- cached content
- fallback mechanisms

Determine how future adaptive content should integrate into this architecture.

---

# **Content Management System Analysis**

The project already includes an internal content management system.

Fully inspect its capabilities.

Understand:

- editing workflow
- synchronization process
- supported content types
- media handling
- AI-assisted features
- offline capabilities
- deployment workflow

Do not introduce a competing management system.

Instead, expand the existing platform where appropriate.

---

# **Data Platform Analysis**

Inspect the complete data platform.

Understand:

- current schema
- relationships
- caching strategy
- synchronization
- backup strategy
- migration approach
- scalability

Do not assume the existing schema is final.

Evaluate whether Adaptive Portfolio introduces opportunities for improvement.

---

# **Resume Generation Analysis**

Inspect the existing resume generation system.

Determine:

- architecture
- rendering pipeline
- template structure
- content sources
- extensibility

Future quotation generation should integrate naturally into this system whenever possible.

---

# **Analytics & Telemetry Analysis**

Inspect the telemetry platform.

Understand:

- event collection
- aggregation
- reporting
- privacy model
- performance impact

Determine how Adaptive Portfolio interactions can be measured without compromising user privacy.

Potential future metrics include:

- audience preference
- theme preference
- quotation downloads
- resume downloads
- interaction completion

Only anonymous analytics should be collected unless explicitly required.

---

# **Performance Analysis**

Measure current performance.

Evaluate:

- Lighthouse
- Core Web Vitals
- hydration
- rendering
- animation cost
- bundle size
- caching
- network requests

Adaptive Portfolio should maintain or improve the current performance baseline.

---

# **Accessibility Analysis**

Evaluate:

- semantic structure
- keyboard navigation
- screen reader support
- motion preferences
- focus management
- color contrast

Accessibility improvements should be incorporated naturally during implementation rather than treated as separate work.

---

# **SEO Analysis**

Understand the current SEO strategy.

Inspect:

- metadata
- structured data
- sitemap
- robots
- canonical URLs
- Open Graph
- indexing strategy

Determine whether Adaptive Portfolio requires any SEO adjustments.

Recommend improvements only when meaningful.

---

# **Code Quality Analysis**

Perform a complete code quality review.

Identify:

- technical debt
- duplicated logic
- dead code
- obsolete components
- stale experiments
- inconsistent naming
- unnecessary abstractions
- unused dependencies
- architectural complexity

Treat this as preparation for Version 2 of the product.

---

# **Refactoring Philosophy**

Refactoring should not be driven by personal preference.

It should be driven by measurable improvements.

Every proposed refactor should improve at least one of:

- readability
- maintainability
- scalability
- performance
- developer experience
- reliability

Avoid unnecessary rewrites.

---

# **Challenge The PRD**

This PRD defines the desired product vision.

It may not always describe the optimal implementation.

If a better solution is discovered during analysis:

- explain the reasoning
- compare trade-offs
- recommend the alternative
- request confirmation before diverging significantly from the documented vision

Thoughtful disagreement is encouraged when supported by evidence.

---

# **Discovery Deliverables**

Before implementation begins, produce:

1. Executive summary of the current product.
2. Current architecture overview.
3. Theme system overview.
4. Content platform overview.
5. CMS overview.
6. Data platform overview.
7. Performance audit.
8. Accessibility audit.
9. SEO audit.
10. Code quality report.
11. Technical debt summary.
12. Refactoring proposal.
13. Risk assessment.
14. Recommended implementation roadmap.

Implementation should begin only after these deliverables have been completed.

---

# **Definition of Completion**

The Discovery Phase is complete when the implementation agent can confidently explain:

- how the product works
- why it works that way
- what should remain unchanged
- what should evolve
- why each proposed change creates measurable value

Only then is the project ready for implementation.

---

# **Acceptance Criteria**

- The repository has been thoroughly explored.
- The existing architecture is fully understood.
- The website has been evaluated from a user perspective.
- The theme system has been documented.
- The content platform has been documented.
- The content management system has been documented.
- The data platform has been documented.
- Performance, accessibility, and SEO audits have been completed.
- Technical debt has been identified.
- Refactoring opportunities have been documented.
- A complete implementation roadmap has been proposed.
- No implementation work has begun before completion of the Discovery Phase.
