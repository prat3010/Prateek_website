---
title: "Architecting a Hybrid Cloud RAG Engine on OCI & Edge"
date: "2026-08-29"
excerpt: "How decoupling Vercel Edge UI from an OCI Mumbai compute plane cut AI costs by 85% while delivering sub-100ms latency and zero-trust security."
tags: ["DevOps", "Cloud Architecture", "FastAPI", "Oracle Cloud", "Nginx", "RAG"]
coverImage: "/images/projects/retriever.jpg"
---

Scaling multi-tenant Retrieval-Augmented Generation (RAG) platforms introduces a harsh infrastructure reality: serverless execution timeouts and runaway embedding API fees will crush your budget. Standard serverless edge functions cap execution at 15 to 30 seconds, breaking under multi-hop GraphRAG traversals, recursive document summarization, and long-lived Server-Sent Events (SSE) streaming pipelines.

To solve these constraints for **Retriever**—an AI Cognitive Memory platform—I designed a hybrid multi-cloud topology that decouples stateless presentation from compute-intensive RAG tasks.

---

## The Architectural Blueprint

The infrastructure splits platform duties across two specialized environments:

1. **Edge UI Control Plane**: Deployed on Vercel's Global CDN (`prateeq.in`), serving Next.js App Router frontends with fast Server-Side Rendering (SSR) and global static asset caching.
2. **Heavy AI Compute Plane**: Hosted on an Oracle Cloud Infrastructure (OCI) dedicated compute instance in India West (Mumbai). This Ubuntu 24.04 LTS instance runs local embedding generation, vector routing, and core business logic.

```
[ Client / Edge ] ---> (HTTPS / SSR) ---> [ Vercel Global CDN ]
[ Client / Edge ] ---> (REST / SSE)  ---> [ OCI VCN Mumbai (Nginx -> FastAPI -> Ollama) ]
                                                    |
                                            [ Supabase pgvector ]
```

---

## Cloud Networking & Ingress Hardening

Exposing compute instances directly to public IP addresses invites automated scans and brute-force vectors. We isolate the application inside an OCI Virtual Cloud Network (VCN) using a `10.0.0.0/16` CIDR block.

Strict OCI Security Lists restrict inbound traffic exclusively to:
- **Port 443 (HTTPS)**: Production API traffic.
- **Port 80 (HTTP)**: Automated ACME Let's Encrypt domain validation.
- **Port 22 (SSH)**: Restrictive administrative access.

Internal services—including the Ollama vector engine (port `11434`), FastAPI/Uvicorn daemon (port `8000`), and PostgreSQL instances—are bound strictly to `127.0.0.1` (loopback) and protected by UFW.

### Production Nginx Reverse Proxy Configuration

Nginx 1.24.0 handles TLS 1.3 termination, HTTP/2 multiplexing, security headers, and proxy buffering toggles for SSE streams:

```nginx
server {
    listen 443 ssl http2;
    server_name rag.prateeq.in;

    ssl_certificate /etc/letsencrypt/live/rag.prateeq.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rag.prateeq.in/privkey.pem;
    ssl_protocols TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Defense-in-Depth Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self';" always;

    # Streaming SSE Optimization
    location /api/v1/stream {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable proxy buffering for real-time tokens
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## SRE & Self-Healing Reliability

Systemd supervises the FastAPI daemon with strict restart policies (`Restart=always`, `RestartSec=5s`). To prevent routing traffic to degraded nodes, the system implements dual-tier health probes.

- `/health/liveness`: Confirms web server execution.
- `/health/readiness`: Probes downstream services (PostgreSQL via Supabase and Redis caching) before acknowledging ready state.

### FastAPI Health Probe Implementation

```python
from fastapi import FastAPI, HTTPException, status
import asyncpg
import redis.asyncio as aioredis

app = FastAPI(title="Retriever Core Engine")

@app.get("/health/liveness", status_code=status.HTTP_200_OK)
async def liveness_probe():
    return {"status": "alive", "environment": "production"}

@app.get("/health/readiness", status_code=status.HTTP_200_OK)
async def readiness_probe():
    # Verify DB connectivity
    try:
        db_conn = await asyncpg.connect("postgresql://user:pass@supabase-host:5432/db")
        await db_conn.execute("SELECT 1")
        await db_conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB readiness failed: {str(e)}")

    # Verify Redis connectivity
    try:
        r = aioredis.from_url("redis://127.0.0.1:6379")
        await r.ping()
        await r.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Redis readiness failed: {str(e)}")

    return {"status": "ready", "services": {"database": "ok", "redis": "ok"}}
```

---

## Cost & Performance Payoff

Running local embedding generation (`nomic-embed-text` on Ollama) on the dedicated OCI instance eliminated external API costs for document chunking, driving an **~85% cost reduction** compared to purely serverless LLM stacks.

Locating compute in the Mumbai datacenter adjacent to users in APAC yielded **sub-100ms P95 latency** for core REST operations while eliminating serverless timeout limits.

Test the live system architecture in the [Retriever SaaS Lab](/rag), or scope your custom multi-cloud setup with the [Instant Project Scoping Lab](/scoping?engine=saas).
