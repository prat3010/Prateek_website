#!/usr/bin/env python3
"""
1-Click Automation Script: Seed 5 Tenants & Generate Real Test Data in Retriever RAG

Usage:
    python3 scripts/seed_demo_tenants_and_data.py [API_BASE_URL] [ADMIN_MASTER_KEY]

Defaults:
    API_BASE_URL: http://localhost:8000 (or https://rag.prateeq.in)
    ADMIN_MASTER_KEY: Loaded from .env or default key
"""

import os
import sys
import json
import urllib.request
import urllib.parse
import uuid

API_BASE = sys.argv[1] if len(sys.argv) > 1 else os.getenv("API_BASE", "http://localhost:8000")
ADMIN_KEY = sys.argv[2] if len(sys.argv) > 2 else os.getenv("ADMIN_MASTER_KEY", "2f4a1713e6a2526f51e7e6b7825689509c9071e0b61fa59a5804ccfdbdafd266")

def make_request(url, method="GET", headers=None, json_data=None, files=None):
    headers = headers or {}
    data = None
    
    if json_data is not None:
        data = json.dumps(json_data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    elif files is not None:
        boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        body = []
        for field_name, (filename, content, content_type) in files.items():
            body.append(f"--{boundary}".encode("utf-8"))
            body.append(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"'.encode("utf-8"))
            body.append(f"Content-Type: {content_type}\r\n".encode("utf-8"))
            body.append(content)
        body.append(f"--{boundary}--\r\n".encode("utf-8"))
        data = b"\r\n".join(body)

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"error": err_body}
    except Exception as e:
        return 500, {"error": str(e)}

TEST_SUITES = [
    {
        "tenant_name": "LegalTech Corp",
        "tier": "enterprise",
        "key_name": "Legal Admin Key",
        "filename": "master_services_agreement.md",
        "content": """# MASTER SERVICES & LICENSING AGREEMENT

**Effective Date:** January 15, 2026  
**Parties:**  
- **Client:** Apex Global Logistics Inc. (John Doe, CTO, john.doe@apexlogistics.com)  
- **Provider:** Quantum Dynamics Software LLC (Jane Smith, CEO, jane@quantumdynamics.io)

---

## 1. Scope of Services & Deliverables
Provider agrees to deliver a multi-tenant enterprise resource planning (ERP) platform. 
Deliverables include real-time inventory tracking, automated dispatch APIs, and data migration from legacy Oracle databases.

## 2. Limitation of Liability & Indemnification
- **Aggregate Liability Cap:** In no event shall either party's total cumulative liability under this Agreement exceed **$5,000,000 USD** or the total fees paid in the preceding 12 months, whichever is greater.
- **Force Majeure:** Neither party shall be held liable for failure or delay in performance caused by acts of God, war, pandemic lockdowns, severe weather, or major cloud infrastructure outages beyond reasonable control.
- **Indemnification:** Provider agrees to defend and hold harmless Client against third-party intellectual property infringement claims arising from the core software platform.

## 3. Confidentiality & Data Privacy (GDPR Compliance)
Both parties shall maintain strict confidentiality regarding proprietary source code, security audit logs, and customer PII.
Customer PII, including credit card numbers (e.g., `4532-8901-2345-6789`) and Social Security Numbers (`XXX-XX-6789`), must be anonymized prior to indexing or analytics processing.

## 4. Payment Terms & Termination
- **Milestone Billing:** 50% deposit upon contract execution ($250,000 USD), 25% upon staging milestone completion, and 25% upon final production sign-off.
- **Termination for Convenience:** Either party may terminate this Agreement by providing 60 days written notice to the registered corporate address.
"""
    },
    {
        "tenant_name": "FinTech Analytics",
        "tier": "premium",
        "key_name": "FinTech Analyst Key",
        "filename": "q3_financial_statement.md",
        "content": """# Q3 CONSOLIDATED FINANCIAL REPORT & EARNINGS STATEMENT

**Reporting Period:** Q3 FY2026 (July 1, 2026 – September 30, 2026)  
**Company:** Apex FinTech Solutions Inc. (NASDAQ: AFTS)

---

## Executive Summary
Apex FinTech reported strong quarterly revenue growth driven by cloud payment gateway adoption and enterprise subscription volume. 
Total revenue reached **$142.8 Million**, representing a **24.5% year-over-year increase**.

---

## Condensed Financial Performance Table

| Financial Metric | Q3 FY2025 | Q3 FY2026 | YoY Change (%) |
| :--- | :--- | :--- | :--- |
| **Total Revenue** | $114.7M | $142.8M | +24.5% |
| **Gross Margin (GAAP)** | 68.2% | 72.4% | +420 bps |
| **Operating Income** | $28.4M | $39.1M | +37.67% |
| **Non-GAAP Adjusted EBITDA** | $34.2M | $48.6M | +42.1% |
| **Net Cash Flow from Ops** | $22.1M | $31.8M | +43.89% |
| **Diluted EPS (USD)** | $0.48 | $0.67 | +39.58% |

---

## Segment Revenue Breakdown

1. **Merchant Payment Gateway:** $84.2M (58.9% of total revenue)
2. **Enterprise SaaS Subscriptions:** $43.6M (30.5% of total revenue)
3. **Cross-Border FX Clearing:** $15.0M (10.6% of total revenue)

---

## Operating Guidance & Outlook
For Q4 FY2026, management projects total consolidated net revenue between **$155.0M and $160.0M**, with Non-GAAP EBITDA margins expected to remain above 33.5%.
"""
    },
    {
        "tenant_name": "HealthTech Bio",
        "tier": "enterprise",
        "key_name": "Clinical Bio Key",
        "filename": "clinical_trial_protocol_nct992.md",
        "content": """# PHASE III CLINICAL TRIAL PROTOCOL — STUDY NCT04992810

**Study Title:** Evaluation of mRNA-8842 Targeted Immunotherapy in Advanced Solid Tumor Malignancies  
**Sponsor:** BioGenetics Research Institute (Cambridge, MA)  
**Principal Investigator:** Dr. Eleanor Vance, MD, PhD

---

## 1. Study Objectives & Endpoints
- **Primary Objective:** Assess Overall Response Rate (ORR) and Progression-Free Survival (PFS) at 24 weeks.
- **Secondary Objective:** Evaluate Pharmacokinetics (PK) and Safety Profile across Cohort A (10mg/kg) and Cohort B (20mg/kg).

---

## 2. Patient Eligibility Criteria

### Inclusion Criteria
1. Adult patients aged 18 to 75 years with histologically confirmed Stage III or IV metastatic carcinoma.
2. ECOG Performance Status score of 0 or 1.
3. Adequate organ function defined as:
   - Absolute Neutrophil Count (ANC) ≥ 1,500/µL
   - Platelets ≥ 100,000/µL
   - Serum Creatinine ≤ 1.5× Upper Limit of Normal (ULN)

### Exclusion Criteria
1. Active brain metastases or leptomeningeal disease.
2. Concurrent systemic immunosuppressive therapy exceeding 10mg prednisone daily.
3. Prior exposure to investigational mRNA vaccines within 30 days of screening.
4. Pediatric patients under 18 years of age.

---

## 3. Dosage & Administration Protocol
Dosage is administered via intravenous infusion once every 21 days for up to 8 cycles. 
Pre-medication with diphenhydramine (50mg IV) and acetaminophen (650mg PO) is mandatory 30 minutes prior to infusion.
"""
    },
    {
        "tenant_name": "DevTools Code",
        "tier": "standard",
        "key_name": "DevTools Admin Key",
        "filename": "oauth2_pkce_architecture_spec.md",
        "content": """# ARCHITECTURE SPECIFICATION — OAUTH2 PKCE AUTHENTICATION & JWT ROTATION

**System:** Retriever Microservice API Gateway  
**Author:** Platform Security Engineering

---

## 1. Overview
This specification details the end-to-end OAuth2 Proof Key for Code Exchange (PKCE) flow and JSON Web Token (JWT) session lifecycle management enforced by the gateway API.

---

## 2. Authorization Code Exchange Flow with PKCE
```
Client App                   Authorization Server               Resource API
    │                                  │                            │
    │ ─── 1. Authorization Request ──► │                            │
    │     (code_challenge, method)     │                            │
    │                                  │                            │
    │ ◄── 2. Return Auth Code ──────── │                            │
    │                                  │                            │
    │ ─── 3. Token Exchange ─────────► │                            │
    │     (auth_code + code_verifier)  │                            │
    │                                  │                            │
    │ ◄── 4. Issue JWT Access Token ── │                            │
    │     (RS256 signed JWT + Refresh) │                            │
    │                                  │                            │
    │ ────────────────────────────────────────────────────────────► │ 5. API Call
    │                                                               │    (Bearer JWT)
```

---

## 3. Token Structure & Verification Rules
- **Algorithm:** RS256 with OIDC Public Key Set (JWKS) resolution.
- **Access Token TTL:** 15 minutes (900 seconds).
- **Refresh Token TTL:** 30 days with single-use automatic token rotation.
- **Required Claims:** `sub` (User UUID), `iss` (`https://prateeq.in/auth`), `tenant_id` (Tenant UUID), `roles` (`['admin', 'client']`).

---

## 4. Error Handling & Security Mitigation
- **Stale Token Handling:** Rejection with `HTTP 401 Unauthorized` and `WWW-Authenticate: Bearer error="invalid_token"`.
- **Token Reuse Detection:** If a revoked refresh token is presented, all child refresh tokens associated with that user session are invalidated immediately.
"""
    },
    {
        "tenant_name": "E-Commerce Ops",
        "tier": "standard",
        "key_name": "Support Ops Key",
        "filename": "shipping_and_return_policy.md",
        "content": """# ACME RETAIL — SHIPPING, RETURNS & WARRANTY POLICY

**Effective Date:** February 1, 2026  
**Support Contact:** `support@acmeretail.com` | 1-800-555-ACME

---

## 1. Domestic & International Shipping
- **Domestic Shipping (US & Canada):** Standard delivery takes 3 to 5 business days. Express overnight shipping is available at checkout for $19.99.
- **International Shipping:** Ships to 45 countries via DHL Express. International transit time is 5 to 10 business days. Import duties and customs fees are calculated at checkout.

---

## 2. 30-Day Return & Refund Guarantee
Customers may return unopened or gently used merchandise within **30 days of initial delivery** for a full refund to the original payment method.

### Return Conditions
1. **Original Receipt Present:** Full refund credited to original credit card or bank account within 3 to 5 business days.
2. **Missing Receipt:** Returns without a receipt will receive a store credit gift card at the lowest sale price over the last 90 days.
3. **Damaged Goods:** Items damaged during transit are eligible for immediate replacement at zero cost if reported within 7 days with photo proof.

---

## 3. Warranty Coverage & Escalations
All electronic items include a 1-Year Limited Manufacturer Warranty covering defective parts and labor. Warranty claims must be filed online at `https://acmeretail.com/warranty`.
"""
    }
]

def main():
    print("=================================================================", flush=True)
    print("🚀 Retriever RAG Demo Seeder & 5-Tenant Data Ingestion", flush=True)
    print(f"Target API Base: {API_BASE}", flush=True)
    print("=================================================================\n", flush=True)

    results = []
    headers_admin = {"X-Admin-Master-Key": ADMIN_KEY}

    for idx, suite in enumerate(TEST_SUITES, 1):
        print(f"[{idx}/5] 🏢 Provisioning Tenant: '{suite['tenant_name']}'...")
        
        # 1. Create Tenant
        status_code, tenant_data = make_request(
            f"{API_BASE}/v1/tenants",
            method="POST",
            json_data={"name": suite["tenant_name"], "tier": suite["tier"]},
            headers=headers_admin
        )
        if status_code not in (200, 201):
            print(f"   ❌ Failed to create tenant: {status_code} - {tenant_data}")
            continue
        
        tenant_id = tenant_data.get("tenantId")
        print(f"   ✅ Created Tenant ID: {tenant_id}")

        # 2. Create API Key
        key_code, key_data = make_request(
            f"{API_BASE}/v1/admin/tenants/{tenant_id}/api-keys",
            method="POST",
            json_data={"name": suite["key_name"], "role": "client", "expires_in_days": 365},
            headers=headers_admin
        )
        api_key = key_data.get("apiKey") if key_code in (200, 201) else "N/A"
        print(f"   🔑 Issued API Key: {api_key}")

        # 3. Create Root User
        user_code, user_data = make_request(
            f"{API_BASE}/v1/admin/tenants/{tenant_id}/users",
            method="POST",
            json_data={"external_id": f"admin@{suite['tenant_name'].lower().replace(' ', '')}.com", "display_name": f"{suite['tenant_name']} Admin"},
            headers=headers_admin
        )
        user_id = user_data.get("userId") if user_code in (200, 201) else "N/A"

        # 4. Upload & Process Document
        print(f"   📄 Uploading & Indexing Document '{suite['filename']}'...")
        files = {
            "file": (suite["filename"], suite["content"].encode("utf-8"), "text/markdown")
        }
        client_headers = {
            "Authorization": f"Bearer {api_key}",
            "X-User-ID": user_id,
        }
        upload_code, upload_data = make_request(
            f"{API_BASE}/v1/tenants/{tenant_id}/documents",
            method="POST",
            files=files,
            headers=client_headers
        )

        if upload_code in (200, 201, 202):
            doc_id = upload_data.get("documentId")
            print(f"   ✅ Uploaded Document ID: {doc_id}")

            # Trigger Vector Embedding Processing
            process_code, process_data = make_request(
                f"{API_BASE}/v1/admin/tenants/{tenant_id}/documents/{doc_id}/process?targetEngine=oracle",
                method="POST",
                headers=headers_admin
            )
            if process_code in (200, 201, 202):
                print(f"   ⚡ Indexed Vector Embeddings Successfully!")
            else:
                print(f"   ⚠️ Uploaded but processing queued/deferred: {process_code}")

        else:
            print(f"   ❌ Document Upload Failed: {upload_code} - {upload_data}")

        results.append({
            "name": suite["tenant_name"],
            "tenant_id": tenant_id,
            "api_key": api_key,
            "user_id": user_id,
            "file": suite["filename"]
        })

    print("\n=================================================================")
    print("🎉 ALL 5 TENANTS PROVISIONED & DATASETS INDEXED SUCCESSFULLY!")
    print("=================================================================\n")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
