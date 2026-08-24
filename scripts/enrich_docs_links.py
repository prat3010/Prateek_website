#!/usr/bin/env python3
"""
enrich_docs_links.py (Master Ultra Edition)
Standardizes all internal links across docs/ to relative vault paths,
fixes broken relative targets, and enriches cross-references to create a dense Obsidian Knowledge Mesh.
"""

import os
import re
from pathlib import Path

DOCS_DIR = Path("/Users/prateeksharma/Developer/Prateek_website/docs")
ROOT_DIR = Path("/Users/prateeksharma/Developer/Prateek_website")

CROSS_REFS = {
    "01_Vision_and_Philosophy.md": [
        ("03_Product_Goals_Objectives_and_Success_Metrics.md", "Goals & Success Metrics"),
        ("04_Adaptive_Portfolio_Experience.md", "Adaptive Portfolio Experience"),
        ("06_Adaptive_Identity_System.md", "Adaptive Identity System"),
        ("07_Content_Strategy.md", "Content Strategy"),
        ("UNIFIED_MASTER_ROADMAP.md", "Master Development Roadmap (SSoT)"),
        ("99_DECISIONS.md", "Architecture Decision Records"),
        ("architecture_nodes/Route_home.md", "Architecture Node: Route /"),
    ],
    "03_Product_Goals_Objectives_and_Success_Metrics.md": [
        ("01_Vision_and_Philosophy.md", "Vision & Philosophy"),
        ("13_Telemetry_and_Analytics.md", "Telemetry & Performance Metrics"),
        ("15_Performance_and_Accessibility.md", "Core Web Vitals Standards"),
        ("REVENUE_EXECUTION_PLAN.md", "Revenue Execution Plan"),
        ("UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap"),
        ("architecture_nodes/Route_analytics.md", "Architecture Node: Analytics Route"),
    ],
    "04_Adaptive_Portfolio_Experience.md": [
        ("06_Adaptive_Identity_System.md", "Adaptive Identity System"),
        ("05_User_Experience_and_Interaction_Design.md", "UX & Interaction Design"),
        ("08_Information_Architecture.md", "Information Architecture"),
        ("09_Section_Specifications/01_Hero.md", "Hero Section Specification"),
        ("99_DECISIONS.md", "Architecture Decision Records"),
        ("architecture_nodes/Route_home.md", "Architecture Node: Route /"),
        ("architecture_nodes/UI_NoirSkyline.md", "Architecture Node: NoirSkyline Parallax"),
    ],
    "05_User_Experience_and_Interaction_Design.md": [
        ("04_Adaptive_Portfolio_Experience.md", "Adaptive Portfolio Experience"),
        ("06_Adaptive_Identity_System.md", "Visual & Communication Identities"),
        ("15_Performance_and_Accessibility.md", "Performance & Motion Accessibility"),
        ("99_DECISIONS.md", "ADR 05 (ScrollSection) & ADR 10 (Skyline Parallax)"),
        ("architecture_nodes/Context_ThemeProvider_Lenis.md", "Architecture Node: Theme & Lenis Providers"),
    ],
    "06_Adaptive_Identity_System.md": [
        ("04_Adaptive_Portfolio_Experience.md", "Adaptive Portfolio Experience"),
        ("07_Content_Strategy.md", "Brand Tone & Content Strategy"),
        ("09_Section_Specifications/01_Hero.md", "Hero Identity Switcher"),
        ("09_Section_Specifications/03_Skills_and_Services.md", "Persona-Aware Skills"),
        ("99_DECISIONS.md", "ADR 01 (Independent Theme & Identity States)"),
        ("architecture_nodes/Lib_skills.md", "Architecture Node: Persona Skill Filter"),
    ],
    "07_Content_Strategy.md": [
        ("01_Vision_and_Philosophy.md", "Vision & Philosophy"),
        ("06_Adaptive_Identity_System.md", "Adaptive Identity System"),
        ("BRAND_TONE_GUIDELINES.md", "Brand Tone & Copywriting Guidelines"),
        ("BLOG_DEEP_LINKING_MAP.md", "SEO Project Deep Linking Taxonomy"),
        ("AUTOMATED_AI_BLOGGING_ROADMAP.md", "Automated AI Content Engine"),
        ("architecture_nodes/Route_blog.md", "Architecture Node: Blog Publication Engine"),
    ],
    "08_Information_Architecture.md": [
        ("04_Adaptive_Portfolio_Experience.md", "Adaptive Portfolio Experience"),
        ("00_README.md", "Documentation Index"),
        ("10_Content_Platform_Architecture.md", "Content Platform Architecture"),
        ("09_Section_Specifications/12_Scoping_Lab.md", "Scoping Lab Specification"),
        ("09_Section_Specifications/13_Client_Workspace_Dashboard.md", "Client Workspace Specification"),
        ("UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap"),
    ],
    "10_Content_Platform_Architecture.md": [
        ("11_Content_Management_System.md", "Streamlit Content Synchronizer"),
        ("13_Telemetry_and_Analytics.md", "Telemetry & Page Visits Schema"),
        ("14_Razorpay_Payments_and_Invoicing.md", "Payments & Invoice Schema"),
        ("16_Security_and_Privacy.md", "Row-Level Security & Cache Invalidation"),
        ("25_SOTA_Scoping_Engine_PRD.md", "SOTA Scoping & Client Scope Schema"),
        ("ARCHITECTURE_DEPENDENCY_MAP.md", "Codebase Architecture Dependency Map"),
        ("architecture_nodes/Lib_data.md", "Architecture Node: Cached Supabase Layer"),
        ("architecture_nodes/API_revalidate.md", "Architecture Node: ISR Cache Purge"),
    ],
    "11_Content_Management_System.md": [
        ("10_Content_Platform_Architecture.md", "Content Platform Architecture"),
        ("12_AI_Integration_Strategy.md", "Gemini AI Synchronizer Integration"),
        ("MIDDLEMAN_PARTNERSHIP_AGREEMENT.md", "Middleman Agreement Tab"),
        ("09_Section_Specifications/12_Scoping_Lab.md", "Scoping Questionnaire Editor"),
        ("architecture_nodes/Tool_Synchronizer.md", "Architecture Node: Streamlit CMS Dashboard"),
    ],
    "12_AI_Integration_Strategy.md": [
        ("11_Content_Management_System.md", "Content Synchronizer AI Assistant"),
        ("25_SOTA_Scoping_Engine_PRD.md", "AI Intent Parsing & PDF OCR"),
        ("24_RAG_App_Studio_PRD.md", "Retriever RAG Cognitive Architecture"),
        ("AI_OUTREACH_AGENT_ROADMAP.md", "Autonomous AI Outreach Agent"),
        ("AUTOMATED_AI_BLOGGING_ROADMAP.md", "AI Newsjacking Engine"),
        ("architecture_nodes/Engine_RLM_Python_REPL.md", "Architecture Node: Python REPL Sandbox"),
    ],
    "13_Telemetry_and_Analytics.md": [
        ("10_Content_Platform_Architecture.md", "Database Logging & RPC Aggregation"),
        ("16_Security_and_Privacy.md", "GDPR-Compliant IP Hashing & RLS"),
        ("09_Section_Specifications/10_Terminal.md", "Terminal Analytics Commands"),
        ("24_RAG_App_Studio_PRD.md", "RAG Studio Telemetry & Token Metering"),
        ("architecture_nodes/Proxy_telemetry.md", "Architecture Node: Edge Proxy"),
        ("architecture_nodes/Schema_page_visits.md", "Architecture Node: Page Visits Schema"),
    ],
    "14_Razorpay_Payments_and_Invoicing.md": [
        ("25_SOTA_Scoping_Engine_PRD.md", "50% Scope Deposit Escrow & CPQ Math"),
        ("09_Section_Specifications/13_Client_Workspace_Dashboard.md", "Client Workspace Invoice Ledger"),
        ("16_Security_and_Privacy.md", "HMAC Signature Verification & Webhooks"),
        ("24_RAG_App_Studio_PRD.md", "RAG SaaS Subscriptions Billing"),
        ("UNIFIED_MASTER_ROADMAP.md", "Payment Milestones (M64, M67)"),
        ("architecture_nodes/API_client_create_razorpay_order.md", "Architecture Node: Create Order API"),
        ("architecture_nodes/API_client_verify_razorpay_payment.md", "Architecture Node: Verify Payment API"),
        ("architecture_nodes/Schema_invoices.md", "Architecture Node: Invoices Schema"),
    ],
    "15_Performance_and_Accessibility.md": [
        ("05_User_Experience_and_Interaction_Design.md", "Motion & Reduced Motion Standards"),
        ("19_Testing_and_Quality_Assurance.md", "Automated QA & CI/CD Verification"),
        ("99_DECISIONS.md", "ADR 05 (ScrollSection) & ADR 10 (Mobile Parallax)"),
    ],
    "16_Security_and_Privacy.md": [
        ("10_Content_Platform_Architecture.md", "Supabase Service Role & Public RLS"),
        ("14_Razorpay_Payments_and_Invoicing.md", "Payment Security & Webhook Signatures"),
        ("CLIENT_DASHBOARD_ROADMAP.md", "Supabase Auth PKCE Session Gate"),
        ("25_SOTA_Scoping_Engine_PRD.md", "SHA-256 SOW Cryptographic Freeze"),
        ("architecture_nodes/Lib_sessionVerify.md", "Architecture Node: Session Guard"),
        ("architecture_nodes/Route_auth_callback.md", "Architecture Node: OAuth Handler"),
    ],
    "17_SEO_Strategy.md": [
        ("07_Content_Strategy.md", "Content Strategy & Copywriting"),
        ("BLOG_DEEP_LINKING_MAP.md", "Blog & Project Cross-Linking"),
        ("AUTOMATED_AI_BLOGGING_ROADMAP.md", "Automated AI Content Engine"),
        ("09_Section_Specifications/11_Blog.md", "Blog Section Specification"),
        ("architecture_nodes/Route_blog.md", "Architecture Node: Blog Engine"),
    ],
    "18_Codebase_Modernization_and_Refactoring.md": [
        ("MASTER_CODEBASE_AUDIT_CHECKLIST.md", "Master Codebase Audit Checklist"),
        ("ARCHITECTURE_DEPENDENCY_MAP.md", "Architecture Dependency Map"),
        ("99_DECISIONS.md", "Architecture Decision Records"),
        ("19_Testing_and_Quality_Assurance.md", "Automated Test Baselines"),
    ],
    "19_Testing_and_Quality_Assurance.md": [
        ("MASTER_CODEBASE_AUDIT_CHECKLIST.md", "Audit Checklist & Test Baselines"),
        ("18_Codebase_Modernization_and_Refactoring.md", "Codebase Modernization Rules"),
        ("20_Deployment_Strategy.md", "CI/CD & Deployment Verification"),
    ],
    "20_Deployment_Strategy.md": [
        ("19_Testing_and_Quality_Assurance.md", "Pre-Deployment Verification"),
        ("16_Security_and_Privacy.md", "Production Secrets & Edge Headers"),
        ("UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap"),
    ],
    "21_Future_Roadmap.md": [
        ("UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap (SSoT: M1–M68)"),
        ("25_SOTA_Scoping_Engine_PRD.md", "SOTA Scoping Engine & Commerce PRD"),
        ("24_RAG_App_Studio_PRD.md", "RAG SaaS Studio Workspace PRD"),
        ("CLIENT_DASHBOARD_ROADMAP.md", "Client Workspace Specification"),
    ],
    "24_RAG_App_Studio_PRD.md": [
        ("rag-lab.md", "RAG Lab Showcase Overview"),
        ("25_SOTA_Scoping_Engine_PRD.md", "Scoping Lab Dogfooding Tenant (`prateeq_scoping`)"),
        ("CLIENT_DASHBOARD_ROADMAP.md", "Client Workspace & RAG Studio Auth"),
        ("14_Razorpay_Payments_and_Invoicing.md", "SaaS Plan Subscriptions"),
        ("16_Security_and_Privacy.md", "Multi-Tenant Isolation & RLS"),
        ("UNIFIED_MASTER_ROADMAP.md", "Master Roadmap (Phases B, D, G)"),
        ("architecture_nodes/Route_rag_app.md", "Architecture Node: SaaS Studio"),
        ("architecture_nodes/Lib_rag_client.md", "Architecture Node: RAG Client SDK"),
        ("architecture_nodes/Retriever_API_v1_chat.md", "Architecture Node: /v1/chat"),
        ("architecture_nodes/Schema_rag_tenants.md", "Architecture Node: Tenants Schema"),
    ],
    "25_SOTA_Scoping_Engine_PRD.md": [
        ("UNIFIED_MASTER_ROADMAP.md", "Master Sequential Roadmap (Phase G: M63–M68)"),
        ("09_Section_Specifications/12_Scoping_Lab.md", "Scoping Lab Section Specification"),
        ("09_Section_Specifications/13_Client_Workspace_Dashboard.md", "Client Workspace Dashboard Spec"),
        ("14_Razorpay_Payments_and_Invoicing.md", "50% Deposit Lock & Invoicing Ledger"),
        ("24_RAG_App_Studio_PRD.md", "RAG SaaS Studio & `prateeq_scoping` Tenant"),
        ("CLIENT_DASHBOARD_ROADMAP.md", "Client Workspace Architecture Spec"),
        ("MIDDLEMAN_PARTNERSHIP_AGREEMENT.md", "Sales Partner Commission Engine"),
        ("REVENUE_EXECUTION_PLAN.md", "Revenue Strategy & Client Conversion"),
        ("architecture_nodes/Route_scoping.md", "Architecture Node: Route /scoping"),
        ("architecture_nodes/UI_ScopingLab.md", "Architecture Node: Scoping Lab Wizard"),
        ("architecture_nodes/UI_ArchitectureCartDrawer.md", "Architecture Node: Cart Drawer"),
        ("architecture_nodes/Lib_pricing.md", "Architecture Node: CPQ Math SSoT"),
        ("architecture_nodes/Schema_client_scopes.md", "Architecture Node: Client Scopes Schema"),
    ],
    "99_DECISIONS.md": [
        ("01_Vision_and_Philosophy.md", "Vision & Philosophy"),
        ("04_Adaptive_Portfolio_Experience.md", "Adaptive Portfolio Experience"),
        ("05_User_Experience_and_Interaction_Design.md", "Interaction Design"),
        ("06_Adaptive_Identity_System.md", "Identity System"),
        ("UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap"),
        ("architecture_nodes/UI_NoirSkyline.md", "ADR 10: Skyline Parallax Decoupling"),
        ("architecture_nodes/UI_CommercialPDFSuite.md", "ADR 11 & 12: PDF Token Architecture"),
    ],
    "AI_OUTREACH_AGENT_ROADMAP.md": [
        ("UNIFIED_MASTER_ROADMAP.md", "Master Roadmap (Milestones 57–58)"),
        ("12_AI_Integration_Strategy.md", "Gemini 2.5 Flash Integration"),
        ("16_Security_and_Privacy.md", "OAuth2 & Anti-Ban Rate Limiting"),
        ("09_Section_Specifications/13_Client_Workspace_Dashboard.md", "Admin Control Center (`/admin`)"),
        ("REVENUE_EXECUTION_PLAN.md", "Cold Outreach Conversion Scripts"),
        ("architecture_nodes/Route_admin.md", "Architecture Node: Route /admin"),
        ("architecture_nodes/UI_AdminPortal.md", "Architecture Node: Admin Portal"),
        ("architecture_nodes/API_outreach_dispatch.md", "Architecture Node: Outreach Dispatch API"),
        ("architecture_nodes/Schema_outreach_leads.md", "Architecture Node: Outreach Leads Schema"),
    ],
    "AUTOMATED_AI_BLOGGING_ROADMAP.md": [
        ("UNIFIED_MASTER_ROADMAP.md", "Master Roadmap (Milestone 59)"),
        ("07_Content_Strategy.md", "Brand Voice & Writing Style"),
        ("BLOG_DEEP_LINKING_MAP.md", "Deep-Linking Taxonomy"),
        ("17_SEO_Strategy.md", "Zero-Penalty SEO Safeguards"),
        ("09_Section_Specifications/11_Blog.md", "Blog Section Specification"),
        ("architecture_nodes/API_blog_publish.md", "Architecture Node: Publish API"),
        ("architecture_nodes/Schema_blog_posts.md", "Architecture Node: Blog Posts Schema"),
    ],
    "BLOG_DEEP_LINKING_MAP.md": [
        ("AUTOMATED_AI_BLOGGING_ROADMAP.md", "Automated AI Content Engine"),
        ("07_Content_Strategy.md", "Content Strategy"),
        ("17_SEO_Strategy.md", "SEO Strategy"),
        ("09_Section_Specifications/04_Projects.md", "Projects Showcase"),
        ("architecture_nodes/Schema_projects.md", "Architecture Node: Projects Schema"),
    ],
    "BRAND_TONE_GUIDELINES.md": [
        ("07_Content_Strategy.md", "Content Strategy"),
        ("01_Vision_and_Philosophy.md", "Vision & Philosophy"),
        ("06_Adaptive_Identity_System.md", "Adaptive Identity System"),
        ("AUTOMATED_AI_BLOGGING_ROADMAP.md", "AI Content Brand Voice"),
    ],
    "CLIENT_DASHBOARD_ROADMAP.md": [
        ("UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap (SSoT)"),
        ("25_SOTA_Scoping_Engine_PRD.md", "SOTA Scoping Engine & Commerce PRD"),
        ("24_RAG_App_Studio_PRD.md", "RAG SaaS Studio PRD"),
        ("09_Section_Specifications/13_Client_Workspace_Dashboard.md", "Client Workspace Dashboard Spec"),
        ("14_Razorpay_Payments_and_Invoicing.md", "Payments & Subscriptions"),
        ("16_Security_and_Privacy.md", "Supabase Auth PKCE Session Verification"),
        ("architecture_nodes/Route_dashboard.md", "Architecture Node: Route /dashboard"),
        ("architecture_nodes/UI_ClientWorkspaceDashboard.md", "Architecture Node: Dashboard UI"),
        ("architecture_nodes/API_client_copilot.md", "Architecture Node: Copilot API"),
        ("architecture_nodes/Schema_client_scopes.md", "Architecture Node: Client Scopes Schema"),
    ],
    "DEMO_PLAYBOOK_AND_SHOWCASE_GUIDE.md": [
        ("24_RAG_App_Studio_PRD.md", "RAG SaaS Studio Demo Script"),
        ("25_SOTA_Scoping_Engine_PRD.md", "Scoping Lab Live Walkthrough"),
        ("REVENUE_EXECUTION_PLAN.md", "High-Ticket Client Conversion"),
    ],
    "MASTER_CODEBASE_AUDIT_CHECKLIST.md": [
        ("18_Codebase_Modernization_and_Refactoring.md", "Codebase Modernization Rules"),
        ("19_Testing_and_Quality_Assurance.md", "Testing & Verification"),
        ("ARCHITECTURE_DEPENDENCY_MAP.md", "Architecture Dependency Map"),
        ("UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap"),
    ],
    "MIDDLEMAN_PARTNERSHIP_AGREEMENT.md": [
        ("25_SOTA_Scoping_Engine_PRD.md", "Sales Partner Promo Validation & Attribution"),
        ("11_Content_Management_System.md", "Synchronizer Middleman Agreement Tab"),
        ("REVENUE_EXECUTION_PLAN.md", "Affiliate Partner Strategy"),
        ("architecture_nodes/Lib_commission.md", "Architecture Node: Commission SSoT"),
    ],
    "REVENUE_EXECUTION_PLAN.md": [
        ("03_Product_Goals_Objectives_and_Success_Metrics.md", "Product Goals & Metrics"),
        ("25_SOTA_Scoping_Engine_PRD.md", "High-Ticket Scoping Lab"),
        ("24_RAG_App_Studio_PRD.md", "Retriever SaaS Revenue"),
        ("MIDDLEMAN_PARTNERSHIP_AGREEMENT.md", "Sales Affiliate Program"),
        ("DEMO_PLAYBOOK_AND_SHOWCASE_GUIDE.md", "Client Demo Showcase"),
    ],
    "SCOPING_AUDIT_ROADMAP.md": [
        ("25_SOTA_Scoping_Engine_PRD.md", "Active SOTA Scoping Engine PRD"),
        ("09_Section_Specifications/12_Scoping_Lab.md", "Scoping Lab Section Spec"),
        ("UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap"),
    ],
    "UNIFIED_MASTER_ROADMAP.md": [
        ("25_SOTA_Scoping_Engine_PRD.md", "Phase G: SOTA Scoping Engine & Commerce PRD (M63–M68)"),
        ("24_RAG_App_Studio_PRD.md", "Phase D: RAG SaaS Studio Workspace PRD (M54–M56)"),
        ("CLIENT_DASHBOARD_ROADMAP.md", "Client Dashboard Specification"),
        ("AI_OUTREACH_AGENT_ROADMAP.md", "Phase E: Autonomous AI Outreach Agent (M57–M58)"),
        ("AUTOMATED_AI_BLOGGING_ROADMAP.md", "Phase E: Automated AI Newsjacking (M59)"),
        ("14_Razorpay_Payments_and_Invoicing.md", "Razorpay Payments & Invoicing System"),
        ("10_Content_Platform_Architecture.md", "Content Platform Architecture"),
        ("09_Section_Specifications/README.md", "All Section Specifications"),
    ],
    "rag-lab.md": [
        ("24_RAG_App_Studio_PRD.md", "RAG SaaS Studio Workspace PRD"),
        ("25_SOTA_Scoping_Engine_PRD.md", "Scoping Dogfooding Tenant"),
        ("13_Telemetry_and_Analytics.md", "Telemetry & Semantic Cache Tracking"),
        ("UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap"),
    ],
}

# Subdirectory section cross-references
SECTION_CROSS_REFS = {
    "01_Hero.md": [
        ("../04_Adaptive_Portfolio_Experience.md", "Adaptive Portfolio Experience"),
        ("../06_Adaptive_Identity_System.md", "Adaptive Identity System"),
        ("../05_User_Experience_and_Interaction_Design.md", "Motion & Visual Aesthetics"),
        ("../99_DECISIONS.md", "ADR 01 & ADR 10 (Noir Skyline)"),
        ("02_About_Me.md", "Next Section: About Me"),
        ("../architecture_nodes/Route_home.md", "Architecture Node: Route /"),
        ("../architecture_nodes/UI_NoirSkyline.md", "Architecture Node: NoirSkyline"),
    ],
    "02_About_Me.md": [
        ("01_Hero.md", "Previous Section: Hero"),
        ("../06_Adaptive_Identity_System.md", "Developer vs Business Mindset"),
        ("03_Skills_and_Services.md", "Next Section: Skills & Services"),
    ],
    "03_Skills_and_Services.md": [
        ("02_About_Me.md", "Previous Section: About Me"),
        ("../06_Adaptive_Identity_System.md", "Persona-Aware Skills"),
        ("04_Projects.md", "Next Section: Projects Showcase"),
        ("../architecture_nodes/Schema_skills.md", "Architecture Node: Skills Schema"),
    ],
    "04_Projects.md": [
        ("03_Skills_and_Services.md", "Previous Section: Skills"),
        ("../BLOG_DEEP_LINKING_MAP.md", "Project Case Studies & Deep Links"),
        ("05_Playground.md", "Next Section: Playground"),
        ("../architecture_nodes/Schema_projects.md", "Architecture Node: Projects Schema"),
    ],
    "05_Playground.md": [
        ("04_Projects.md", "Previous Section: Projects"),
        ("../15_Performance_and_Accessibility.md", "WebGL & Performance Throttling"),
        ("06_Resume_and_Quotations.md", "Next Section: Resume"),
    ],
    "06_Resume_and_Quotations.md": [
        ("05_Playground.md", "Previous Section: Playground"),
        ("12_Scoping_Lab.md", "Interactive Scoping Lab"),
        ("../MIDDLEMAN_PARTNERSHIP_AGREEMENT.md", "Sales Partner Agreement"),
        ("08_Contact.md", "Next Section: Contact"),
        ("../architecture_nodes/UI_CommercialPDFSuite.md", "Architecture Node: Commercial PDF Suite"),
    ],
    "07_Pricing.md": [
        ("12_Scoping_Lab.md", "Interactive Scoping Lab (Replaced Pricing)"),
        ("../25_SOTA_Scoping_Engine_PRD.md", "SOTA Scoping & CPQ Engine"),
        ("13_Client_Workspace_Dashboard.md", "Client Workspace Dashboard"),
    ],
    "08_Contact.md": [
        ("06_Resume_and_Quotations.md", "Previous Section: Resume"),
        ("../16_Security_and_Privacy.md", "reCAPTCHA v3 & Spam Prevention"),
        ("09_Footer.md", "Next Section: Footer"),
        ("../architecture_nodes/API_contact.md", "Architecture Node: Contact API"),
    ],
    "09_Footer.md": [
        ("08_Contact.md", "Previous Section: Contact"),
        ("10_Terminal.md", "Interactive Diagnostics Terminal"),
        ("../00_README.md", "Documentation Index"),
    ],
    "10_Terminal.md": [
        ("09_Footer.md", "Footer Diagnostics Link"),
        ("../13_Telemetry_and_Analytics.md", "Visitor Analytics"),
        ("../25_SOTA_Scoping_Engine_PRD.md", "Terminal Scoping CLI (`scope new`)"),
        ("../architecture_nodes/Route_terminal.md", "Architecture Node: Terminal Route"),
        ("../architecture_nodes/UI_Terminal.md", "Architecture Node: Terminal UI"),
    ],
    "11_Blog.md": [
        ("../07_Content_Strategy.md", "Content Strategy & Tone"),
        ("../17_SEO_Strategy.md", "SEO Strategy"),
        ("../AUTOMATED_AI_BLOGGING_ROADMAP.md", "Automated AI Content Engine"),
        ("../BLOG_DEEP_LINKING_MAP.md", "Blog Deep-Linking Map"),
        ("../architecture_nodes/Route_blog.md", "Architecture Node: Blog Route"),
    ],
    "12_Scoping_Lab.md": [
        ("../25_SOTA_Scoping_Engine_PRD.md", "SOTA Scoping & E-Commerce Cart PRD"),
        ("13_Client_Workspace_Dashboard.md", "Client Workspace Dashboard"),
        ("../14_Razorpay_Payments_and_Invoicing.md", "Razorpay 50% Deposit System"),
        ("../UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap (Phase G)"),
        ("../architecture_nodes/Route_scoping.md", "Architecture Node: Route /scoping"),
        ("../architecture_nodes/UI_ScopingLab.md", "Architecture Node: Scoping Lab UI"),
    ],
    "13_Client_Workspace_Dashboard.md": [
        ("../25_SOTA_Scoping_Engine_PRD.md", "SOTA Scoping & Scope Freeze PRD"),
        ("12_Scoping_Lab.md", "Scoping Lab Wizard"),
        ("../14_Razorpay_Payments_and_Invoicing.md", "Payments & Milestone Invoices"),
        ("../CLIENT_DASHBOARD_ROADMAP.md", "Client Dashboard Specification"),
        ("../16_Security_and_Privacy.md", "Supabase Auth PKCE Session Gate"),
        ("../UNIFIED_MASTER_ROADMAP.md", "Master Roadmap (Milestone 67)"),
        ("../architecture_nodes/Route_dashboard.md", "Architecture Node: Route /dashboard"),
        ("../architecture_nodes/UI_ClientWorkspaceDashboard.md", "Architecture Node: Dashboard UI"),
    ],
}


def fix_special_broken_links(content: str) -> str:
    """Fixes known broken web routes and old archive paths."""
    content = content.replace("(/scoping?engine=ai_strategy_audit)", "(architecture_nodes/Route_scoping.md)")
    content = content.replace("(/scoping?goal=custom)", "(architecture_nodes/Route_scoping.md)")
    content = content.replace("(/scoping?engine=landing)", "(architecture_nodes/Route_scoping.md)")
    content = content.replace("(/scoping?engine=saas)", "(architecture_nodes/Route_scoping.md)")
    content = content.replace("(/scoping)", "(architecture_nodes/Route_scoping.md)")
    content = content.replace("(/rag)", "(architecture_nodes/Route_rag_app.md)")
    content = content.replace("(/src/data/projects.json#L70-L90)", "(architecture_nodes/Schema_projects.md)")
    content = content.replace("(/src/data/projects.json#L48-L68)", "(architecture_nodes/Schema_projects.md)")
    content = content.replace("(/src/data/projects.json#L92-L112)", "(architecture_nodes/Schema_projects.md)")
    content = content.replace("(archive/checklist.md)", "(MASTER_CODEBASE_AUDIT_CHECKLIST.md)")
    return content


def clean_file_urls(content: str, current_dir: Path) -> str:
    """Replaces file:/// absolute paths with proper relative paths."""
    direct_pattern = r"\(file:///Users/prateeksharma/Developer/(?:Prateek_website|retriever)/([^)]+)\)"
    
    def replacer(match):
        raw_path = match.group(1)
        if raw_path.startswith("docs/"):
            target_path = DOCS_DIR / raw_path[len("docs/"):]
        else:
            target_path = ROOT_DIR / raw_path
        try:
            rel_path = os.path.relpath(target_path, current_dir)
            return f"({rel_path})"
        except ValueError:
            return match.group(0)

    return re.sub(direct_pattern, replacer, content)


def enrich_document(file_path: Path, cross_refs: list):
    content = file_path.read_text(encoding="utf-8")
    
    # 1. Clean file:/// URLs & broken routes
    content = clean_file_urls(content, file_path.parent)
    content = fix_special_broken_links(content)
    
    # 2. Check if Cross-References section already exists
    section_header = "## **Related Architecture & Cross-References**"
    alt_header = "## Related Architecture & Cross-References"
    
    cross_links_md = "\n\n---\n\n" + section_header + "\n\n"
    for target, label in cross_refs:
        cross_links_md += f"- [{label}]({target})\n"
    
    if section_header in content:
        # Replace existing section
        content = re.sub(
            rf"{re.escape(section_header)}.*$",
            f"{section_header}\n\n" + "\n".join(f"- [{label}]({target})" for target, label in cross_refs),
            content,
            flags=re.DOTALL,
        )
    elif alt_header in content:
        content = re.sub(
            rf"{re.escape(alt_header)}.*$",
            f"{section_header}\n\n" + "\n".join(f"- [{label}]({target})" for target, label in cross_refs),
            content,
            flags=re.DOTALL,
        )
    else:
        # Append to end
        content = content.rstrip() + cross_links_md
    
    file_path.write_text(content, encoding="utf-8")
    print(f"✓ Enriched {file_path.relative_to(DOCS_DIR)} with {len(cross_refs)} cross-references.")


def main():
    print("🚀 Starting Docs Knowledge Mesh Link Enrichment...")
    
    # Process top-level docs
    for filename, refs in CROSS_REFS.items():
        doc_path = DOCS_DIR / filename
        if doc_path.exists():
            enrich_document(doc_path, refs)
        else:
            print(f"⚠️ Missing: {filename}")
            
    # Process 09_Section_Specifications
    sections_dir = DOCS_DIR / "09_Section_Specifications"
    for filename, refs in SECTION_CROSS_REFS.items():
        doc_path = sections_dir / filename
        if doc_path.exists():
            enrich_document(doc_path, refs)
        else:
            print(f"⚠️ Missing section spec: {filename}")
            
    # Clean all other markdown files in docs/
    for md_file in DOCS_DIR.rglob("*.md"):
        try:
            if md_file.is_symlink():
                continue
            content = md_file.read_text(encoding="utf-8", errors="ignore")
            cleaned = clean_file_urls(content, md_file.parent)
            cleaned = fix_special_broken_links(cleaned)
            if cleaned != content:
                md_file.write_text(cleaned, encoding="utf-8")
                print(f"✓ Cleaned links in {md_file.relative_to(DOCS_DIR)}")
        except (PermissionError, OSError, UnicodeDecodeError):
            continue
            
    print("\n✨ All documentation links standardized and Knowledge Mesh fully enriched!")


if __name__ == "__main__":
    main()
