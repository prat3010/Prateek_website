# PRD 34 — Multimodal Vision GraphRAG & Architectural Schematic Ingestion Engine

> **Document ID:** `PRD-34`  
> **Status:** Implemented & Verified  
> **Target Milestone:** Milestone 113 (v1.3.0-alpha1)  
> **Platform Battery:** Battery #29 (`multimodal_vision_graphrag` under `COMPUTATION_GRAPH`)  
> **Quality Gate:** Gate 10 Zero-Toy Static AST Verified (0 Mocks, 100% Genuine Algorithmic Execution)  
> **Applicable Workspaces:** `retriever` (Cognitive Backend & SDKs) and `Prateek_website` (Control Plane SaaS Studio)

---

## 1. Executive Summary & Objective

Standard Retrieval-Augmented Generation (RAG) pipelines treat ingested documents purely as 1D textual sequences. When technical systems documentation, enterprise architecture blueprints, cloud infrastructure diagrams, or microservice sequence charts are ingested, flattening them to plain OCR completely destroys their spatial layout, directional connectivity, communication protocols, and visual topology.

**PRD-34 establishes Battery #29 (`multimodal_vision_graphrag`)**:
1. **Architectural Schematic Parser:** Domain-driven engine extracting architectural components, layout geometry, directional connectors, and communication protocols (`HTTPS POST`, `gRPC`, `SQL`, `AMQP`) directly from SVG XML and image blueprints.
2. **Normalized Bounding-Box Primitives:** Strict spatial coordinate validation ensuring all bounding boxes lie in the normalized $[0.0, 1.0]$ range ($y_{\min} < y_{\max}, x_{\min} < x_{\max}$) with exact geometric Intersection-over-Union ($\text{IoU}$).
3. **Architectural Ontology Classifier:** Component classification into first-class system types (`api_gateway`, `database`, `microservice`, `queue`, `client_app`, `cache`, `storage`, `auth_service`).
4. **Cross-Modal Knowledge Graph Traversal:** Multi-hop graph search linking visual layout components to document text chunks, producing verifiable visual diagram citations (`[Schematic: ... | Box: ... | "..."]`).
5. **Interactive Studio Lightbox:** Responsive `<Portal>` inspection modal in `ChatPanel.tsx` rendering animated bounding-box highlights over blueprint viewports with strict Design System 2.0 dual-theme parity.

---

## 2. End-to-End Architecture & Dataflow

```mermaid
flowchart TD
    subgraph ClientAndUI ["Client Control Plane (Prateek_website)"]
        Chat[ChatPanel.tsx RAG Studio]
        Badge[Interactive Schematic Badge 📐]
        Lightbox[Visual Lightbox Modal in <Portal>]
        TSClient[@prat3010/retriever-client]
    end

    subgraph FastAPIRouters ["Cognitive API (rag.prateeq.in)"]
        VExtract["POST /v1/tenants/{id}/vision/schematic/extract"]
        VExtractText["POST /v1/tenants/{id}/vision/schematic/extract-text"]
        VQuery["POST /v1/tenants/{id}/vision/graph/query"]
        VSchematics["GET /v1/tenants/{id}/vision/schematics/{docId}"]
        VStatus["GET /v1/graph/multimodal/status"]
    end

    subgraph HexagonalCore ["Retriever Cognitive Engine"]
        Adapter[VisionParserAdapter]
        Extractor[SchematicExtractor]
        Classifier[Architectural Ontology Engine]
        GraphService[MultimodalGraphService]
        BatteryService[Battery #29 Registration]
    end

    Chat --> TSClient
    TSClient --> VExtractText
    TSClient --> VQuery
    VExtractText --> Adapter
    VQuery --> GraphService
    Adapter --> Extractor
    Extractor --> Classifier
    Classifier --> GraphService
    GraphService --> BatteryService

    Chat --> Badge
    Badge -.->|Click| Lightbox
```

---

## 3. Mathematical & Geometric Invariants

### 3.1 Normalized Bounding Box Coordinate Space
All visual elements MUST be located using normalized float coordinates relative to image width and height:
$$\text{coords} = [y_{\min}, x_{\min}, y_{\max}, x_{\max}]$$
Subject to strict boundary invariants enforced at instantiation:
$$0.0 \le y_{\min} < y_{\max} \le 1.0$$
$$0.0 \le x_{\min} < x_{\max} \le 1.0$$

Any coordinate outside $[0.0, 1.0]$ or where $y_{\min} \ge y_{\max}$ or $x_{\min} \ge x_{\max}$ raises a `ValueError`.

### 3.2 Authentic Intersection-over-Union (IoU)
Overlap and duplicate suppression use genuine geometric $\text{IoU}$ without synthetic approximations:
$$\text{IoU}(A, B) = \frac{\text{Area}(A \cap B)}{\text{Area}(A \cup B)} = \frac{\max(0, \min(A.y_2, B.y_2) - \max(A.y_1, B.y_1)) \times \max(0, \min(A.x_2, B.x_2) - \max(A.x_1, B.x_1))}{\text{Area}(A) + \text{Area}(B) - \text{Area}(A \cap B)}$$

---

## 4. Architectural Ontology & Component Taxonomy

The domain classifier (`SchematicExtractor`) maps visual components into typed architectural primitives:

| Component Type | Canonical Keywords | Default Ontology Role |
|:---|:---|:---|
| `api_gateway` | `gateway`, `ingress`, `proxy`, `router`, `nginx`, `envoy`, `traefik` | Edge Ingress & Reverse Proxy |
| `database` | `db`, `database`, `postgres`, `mysql`, `mongo`, `dynamo`, `cockroach` | Persistent System of Record |
| `microservice` | `service`, `worker`, `backend`, `api`, `server`, `processor` | Domain Compute & Processing |
| `queue` | `queue`, `kafka`, `rabbitmq`, `sqs`, `pubsub`, `event bus` | Asynchronous Messaging & Event Streams |
| `client_app` | `client`, `web`, `app`, `ui`, `mobile`, `frontend`, `browser` | User-Facing Interface |
| `cache` | `cache`, `redis`, `memcached` | Low-Latency Ephemeral Storage |
| `storage` | `s3`, `blob`, `bucket`, `storage`, `r2` | Unstructured Object Storage |
| `auth_service` | `auth`, `cognito`, `keycloak`, `iam`, `oauth`, `identity` | Identity & Access Control |

---

## 5. Directional Connector & Protocol Parsing

Connectors link source components to target components with directional flow and protocol tags:
- **Mermaid / Flowchart Line Patterns:** `[Client App] -->|HTTPS POST| [API Gateway]`
- **SVG Path Analysis:** Markers (`orient="auto"`, `marker-end="url(#arrow)"`), line endpoints $(x_1, y_1) \to (x_2, y_2)$, and proximate text nodes.
- **Protocol Annotations:** `HTTPS POST`, `gRPC`, `SQL`, `AMQP`, `WebSocket`, `Kafka Topic`.

---

## 6. Visual Citation Contract & Lightbox UI (Design System 2.0)

### 6.1 Citation Syntax
Completions emit structured multimodal visual citations:
```text
[Schematic: Architecture.svg | Box: 0.15,0.20,0.35,0.40 | "API Gateway"]
```
or without box when referencing whole diagrams:
```text
[Schematic: Architecture.svg | "Payment Gateway"]
```

### 6.2 Control Plane Lightbox Modal (`ChatPanel.tsx`)
- **Containing Block Escaping:** Wrapped inside `<Portal>` (`src/components/ui/Portal.tsx`) to escape Framer Motion `ScrollSection` containing block traps (`translateY` / `will-change: transform`).
- **Interactive Viewport:** Renders blueprint grid background and places the glowing cyan bounding-box overlay at:
  - `top: ${box[0] * 100}%`
  - `left: ${box[1] * 100}%`
  - `width: ${(box[3] - box[1]) * 100}%`
  - `height: ${(box[2] - box[0]) * 100}%`
- **Accessibility & Focus:** Supports keyboard `Escape` dismissal, focus trapping, and ARIA dialog roles.
- **Dual-Theme Parity:** Uses semantic CSS tokens (`--surface-card`, `--surface-elevated`, `--color-text`, `--color-brand-cyan`, `--pop-green`) with zero hardcoded dark hex colors.

---

## 7. Decoupled SDKs

### TypeScript Client SDK (`@prat3010/retriever-client`)
```typescript
import { RetrieverClient } from "@prat3010/retriever-client";

const client = new RetrieverClient({ apiKey: "ret_live_...", tenantId: "tn_..." });

// Extract schematic layout
const diagram = await client.extractSchematicText(svgContent, "architecture.svg");

// Multi-hop multimodal GraphRAG query
const graphResponse = await client.queryMultimodalGraph("API Gateway", 2);

// Retrieve all visual triples for a document
const schematics = await client.getDocumentSchematics("doc_123");
```

### Python Client SDK (`retriever-python`)
```python
from retriever import RetrieverClient

client = RetrieverClient(api_key="ret_live_...", tenant_id="tn_...")

# Synchronous
diagram = client.extract_schematic_text(svg_content, filename="arch.svg")
response = client.query_multimodal_graph("Database", max_hops=2)

# Asynchronous
async with client:
    async_response = await client.aquery_multimodal_graph("API Gateway")
```

---

## 8. Verification & Quality Gates

1. **Unit & Integration Tests (`retriever`):**
   - `apps/api/tests/test_multimodal_vision_graphrag.py`: 11/11 tests passed.
   - `apps/api/tests/test_batteries.py`: 8/8 tests passed (Battery #29 registered).
   - `packages/retriever-python/tests/test_client.py`: 6/6 tests passed.
2. **Hexagonal Architecture Conformance:** `apps/api/tests/test_architecture.py` passed (0 framework leaks).
3. **Zero-Toy AST Audit (`retriever`):** `scripts/audit_zero_toy.py` scanned 314 production Python files with 0 violations.
4. **Control Plane 10-Gate Verification (`Prateek_website`):** `./scripts/verify.sh` passed all 10 gates (TypeScript, vitest, knip, portal safety, secrets, contracts, zero-toy).

---

## 🔗 Related Architecture & Cross-References
- [UNIFIED_MASTER_ROADMAP.md](UNIFIED_MASTER_ROADMAP.md#milestone-113-multimodal-vision-graphrag--schematic-ingestion-v130-alpha1)
- [00_DOCUMENTATION_MAP.md](00_DOCUMENTATION_MAP.md)
- [RAG SaaS Studio PRD](24_RAG_App_Studio_PRD.md)
- [Retriever Deep-Dive: Multimodal Vision GraphRAG](../../retriever/docs/cognitive/multimodal_vision_graphrag.md)
