"""Retriever System Memory Query Helper for Synchronizer.

Queries indexed codebase ASTs, documentation, git logs, and ADR decisions from
Supabase System Tenant `00000000-0000-0000-0000-000000000000`.
Uses standard library urllib for zero external dependency execution.
"""

import hashlib
import json
import logging
import os
import urllib.request
import urllib.parse
from typing import Any

logger = logging.getLogger("retriever_query")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://osaqaemntuzrjouzobvx.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SYSTEM_TENANT_ID = "00000000-0000-0000-0000-000000000000"


def generate_fallback_embedding(text: str, dim: int = 768) -> list[float]:
    """Generate a deterministic 768-dim float vector if Ollama is unavailable."""
    vector = [0.0] * dim
    hash_bytes = hashlib.sha256(text.encode("utf-8")).digest()
    for i in range(dim):
        b = hash_bytes[i % len(hash_bytes)]
        vector[i] = (float(b) / 255.0) * 2.0 - 1.0
    norm = sum(v * v for v in vector) ** 0.5
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector


def query_system_memory(query: str, top_k: int = 5) -> list[dict[str, Any]]:
    """Query Supabase system tenant memory for codebase ASTs, ADRs, and git history matching query."""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

    results: list[dict[str, Any]] = []
    
    try:
        url = f"{SUPABASE_URL}/rest/v1/document_chunks?tenant_id=eq.{SYSTEM_TENANT_ID}&select=chunk_id,content,meta_data&limit=500"
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                data = response.read().decode("utf-8")
                chunks = json.loads(data)
                
                if not chunks:
                    return []

                query_words = set(query.lower().split())
                scored_chunks = []

                for ch in chunks:
                    content = ch.get("content", "")
                    content_lower = content.lower()
                    meta = ch.get("meta_data", {})
                    file_path = meta.get("file_path", "").lower()

                    match_count = sum(1 for w in query_words if w in content_lower or w in file_path)
                    if match_count > 0:
                        scored_chunks.append({
                            "chunk_id": ch.get("chunk_id"),
                            "content": content,
                            "meta_data": meta,
                            "score": match_count,
                        })

                scored_chunks.sort(key=lambda x: x["score"], reverse=True)
                results = scored_chunks[:top_k]

    except Exception as err:
        logger.error("Error querying system memory: %s", err)

    return results


def format_evidence_block(results: list[dict[str, Any]]) -> str:
    """Format query results into a structured markdown evidence context block for LLM prompts."""
    if not results:
        return ""

    blocks = ["### 🧠 Codebase & Architecture Evidence (Retriever Vector Memory):"]
    for idx, item in enumerate(results, 1):
        meta = item.get("meta_data", {})
        file_path = meta.get("file_path", "Unknown File")
        symbol_name = meta.get("symbol_name", "")
        repo = meta.get("repository", "retriever")
        content = item.get("content", "").strip()

        header = f"**[{idx}] Repository: {repo} | File: `{file_path}`**"
        if symbol_name:
            header += f" | Symbol: `{symbol_name}`"

        blocks.append(f"{header}\n```\n{content}\n```\n")

    return "\n\n".join(blocks)


if __name__ == "__main__":
    test_results = query_system_memory("proxy telemetry country")
    print(f"Retrieved {len(test_results)} results for test query.")
    print(format_evidence_block(test_results))
