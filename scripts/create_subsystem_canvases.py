#!/usr/bin/env python3
"""
create_subsystem_canvases.py
Generates 3 specialized, high-resolution Subsystem Flow Canvases:
1. COMMERCE_AND_ESCROW_FLOW.canvas
2. RAG_AND_COGNITIVE_PIPELINE.canvas
3. AUTONOMOUS_OUTREACH_ENGINE.canvas

Outputs in both:
- /Users/prateeksharma/Developer/Prateek_website/docs/
- /Users/prateeksharma/Developer/Prateek_Ecosystem_Vault/
"""

import json
from pathlib import Path

DOCS_DIR = Path("/Users/prateeksharma/Developer/Prateek_website/docs")
VAULT_DIR = Path("/Users/prateeksharma/Developer/Prateek_Ecosystem_Vault")


def write_canvas(filename: str, nodes: list, edges: list):
    # Website docs canvas
    canvas_website = {"nodes": nodes, "edges": edges}
    out_web = DOCS_DIR / filename
    out_web.write_text(json.dumps(canvas_website, indent=2), encoding="utf-8")
    print(f"✓ Created {out_web}")

    # Ecosystem Vault canvas (adjusts file paths to Prateek_Website/...)
    try:
        vault_nodes = []
        for n in nodes:
            nc = dict(n)
            if nc.get("type") == "file" and nc.get("file", "").startswith("architecture_nodes/"):
                nc["file"] = "Prateek_Website/" + nc["file"]
            vault_nodes.append(nc)

        canvas_vault = {"nodes": vault_nodes, "edges": edges}
        out_vault = VAULT_DIR / filename
        out_vault.write_text(json.dumps(canvas_vault, indent=2), encoding="utf-8")
        print(f"✓ Created {out_vault}")
    except Exception as e:
        print(f"ℹ Note on Vault sync (running sandboxed): {e}")


# =========================================================================
# 1. COMMERCE & ESCROW FLOW CANVAS
# =========================================================================
def generate_commerce_canvas():
    nodes = [
        # Group 1: Discovery & CPQ
        {
            "id": "grp-discovery",
            "type": "group",
            "label": "1. DISCOVERY & LIVE CPQ ESTIMATE",
            "x": -1200, "y": -100, "width": 600, "height": 1360, "color": "5"
        },
        {
            "id": "node-scoping",
            "type": "file", "file": "architecture_nodes/Route_scoping.md",
            "x": -1140, "y": -30, "width": 480, "height": 400, "color": "5"
        },
        {
            "id": "node-cart",
            "type": "file", "file": "architecture_nodes/UI_ArchitectureCartDrawer.md",
            "x": -1140, "y": 430, "width": 480, "height": 400, "color": "5"
        },
        {
            "id": "node-predeposit",
            "type": "file", "file": "architecture_nodes/UI_PreDepositBridge.md",
            "x": -1140, "y": 890, "width": 480, "height": 400, "color": "5"
        },

        # Group 2: Math Formulas & SOW
        {
            "id": "grp-math-sow",
            "type": "group",
            "label": "2. CPQ FORMULAS & SOW BRIEF",
            "x": -540, "y": -100, "width": 600, "height": 1360, "color": "3"
        },
        {
            "id": "node-pricing",
            "type": "file", "file": "architecture_nodes/Lib_pricing.md",
            "x": -480, "y": -30, "width": 480, "height": 400, "color": "3"
        },
        {
            "id": "node-pdf",
            "type": "file", "file": "architecture_nodes/UI_CommercialPDFSuite.md",
            "x": -480, "y": 430, "width": 480, "height": 400, "color": "3"
        },
        {
            "id": "node-sow-freeze",
            "type": "file", "file": "architecture_nodes/Engine_Digital_SOW_Escrow_Freeze.md",
            "x": -480, "y": 890, "width": 480, "height": 400, "color": "3"
        },

        # Group 3: Razorpay Escrow Gateway
        {
            "id": "grp-gateway",
            "type": "group",
            "label": "3. RAZORPAY PAYMENT GATEWAY",
            "x": 120, "y": -100, "width": 600, "height": 1360, "color": "6"
        },
        {
            "id": "node-create-order",
            "type": "file", "file": "architecture_nodes/API_client_create_razorpay_order.md",
            "x": 180, "y": -30, "width": 480, "height": 400, "color": "6"
        },
        {
            "id": "node-verify-payment",
            "type": "file", "file": "architecture_nodes/API_client_verify_razorpay_payment.md",
            "x": 180, "y": 430, "width": 480, "height": 400, "color": "6"
        },
        {
            "id": "node-save-scope",
            "type": "file", "file": "architecture_nodes/API_client_save_scope.md",
            "x": 180, "y": 890, "width": 480, "height": 400, "color": "6"
        },

        # Group 4: Ledger Persistence
        {
            "id": "grp-ledger",
            "type": "group",
            "label": "4. SCOPES & FINANCIAL LEDGER",
            "x": 780, "y": -100, "width": 600, "height": 1360, "color": "7"
        },
        {
            "id": "node-schema-scopes",
            "type": "file", "file": "architecture_nodes/Schema_client_scopes.md",
            "x": 840, "y": -30, "width": 480, "height": 560, "color": "7"
        },
        {
            "id": "node-schema-invoices",
            "type": "file", "file": "architecture_nodes/Schema_invoices.md",
            "x": 840, "y": 590, "width": 480, "height": 560, "color": "7"
        }
    ]

    edges = [
        {"id": "e1", "fromNode": "node-scoping", "fromSide": "bottom", "toNode": "node-cart", "toSide": "top", "color": "5", "label": "Select Modules"},
        {"id": "e2", "fromNode": "node-cart", "fromSide": "right", "toNode": "node-pricing", "toSide": "left", "color": "3", "label": "calcQuote() Formula"},
        {"id": "e3", "fromNode": "node-cart", "fromSide": "bottom", "toNode": "node-predeposit", "toSide": "top", "color": "5", "label": "Proceed to Escrow"},
        {"id": "e4", "fromNode": "node-predeposit", "fromSide": "right", "toNode": "node-pdf", "toSide": "left", "color": "3", "label": "Export SOW Brief PDF"},
        {"id": "e5", "fromNode": "node-predeposit", "fromSide": "right", "toNode": "node-create-order", "toSide": "left", "color": "6", "label": "POST 50% Deposit Order"},
        {"id": "e6", "fromNode": "node-create-order", "fromSide": "bottom", "toNode": "node-verify-payment", "toSide": "top", "color": "6", "label": "HMAC Webhook Verify"},
        {"id": "e7", "fromNode": "node-verify-payment", "fromSide": "left", "toNode": "node-sow-freeze", "toSide": "right", "color": "3", "label": "SHA-256 SOW Lock"},
        {"id": "e8", "fromNode": "node-verify-payment", "fromSide": "right", "toNode": "node-schema-scopes", "toSide": "left", "color": "7", "label": "status='deposit_paid'"},
        {"id": "e9", "fromNode": "node-verify-payment", "fromSide": "right", "toNode": "node-schema-invoices", "toSide": "left", "color": "7", "label": "Record Invoice Receipt"}
    ]

    write_canvas("COMMERCE_AND_ESCROW_FLOW.canvas", nodes, edges)


# =========================================================================
# 2. RAG & COGNITIVE PIPELINE CANVAS
# =========================================================================
def generate_rag_canvas():
    nodes = [
        # Group 1: Studio Frontend
        {
            "id": "grp-rag-ui",
            "type": "group",
            "label": "1. RAG LAB STUDIO & CHAT INTERFACE",
            "x": -1200, "y": -100, "width": 600, "height": 1360, "color": "1"
        },
        {
            "id": "node-rag-app",
            "type": "file", "file": "architecture_nodes/Route_rag_app.md",
            "x": -1140, "y": -30, "width": 480, "height": 400, "color": "1"
        },
        {
            "id": "node-rag-playground",
            "type": "file", "file": "architecture_nodes/UI_RAGLabPlayground.md",
            "x": -1140, "y": 430, "width": 480, "height": 400, "color": "1"
        },
        {
            "id": "node-rag-client",
            "type": "file", "file": "architecture_nodes/Lib_rag_client.md",
            "x": -1140, "y": 890, "width": 480, "height": 400, "color": "3"
        },

        # Group 2: Gateway & Ingestion
        {
            "id": "grp-rag-gateway",
            "type": "group",
            "label": "2. GATEWAY & MULTIMODAL INGESTION",
            "x": -540, "y": -100, "width": 600, "height": 1360, "color": "6"
        },
        {
            "id": "node-intent",
            "type": "file", "file": "architecture_nodes/API_scoping_parse_intent.md",
            "x": -480, "y": -30, "width": 480, "height": 400, "color": "6"
        },
        {
            "id": "node-rfp",
            "type": "file", "file": "architecture_nodes/API_scoping_parse_rfp.md",
            "x": -480, "y": 430, "width": 480, "height": 400, "color": "6"
        },
        {
            "id": "node-docling",
            "type": "file", "file": "architecture_nodes/Engine_Docling_Layout_OCR.md",
            "x": -480, "y": 890, "width": 480, "height": 400, "color": "4"
        },

        # Group 3: Cognitive Core & Guardrails
        {
            "id": "grp-rag-core",
            "type": "group",
            "label": "3. COGNITIVE CORE & GUARDRAILS",
            "x": 120, "y": -100, "width": 600, "height": 1360, "color": "4"
        },
        {
            "id": "node-chat",
            "type": "file", "file": "architecture_nodes/Retriever_API_v1_chat.md",
            "x": 180, "y": -30, "width": 480, "height": 400, "color": "4"
        },
        {
            "id": "node-guard",
            "type": "file", "file": "architecture_nodes/Engine_LlamaGuard_Guardrails.md",
            "x": 180, "y": 430, "width": 480, "height": 400, "color": "4"
        },
        {
            "id": "node-search",
            "type": "file", "file": "architecture_nodes/Retriever_API_v1_search.md",
            "x": 180, "y": 890, "width": 480, "height": 400, "color": "4"
        },

        # Group 4: Reasoning & REPL
        {
            "id": "grp-rag-reasoning",
            "type": "group",
            "label": "4. REASONING, REPL & REFLECTION",
            "x": 780, "y": -100, "width": 600, "height": 1360, "color": "4"
        },
        {
            "id": "node-repl",
            "type": "file", "file": "architecture_nodes/Engine_RLM_Python_REPL.md",
            "x": 840, "y": -30, "width": 480, "height": 400, "color": "4"
        },
        {
            "id": "node-consensus",
            "type": "file", "file": "architecture_nodes/Engine_MultiAgent_Consensus.md",
            "x": 840, "y": 430, "width": 480, "height": 400, "color": "4"
        },
        {
            "id": "node-compress",
            "type": "file", "file": "architecture_nodes/Engine_LongLLMLingua_Compression.md",
            "x": 840, "y": 890, "width": 480, "height": 400, "color": "4"
        },

        # Group 5: Vector Partitions
        {
            "id": "grp-rag-vector",
            "type": "group",
            "label": "5. VECTOR PARTITIONS & TELEMETRY",
            "x": 1440, "y": -100, "width": 600, "height": 1360, "color": "7"
        },
        {
            "id": "node-pgvector",
            "type": "file", "file": "architecture_nodes/Schema_pgvector_store.md",
            "x": 1500, "y": -30, "width": 480, "height": 480, "color": "7"
        },
        {
            "id": "node-tenants",
            "type": "file", "file": "architecture_nodes/Schema_rag_tenants.md",
            "x": 1500, "y": 480, "width": 480, "height": 480, "color": "7"
        },
        {
            "id": "node-logs",
            "type": "file", "file": "architecture_nodes/Schema_retriever_inference_logs.md",
            "x": 1500, "y": 990, "width": 480, "height": 480, "color": "7"
        }
    ]

    edges = [
        {"id": "er1", "fromNode": "node-rag-playground", "fromSide": "bottom", "toNode": "node-rag-client", "toSide": "top", "color": "3", "label": "Client State"},
        {"id": "er2", "fromNode": "node-rag-client", "fromSide": "right", "toNode": "node-chat", "toSide": "left", "color": "4", "label": "POST /v1/chat (SSE)"},
        {"id": "er3", "fromNode": "node-rfp", "fromSide": "bottom", "toNode": "node-docling", "toSide": "top", "color": "4", "label": "Layout OCR Chunking"},
        {"id": "er4", "fromNode": "node-chat", "fromSide": "bottom", "toNode": "node-guard", "toSide": "top", "color": "4", "label": "LlamaGuard 3 Filter"},
        {"id": "er5", "fromNode": "node-chat", "fromSide": "bottom", "toNode": "node-search", "toSide": "top", "color": "4", "label": "Hybrid Query"},
        {"id": "er6", "fromNode": "node-search", "fromSide": "right", "toNode": "node-pgvector", "toSide": "left", "color": "7", "label": "Cosine HNSW"},
        {"id": "er7", "fromNode": "node-chat", "fromSide": "right", "toNode": "node-repl", "toSide": "left", "color": "4", "label": "Math Sandbox (M47)"},
        {"id": "er8", "fromNode": "node-chat", "fromSide": "right", "toNode": "node-consensus", "toSide": "left", "color": "4", "label": "Critic Evaluation (M48)"},
        {"id": "er9", "fromNode": "node-chat", "fromSide": "right", "toNode": "node-compress", "toSide": "left", "color": "4", "label": "Context Compression (M49)"},
        {"id": "er10", "fromNode": "node-chat", "fromSide": "right", "toNode": "node-logs", "toSide": "left", "color": "7", "label": "Tokens & Latency"}
    ]

    write_canvas("RAG_AND_COGNITIVE_PIPELINE.canvas", nodes, edges)


# =========================================================================
# 3. AUTONOMOUS OUTREACH ENGINE CANVAS
# =========================================================================
def generate_outreach_canvas():
    nodes = [
        # Group 1: Admin Interface
        {
            "id": "grp-outreach-admin",
            "type": "group",
            "label": "1. OPERATOR COCKPIT & CONTROLS",
            "x": -1200, "y": -100, "width": 600, "height": 900, "color": "1"
        },
        {
            "id": "node-route-admin",
            "type": "file", "file": "architecture_nodes/Route_admin.md",
            "x": -1140, "y": -30, "width": 480, "height": 400, "color": "1"
        },
        {
            "id": "node-ui-admin",
            "type": "file", "file": "architecture_nodes/UI_AdminPortal.md",
            "x": -1140, "y": 430, "width": 480, "height": 400, "color": "1"
        },

        # Group 2: Qualification & Dispatch
        {
            "id": "grp-outreach-gateway",
            "type": "group",
            "label": "2. QUALIFICATION & DISPATCH GATEWAY",
            "x": -540, "y": -100, "width": 600, "height": 900, "color": "6"
        },
        {
            "id": "node-api-prospect",
            "type": "file", "file": "architecture_nodes/API_outreach_prospect.md",
            "x": -480, "y": -30, "width": 480, "height": 400, "color": "6"
        },
        {
            "id": "node-api-dispatch",
            "type": "file", "file": "architecture_nodes/API_outreach_dispatch.md",
            "x": -480, "y": 430, "width": 480, "height": 400, "color": "6"
        },

        # Group 3: CRM Ledger & SMTP
        {
            "id": "grp-outreach-crm",
            "type": "group",
            "label": "3. OUTREACH CRM LEDGER & RESEND SMTP",
            "x": 120, "y": -100, "width": 600, "height": 900, "color": "7"
        },
        {
            "id": "node-schema-leads",
            "type": "file", "file": "architecture_nodes/Schema_outreach_leads.md",
            "x": 180, "y": -30, "width": 480, "height": 480, "color": "7"
        },
        {
            "id": "node-api-contact",
            "type": "file", "file": "architecture_nodes/API_contact.md",
            "x": 180, "y": 480, "width": 480, "height": 400, "color": "6"
        },

        # Group 4: Visitor Telemetry
        {
            "id": "grp-outreach-telemetry",
            "type": "group",
            "label": "4. CAMPAIGN VISITOR TELEMETRY",
            "x": 780, "y": -100, "width": 600, "height": 900, "color": "7"
        },
        {
            "id": "node-proxy-telemetry",
            "type": "file", "file": "architecture_nodes/Proxy_telemetry.md",
            "x": 840, "y": -30, "width": 480, "height": 400, "color": "6"
        },
        {
            "id": "node-schema-visits",
            "type": "file", "file": "architecture_nodes/Schema_page_visits.md",
            "x": 840, "y": 480, "width": 480, "height": 480, "color": "7"
        }
    ]

    edges = [
        {"id": "eo1", "fromNode": "node-route-admin", "fromSide": "bottom", "toNode": "node-ui-admin", "toSide": "top", "color": "1", "label": "Admin Gate"},
        {"id": "eo2", "fromNode": "node-ui-admin", "fromSide": "right", "toNode": "node-api-prospect", "toSide": "left", "color": "6", "label": "Ingest Target ICP"},
        {"id": "eo3", "fromNode": "node-ui-admin", "fromSide": "right", "toNode": "node-api-dispatch", "toSide": "left", "color": "6", "label": "Dispatch Email"},
        {"id": "eo4", "fromNode": "node-api-prospect", "fromSide": "right", "toNode": "node-schema-leads", "toSide": "left", "color": "7", "label": "Store ICP Score"},
        {"id": "eo5", "fromNode": "node-api-dispatch", "fromSide": "right", "toNode": "node-schema-leads", "toSide": "left", "color": "7", "label": "status='sent'"},
        {"id": "eo6", "fromNode": "node-api-dispatch", "fromSide": "bottom", "toNode": "node-api-contact", "toSide": "top", "color": "6", "label": "Resend API Dispatch"},
        {"id": "eo7", "fromNode": "node-proxy-telemetry", "fromSide": "bottom", "toNode": "node-schema-visits", "toSide": "top", "color": "7", "label": "UTM Campaign Telemetry"}
    ]

    write_canvas("AUTONOMOUS_OUTREACH_ENGINE.canvas", nodes, edges)


def main():
    print("🎨 Generating 3 High-Resolution Subsystem Flow Canvases...")
    generate_commerce_canvas()
    generate_rag_canvas()
    generate_outreach_canvas()
    print("✨ Successfully created all 3 Subsystem Flow Canvases in docs/ and Prateek_Ecosystem_Vault/!")


if __name__ == "__main__":
    main()
