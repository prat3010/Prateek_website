# 40. Enterprise Identity Federation & Role-Based Vector Access Control (RB-VAC) PRD

> **Product Requirement Document (PRD 40)**  
> **Milestone:** Milestone 119 (`v1.9.0-alpha1`)  
> **Platform Battery:** #34 (`enterprise_identity_federation`)  
> **Category:** `SAFETY_DEFENSE`  
> **Target Repositories:** `retriever` & `Prateek_website`  
> **Status:** Production  

---

## 1. Executive Summary & Objective

In enterprise enterprise deployments (Fortune 500, banking, healthcare, legal), organizations manage thousands of employees across diverse departments (Engineering, Sales, Finance, Legal, Executive Board). When deploying internal AI and RAG knowledge assistants, enterprise IT departments enforce two non-negotiable security requirements:

1. **Centralized Identity & Directory Lifecycle (SAML 2.0 & SCIM 2.0)**:
   - Employees must log in through corporate Identity Providers (Okta, Azure AD / Microsoft Entra ID, Google Workspace, PingIdentity) without separate credentials.
   - User onboarding, departmental role assignments, and instant employee termination/deprovisioning must be synchronized automatically in real time without manual admin intervention.
2. **Strict Departmental Access Isolation (Role-Based Vector Access Control / RB-VAC)**:
   - High-clearance documents (executive compensation, pending M&A agreements, board minutes, patent drafts) must **never** be retrieved or summarized for unauthorized employees.
   - Access control must be enforced *mathematically before generation* during vector candidate retrieval, eliminating cross-department data leakage.

**Milestone 119** ships **Platform Battery #34: `enterprise_identity_federation`**, integrating standard SAML 2.0 assertions, RFC 7643/7644 SCIM 2.0 directory management, and sub-millisecond RB-VAC pre-retrieval filtering.

---

## 2. Technical Architecture & Security Flow

```mermaid
graph TD
    subgraph EnterpriseIdP["1. Enterprise Identity Provider (Okta / Azure AD / Entra ID)"]
        IdP[Corporate IdP] -->|SAML 2.0 XML Assertion| ACS[/v1/identity/saml/acs]
        IdP -->|SCIM 2.0 RFC 7644 Push| SCIM[/v1/scim/v2/tenants/{tenantId}/Users]
    end

    subgraph Authentication["2. Identity Resolution & Badge Minting"]
        ACS --> UserContext[Authenticated Principal: NameID + Security Groups]
        SCIM --> DirectoryStore[Synchronized Directory: Users, Groups, Active Status]
        DirectoryStore --> UserContext
    end

    subgraph RetrievalEngine["3. Pre-Retrieval RB-VAC Filtering Engine"]
        Query[Employee Query] --> VectorSearch[Hybrid Dense HNSW + BM25 Search]
        VectorSearch --> RawCandidates[Top-K Candidate Chunks]
        RawCandidates --> RbVacGate{RB-VAC Access Gate}
        UserContext -->|User Security Badges| RbVacGate
        RbVacGate -->|Clearance Verified| AllowedChunks[Permitted Context Chunks]
        RbVacGate -->|Clearance Denied| PrunedAudit[Audit Log: RBVAC_PRUNED Telemetry]
        AllowedChunks --> LLM[Frontier LLM Synthesis]
        LLM --> Response[Safe Grounded Response]
    end
```

---

## 3. Core Capabilities & Mathematical Foundations

### 1. SAML 2.0 Single Sign-On (SSO)
- **Service Provider (SP) Metadata**: Generates valid XML metadata with AssertionConsumerService endpoint, NameIDFormat (`urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`), and entity binding.
- **Assertion Validation**: Cryptographic X.509 verification, timestamp validity window checking (`NotBefore` $\le t_{\text{now}} <$ `NotOnOrAfter`), audience restriction enforcement, and dynamic attribute mapping for corporate security groups.

### 2. SCIM 2.0 Directory Synchronization (RFC 7643 / RFC 7644)
- **Standards Compliance**: Compliant with RFC 7643 resource representations and RFC 7644 REST protocol.
- **Automated Lifecycle**:
  - `GET /v1/scim/v2/ServiceProviderConfig`: Advertises supported SCIM features (PATCH, filters, Bearer auth).
  - `GET /v1/scim/v2/Schemas`: Exposes User & Group schemas.
  - `GET/POST /v1/scim/v2/tenants/{id}/Users`: Provision and query users with pagination (`startIndex`, `count`) and filters (`userName eq "..."`).
  - `PATCH /v1/scim/v2/tenants/{id}/Users/{id}`: Real-time suspension and deactivation (`active = false`).
  - `GET/POST/PATCH/DELETE /v1/scim/v2/tenants/{id}/Groups`: Ingest and sync corporate security groups (`All Staff`, `Engineering`, `Finance`, `Executive Board`).

### 3. Role-Based Vector Access Control (RB-VAC) Pre-Filtering
- **Document & Chunk ACLs**: Every indexed document chunk possesses an `acl_groups` metadata array (e.g. `["engineering", "devops"]` or `["*"]` for public).
- **Pre-Retrieval Set Intersection**:
  $$\text{Allowed}(c_i, u) \iff \left( * \in c_i.\text{acl\_groups} \right) \lor \left( c_i.\text{acl\_groups} \cap u.\text{security\_groups} \ne \emptyset \right)$$
- **Zero Compute Waste**: If an employee lacks clearance, unauthorized chunks are pruned in $<0.5\text{ms}$ *before* LLM prompt assembly.
- **Compliance Audit Logging**: Pruned chunks emit structured `RbVacPrunedTelemetry` capturing chunk ID, required groups, user groups, similarity score, and timestamp for SOC 2 / HIPAA compliance reporting.

---

## 4. SaaS Studio Cockpit (`IdentityFederationPanel.tsx`)

Built under **Design System 2.0** with strict **Azure** (paper/graphite) and **Noir** (obsidian/cyan) theme parity:
1. **SAML 2.0 View**:
   - Live Entity ID, SSO URL, and X.509 certificate editor.
   - 1-click SP Metadata XML download.
   - Live SAML Assertion ACS tester with attribute inspector.
2. **SCIM 2.0 View**:
   - Base SCIM URL and Bearer token rotation with 1-click copy.
   - Live synchronized directory users table with active/suspended status indicators and 1-click test suspension.
   - Synchronized corporate groups list with member chips.
3. **RB-VAC Simulator View**:
   - Interactive persona cards (`Sales Intern`, `Staff DevOps Engineer`, `CFO`, `Executive Board`).
   - Query input with instant pre-filtering execution.
   - Telemetry pills showing Total Evaluated, Allowed Chunks, Pruned Chunks, and sub-millisecond execution latency.
   - Side-by-side Allowed vs. Pruned chunk breakdown with mathematical ACL explanations.

---

## 5. Verification & Acceptance Criteria

- [x] SAML 2.0 SP metadata generation returns valid XML (`application/samlmetadata+xml`).
- [x] SAML ACS validates expired assertions and raises `ValueError`.
- [x] SCIM 2.0 endpoints pass RFC 7644 User and Group lifecycle tests (Create, Get, List, Patch, Delete).
- [x] RB-VAC pre-filtering verifies public chunks (`*`) are accessible to all, while department-restricted chunks are strictly pruned for non-members.
- [x] Platform Battery #34 (`enterprise_identity_federation`) cataloged in `BatteryService` under `SAFETY_DEFENSE`.
- [x] Web Studio compiles 52/52 routes cleanly with zero TypeScript or lint errors.
- [x] All 10 automated quality gates report 100% green.
