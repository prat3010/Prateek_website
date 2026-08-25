#!/usr/bin/env python3
"""
create_architecture_canvas.py (Master SOTA Ultra-HD 100% Coverage Edition)
Generates an expansive, millimeter-precise MASTER_ARCHITECTURE_MAP.canvas
with generous card dimensions (500px wide, 380px tall) mapping all 97
architecture nodes across 8 distinct architectural tiers with zero card collisions.

Architecture Tiers:
- Tier 1: Frontend & Adaptive Identity (9 cards)
- Tier 2: Discovery, CPQ Scoping & SOW Commerce (7 cards)
- Tier 3: Client Workspace, Operator Admin & SaaS Studio (7 cards)
- Tier 4: Next.js 16 Edge & REST API Gateway Matrix (34 cards)
- Tier 5: Core Domain Utilities, Auth Guards & PDF Suite (9 cards)
- Tier 6: Retriever Cognitive Backend & Agentic FastAPIs (17 cards)
- Tier 7: Async Workers, Brokers & Security Envelopes (3 cards)
- Tier 8: Dual Persistence Layer (Supabase + pgvector) (11 cards)
"""

import json
from pathlib import Path

DOCS_DIR = Path("/Users/prateeksharma/Developer/Prateek_website/docs")
VAULT_DIR = Path("/Users/prateeksharma/Developer/Prateek_Ecosystem_Vault")

CARD_W = 500
CARD_H = 380
PAD_X = 50
PAD_Y = 60
GAP_X = 40
GAP_Y = 40

def layout_group(grp_id, grp_label, grp_color, files, start_x, start_y, cols=2):
    group_nodes = []
    num_files = len(files)
    rows = (num_files + cols - 1) // cols
    
    grp_w = (cols * CARD_W) + ((cols - 1) * GAP_X) + (2 * PAD_X)
    grp_h = (rows * CARD_H) + ((rows - 1) * GAP_Y) + (2 * PAD_Y) + 30
    
    group_nodes.append({
        "id": grp_id,
        "type": "group",
        "label": grp_label,
        "x": start_x,
        "y": start_y,
        "width": grp_w,
        "height": grp_h,
        "color": grp_color
    })
    
    for idx, fname in enumerate(files):
        c = idx % cols
        r = idx // cols
        node_x = start_x + PAD_X + c * (CARD_W + GAP_X)
        node_y = start_y + PAD_Y + 30 + r * (CARD_H + GAP_Y)
        node_id = "node-" + fname.replace(".md", "").lower().replace("_", "-")
        
        group_nodes.append({
            "id": node_id,
            "type": "file",
            "file": f"architecture_nodes/{fname}",
            "x": node_x,
            "y": node_y,
            "width": CARD_W,
            "height": CARD_H,
            "color": grp_color
        })
        
    return group_nodes, start_y + grp_h + 100

def generate_nodes():
    nodes = []

    # Column 1: Groups 1, 2, 3 (User Experience & Workspaces)
    col1_x = -2400
    col1_y = -100

    g1_files = [
        "Route_home.md", "UI_NoirSkyline.md", "Route_terminal.md", "UI_Terminal.md",
        "Route_blog.md", "UI_BlogEngine.md", "Route_analytics.md", "UI_AnalyticsDashboard.md",
        "Context_ThemeProvider_Lenis.md"
    ]
    g1_nodes, col1_y = layout_group("grp-frontend", "1. FRONTEND: Portfolio & Adaptive Identity System", "5", g1_files, col1_x, col1_y, 2)
    nodes.extend(g1_nodes)

    g2_files = [
        "Route_scoping.md", "UI_ScopingLab.md", "UI_ArchitectureCartDrawer.md", "UI_TopologyMap.md",
        "UI_PreDepositBridge.md", "Engine_Digital_SOW_Escrow_Freeze.md", "UI_MiddlemanAgreement.md"
    ]
    g2_nodes, col1_y = layout_group("grp-commerce", "2. DISCOVERY & COMMERCE: Multimodal CPQ Scoping & SOW Freeze", "3", g2_files, col1_x, col1_y, 2)
    nodes.extend(g2_nodes)

    g3_files = [
        "Route_dashboard.md", "UI_ClientWorkspaceDashboard.md", "Route_admin.md", "UI_AdminPortal.md",
        "Route_rag_app.md", "UI_RAGLabPlayground.md", "Tool_Synchronizer.md"
    ]
    g3_nodes, col1_y = layout_group("grp-workspace", "3. WORKSPACE & CONTROL: Client Dashboard, Admin & SaaS Studio", "1", g3_files, col1_x, col1_y, 2)
    nodes.extend(g3_nodes)

    # Column 2: Groups 4, 5 (API Gateway & Domain Core)
    col2_x = -1150
    col2_y = -100

    g4_files = [
        "Proxy_telemetry.md", "Route_auth_callback.md", "API_scoping_parse_intent.md", "API_scoping_parse_rfp.md",
        "API_client_save_scope.md", "API_client_intake_draft.md", "API_client_get_scopes.md", "API_client_delete_scope.md",
        "API_client_create_razorpay_order.md", "API_client_verify_razorpay_payment.md", "API_client_create_razorpay_invoice.md",
        "API_client_create_razorpay_subscription.md", "API_client_get_invoices.md", "API_client_copilot.md",
        "API_outreach_prospect.md", "API_outreach_dispatch.md", "API_outreach_get_leads.md", "API_contact.md",
        "API_revalidate.md", "API_git_log.md", "API_analytics_summary.md", "API_terminal_qrcode.md",
        "API_terminal_snake_leaderboard.md", "API_terminal_query.md", "API_projects.md", "API_skills.md",
        "API_certificates.md", "API_profile.md", "API_blog_publish.md", "API_rag_tenant.md",
        "API_rag_invite.md", "API_rag_members.md", "API_rag_telemetry.md", "API_webhooks_razorpay.md"
    ]
    g4_nodes, col2_y = layout_group("grp-gateway", "4. API GATEWAY: Next.js 16 Edge & REST Layer (34 Handlers)", "6", g4_files, col2_x, col2_y, 2)
    nodes.extend(g4_nodes)

    g5_files = [
        "Lib_pricing.md", "Lib_commission.md", "Lib_sessionVerify.md", "Context_AuthContext.md",
        "UI_CommercialPDFSuite.md", "Lib_rag_client.md", "Lib_data.md", "Lib_markdown.md", "Lib_skills.md"
    ]
    g5_nodes, col2_y = layout_group("grp-domain", "5. CORE DOMAIN & GUARDS: CPQ Pricing, Auth & PDF Suite", "2", g5_files, col2_x, col2_y, 2)
    nodes.extend(g5_nodes)

    # Column 3: Groups 6, 7 (Cognitive Core & Async Processing)
    col3_x = 100
    col3_y = -100

    g6_files = [
        "Retriever_API_v1_chat.md", "Retriever_API_v1_search.md", "Retriever_API_v1_documents.md", "Retriever_API_v1_admin.md",
        "Retriever_API_v1_workflow.md", "Retriever_API_v1_health.md", "Retriever_API_v1_auth.md", "Retriever_API_v1_consensus.md",
        "Retriever_API_v1_payments.md", "Retriever_API_v1_pricing.md", "Retriever_API_v1_agentic.md", "Retriever_API_v1_rlm.md",
        "Retriever_API_v1_tenant.md", "Retriever_API_v1_security_compression.md", "Engine_Docling_Layout_OCR.md", "Engine_LlamaGuard_Guardrails.md",
        "Engine_MultiAgent_Consensus.md", "Engine_LongLLMLingua_Compression.md", "Engine_RLM_Python_REPL.md", "Engine_GraphRAG_Topology.md"
    ]
    g6_nodes, col3_y = layout_group("grp-retriever", "6. RETRIEVER COGNITIVE CORE: Guardrails, Search & FastAPI Routers", "4", g6_files, col3_x, col3_y, 2)
    nodes.extend(g6_nodes)

    g7_files = [
        "Engine_Celery_RabbitMQ.md", "Engine_Dogfooding_Tenant_prateeq_scoping.md", "Engine_Envelope_Encryption.md"
    ]
    g7_nodes, col3_y = layout_group("grp-async", "7. ASYNC INFRASTRUCTURE: Workers, Brokers & Encryption Envelopes", "3", g7_files, col3_x, col3_y, 1)
    nodes.extend(g7_nodes)

    # Column 4: Group 8 (Dual Persistence Layer)
    col4_x = 1350
    col4_y = -100

    g8_files = [
        "Schema_client_scopes.md", "Schema_invoices.md", "Schema_promo_codes.md", "Schema_outreach_leads.md",
        "Schema_rag_tenants.md", "Schema_page_visits.md", "Schema_blog_posts.md", "Schema_projects.md",
        "Schema_skills.md", "Schema_retriever_inference_logs.md", "Schema_pgvector_store.md"
    ]
    g8_nodes, col4_y = layout_group("grp-persistence", "8. DUAL PERSISTENCE: Supabase Relational + pgvector HNSW Store", "7", g8_files, col4_x, col4_y, 2)
    nodes.extend(g8_nodes)

    return nodes

edges = [
    # 1. Scoping -> Cart -> Order -> Webhook -> SOW Freeze -> Invoices
    {
        "id": "e-scoping-to-cart",
        "fromNode": "node-ui-scopinglab",
        "fromSide": "right",
        "toNode": "node-ui-architecturecartdrawer",
        "toSide": "left",
        "color": "3",
        "label": "Live Quote Sync"
    },
    {
        "id": "e-cart-to-pricing",
        "fromNode": "node-ui-architecturecartdrawer",
        "fromSide": "right",
        "toNode": "node-lib-pricing",
        "toSide": "left",
        "color": "2",
        "label": "calcQuote() Math"
    },
    {
        "id": "e-cart-to-save-scope",
        "fromNode": "node-ui-architecturecartdrawer",
        "fromSide": "right",
        "toNode": "node-api-client-save-scope",
        "toSide": "left",
        "color": "6",
        "label": "Session Scope Upsert"
    },
    {
        "id": "e-save-scope-to-db",
        "fromNode": "node-api-client-save-scope",
        "fromSide": "right",
        "toNode": "node-schema-client-scopes",
        "toSide": "left",
        "color": "7",
        "label": "client_scopes Store"
    },
    {
        "id": "e-predeposit-to-order",
        "fromNode": "node-ui-predepositbridge",
        "fromSide": "right",
        "toNode": "node-api-client-create-razorpay-order",
        "toSide": "left",
        "color": "6",
        "label": "50% Milestone Deposit"
    },
    {
        "id": "e-webhook-to-verify",
        "fromNode": "node-api-webhooks-razorpay",
        "fromSide": "left",
        "toNode": "node-api-client-verify-razorpay-payment",
        "toSide": "right",
        "color": "6",
        "label": "HMAC-SHA256 Sig Check"
    },
    {
        "id": "e-webhook-to-sow-freeze",
        "fromNode": "node-api-webhooks-razorpay",
        "fromSide": "left",
        "toNode": "node-engine-digital-sow-escrow-freeze",
        "toSide": "right",
        "color": "3",
        "label": "sow_hash Snapshot Lock"
    },
    {
        "id": "e-webhook-to-invoices",
        "fromNode": "node-api-webhooks-razorpay",
        "fromSide": "right",
        "toNode": "node-schema-invoices",
        "toSide": "left",
        "color": "7",
        "label": "Invoice Paid Lock"
    },
    # 2. RAG UI -> Proxy -> RAG Client -> Cognitive Core -> pgvector
    {
        "id": "e-rag-ui-to-client",
        "fromNode": "node-ui-raglabplayground",
        "fromSide": "right",
        "toNode": "node-lib-rag-client",
        "toSide": "left",
        "color": "2",
        "label": "Client SDK Calls"
    },
    {
        "id": "e-rag-client-to-chat",
        "fromNode": "node-lib-rag-client",
        "fromSide": "right",
        "toNode": "node-retriever-api-v1-chat",
        "toSide": "left",
        "color": "4",
        "label": "SSE Stream /v1/chat"
    },
    {
        "id": "e-rag-client-to-search",
        "fromNode": "node-lib-rag-client",
        "fromSide": "right",
        "toNode": "node-retriever-api-v1-search",
        "toSide": "left",
        "color": "4",
        "label": "Hybrid /v1/search"
    },
    {
        "id": "e-chat-to-guard",
        "fromNode": "node-retriever-api-v1-chat",
        "fromSide": "bottom",
        "toNode": "node-engine-llamaguard-guardrails",
        "toSide": "top",
        "color": "4",
        "label": "LlamaGuard 3 Filter"
    },
    {
        "id": "e-search-to-pgvector",
        "fromNode": "node-retriever-api-v1-search",
        "fromSide": "right",
        "toNode": "node-schema-pgvector-store",
        "toSide": "left",
        "color": "7",
        "label": "Cosine HNSW Index"
    },
    # 3. Telemetry -> Proxy -> Supabase
    {
        "id": "e-proxy-to-page-visits",
        "fromNode": "node-proxy-telemetry",
        "fromSide": "right",
        "toNode": "node-schema-page-visits",
        "toSide": "left",
        "color": "7",
        "label": "Service Role Insert"
    },
    {
        "id": "e-analytics-to-summary",
        "fromNode": "node-ui-analyticsdashboard",
        "fromSide": "right",
        "toNode": "node-api-analytics-summary",
        "toSide": "left",
        "color": "6",
        "label": "Fast-Path RPC"
    },
    # 4. Admin Outreach -> Qualified Leads -> Resend
    {
        "id": "e-admin-to-prospect",
        "fromNode": "node-ui-adminportal",
        "fromSide": "right",
        "toNode": "node-api-outreach-prospect",
        "toSide": "left",
        "color": "6",
        "label": "ICP Scoring"
    },
    {
        "id": "e-outreach-to-leads-db",
        "fromNode": "node-api-outreach-dispatch",
        "fromSide": "right",
        "toNode": "node-schema-outreach-leads",
        "toSide": "left",
        "color": "7",
        "label": "Status: dispatched"
    }
]

def main():
    print("🎨 Generating 100% Complete 8-Tier Master Architecture Canvas...")
    nodes = generate_nodes()
    
    canvas_data_website = {
        "nodes": nodes,
        "edges": edges
    }
    
    website_canvas_path = DOCS_DIR / "MASTER_ARCHITECTURE_MAP.canvas"
    website_canvas_path.write_text(json.dumps(canvas_data_website, indent=2), encoding="utf-8")
    print(f"✓ Website Canvas generated at: {website_canvas_path}")

    try:
        nodes_vault = []
        for n in nodes:
            n_copy = dict(n)
            if n_copy.get("type") == "file" and n_copy.get("file", "").startswith("architecture_nodes/"):
                n_copy["file"] = "Prateek_Website/" + n_copy["file"]
            nodes_vault.append(n_copy)

        canvas_data_vault = {
            "nodes": nodes_vault,
            "edges": edges
        }
        vault_canvas_path = VAULT_DIR / "MASTER_ARCHITECTURE_MAP.canvas"
        if vault_canvas_path.is_symlink():
            vault_canvas_path.unlink()
        vault_canvas_path.write_text(json.dumps(canvas_data_vault, indent=2), encoding="utf-8")
        print(f"✓ Vault Canvas generated at: {vault_canvas_path}")
    except Exception as e:
        print(f"ℹ Note on Vault sync (running sandboxed): {e}")

    file_count = len([n for n in nodes if n.get("type") == "file"])
    group_count = len([n for n in nodes if n.get("type") == "group"])
    print(f"  Total Canvas Elements: {len(nodes)} (Groups: {group_count}, File Cards: {file_count})")
    print(f"  Total Directional Edges: {len(edges)}")

if __name__ == "__main__":
    main()
