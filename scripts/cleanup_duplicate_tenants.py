#!/usr/bin/env python3
"""
Cleanup Script: Deactivate Duplicate Demo Tenants in Retriever RAG
"""

import os
import sys
import json
import urllib.request

API_BASE = sys.argv[1] if len(sys.argv) > 1 else os.getenv("API_BASE", "https://rag.prateeq.in")
ADMIN_KEY = sys.argv[2] if len(sys.argv) > 2 else os.getenv("ADMIN_MASTER_KEY", "2f4a1713e6a2526f51e7e6b7825689509c9071e0b61fa59a5804ccfdbdafd266")

HEADERS = {"X-Admin-Master-Key": ADMIN_KEY}

def make_request(url, method="GET", json_data=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(json_data).encode("utf-8") if json_data else None,
        headers={"X-Admin-Master-Key": ADMIN_KEY, "Content-Type": "application/json"},
        method=method
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except Exception as e:
        return 500, {"error": str(e)}

def main():
    print("🧹 Fetching all tenants from Retriever RAG...", flush=True)
    code, data = make_request(f"{API_BASE}/v1/admin/tenants?limit=100")
    if code != 200:
        print(f"❌ Failed to fetch tenants: {code} - {data}", flush=True)
        return

    items = data.get("items", [])
    print(f"Found {len(items)} total tenant records.\n", flush=True)

    seen_names = set()
    to_keep = []
    to_deactivate = []

    for item in items:
        name = item.get("name")
        tenant_id = item.get("tenantId")
        if name == "System-Meta-Tenant":
            to_keep.append(item)
            continue

        if name not in seen_names:
            seen_names.add(name)
            to_keep.append(item)
        else:
            to_deactivate.append(item)

    print(f"Keeping {len(to_keep)} unique tenants.", flush=True)
    print(f"Deactivating {len(to_deactivate)} duplicate tenants...\n", flush=True)

    for item in to_deactivate:
        t_id = item.get("tenantId")
        t_name = item.get("name")
        print(f"🗑️ Deactivating duplicate '{t_name}' ({t_id})...", flush=True)
        code, res = make_request(f"{API_BASE}/v1/admin/tenants/{t_id}", method="DELETE")
        if code == 200:
            print(f"   ✅ Deactivated", flush=True)
        else:
            print(f"   ⚠️ Status {code}: {res}", flush=True)

    print("\n🎉 Cleanup Complete! Unique tenants remaining:", flush=True)
    for k in to_keep:
        print(f"   • {k.get('name')} ({k.get('tenantId')})", flush=True)

if __name__ == "__main__":
    main()
