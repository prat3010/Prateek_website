# **16. Retriever AI Product Landing Page (`/rag`)**

## **Purpose**

The **Retriever Product Landing Page** (`/rag`) is the dedicated commercial showcase and acquisition surface for the Retriever Cognitive Engine, demonstrating its 100+ model smart routing, zero-hallucination citations, and enterprise RAG capabilities.

---

## **Key Capabilities & User Flows**

1. **Hero & Value Proposition**:
   - Compelling value proposition highlighting production-grade RAG, sub-second latency, and multi-tenant pgvector architecture.
   - Dynamic 1-line script embed tag (`<script src="https://rag.prateeq.in/widget.js" ...></script>`) for instant zero-code website integration.

2. **Live Interactive Mini-RAG Playground**:
   - Real-time chat sandbox connected to the live backend engine (`https://rag.prateeq.in/v1/chat`).
   - Supports streaming SSE tokens, verified sentence citations (`citedChunkIds`), and semantic cache speedups.

3. **Dynamic Geo-IP Multi-Currency Pricing Table**:
   - Reads `x-vercel-ip-country` header to dynamically toggle between Indian Rupee (₹ INR) for Indian visitors and US Dollars ($ USD) for international visitors.
   - Tier selection: **Starter Trial** (7-day full access), **Growth**, and **Enterprise Dedicated**.
   - Direct integration with Razorpay Subscription checkout and 1-click Google OAuth workspace creation.

4. **Technical Architecture Comparison Grid**:
   - Side-by-side comparison matrix: Retriever vs Generic LangChain wrappers vs Traditional Vector DBs.
   - Highlights GraphRAG, hybrid search fusion, Microsoft Presidio PII redaction, and local-first embedding isolation.
