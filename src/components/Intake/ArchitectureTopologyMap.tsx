'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Network,
  Maximize2,
  Minimize2,
  Layers,
  Zap,
  Plus,
  X,
} from 'lucide-react';
import Portal from '@/components/ui/Portal';
import type { BaseEngineItem, FeatureItem } from '@/data/resume';
import type { Currency } from '@/lib/pricing';

import styles from './ArchitectureTopologyMap.module.css';

export interface TopologyNode {
  id: string;
  featureId?: string;
  tierId: 'client' | 'edge' | 'core' | 'data' | 'ai' | 'integrations';
  title: string;
  subtitle: string;
  specs: string;
  slaInfo: string;
  isAlwaysActive?: boolean;
  activeWhenEngine?: string[];
  activeWhenFeature?: string[];
}

export interface ArchitectureTopologyMapProps {
  selectedEngineId: string;
  selectedFeatureIds: string[];
  allEngines: BaseEngineItem[];
  allFeatures: FeatureItem[];
  currency?: Currency;
  onAddFeature?: (featureId: string) => void;
  isNoir?: boolean;
}


const TOPOLOGY_TIERS = [
  { id: 'client', label: '1. Client & Presentation Layer' },
  { id: 'edge', label: '2. Edge Gateway & Security Layer' },
  { id: 'core', label: '3. Core Application Services' },
  { id: 'data', label: '4. Data & Vector Storage Layer' },
  { id: 'ai', label: '5. Cognitive AI Engine' },
  { id: 'integrations', label: '6. Integrations & Commerce' },
] as const;

export interface TopologyConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const NODE_POSITIONS: Record<string, NodePosition> = {
  // Tier 1: Client
  node_web: { x: 30, y: 65, width: 115, height: 64 },
  node_pwa: { x: 30, y: 145, width: 115, height: 64 },
  node_terminal: { x: 30, y: 225, width: 115, height: 64 },

  // Tier 2: Edge Security
  node_waf: { x: 185, y: 65, width: 115, height: 64 },
  node_recaptcha: { x: 185, y: 145, width: 115, height: 64 },

  // Tier 3: Core Services
  node_server_actions: { x: 340, y: 65, width: 115, height: 64 },
  node_auth: { x: 340, y: 145, width: 115, height: 64 },
  node_admin: { x: 340, y: 225, width: 115, height: 64 },
  node_cms: { x: 340, y: 305, width: 115, height: 64 },
  node_booking: { x: 340, y: 385, width: 115, height: 64 },

  // Tier 4: Data & Vector Storage
  node_postgres: { x: 505, y: 65, width: 115, height: 64 },
  node_pgvector: { x: 505, y: 145, width: 115, height: 64 },
  node_cache: { x: 505, y: 225, width: 115, height: 64 },

  // Tier 5: Cognitive AI
  node_retriever_rag: { x: 665, y: 65, width: 115, height: 64 },
  node_docling_ocr: { x: 665, y: 145, width: 115, height: 64 },
  node_ai_agents: { x: 665, y: 225, width: 115, height: 64 },
  node_graphrag: { x: 665, y: 305, width: 115, height: 64 },

  // Tier 6: Integrations & Commerce
  node_razorpay: { x: 825, y: 65, width: 115, height: 64 },
  node_resend: { x: 825, y: 145, width: 115, height: 64 },
  node_telemetry: { x: 825, y: 225, width: 115, height: 64 },
};

export function calculateBezierCircuitPath(fromPos: NodePosition, toPos: NodePosition): string {
  // If source and target are in the same tier column, route via an outward bracket arc in the gutter
  if (fromPos.x === toPos.x) {
    const x1 = fromPos.x + fromPos.width;
    const y1 = fromPos.y + fromPos.height / 2;
    const x2 = toPos.x + toPos.width;
    const y2 = toPos.y + toPos.height / 2;
    const arcOffset = 25;
    const cx1 = x1 + arcOffset;
    const cy1 = y1;
    const cx2 = x2 + arcOffset;
    const cy2 = y2;
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  }

  // Inter-tier forward (left-to-right) routing
  if (toPos.x > fromPos.x) {
    const x1 = fromPos.x + fromPos.width;
    const y1 = fromPos.y + fromPos.height / 2;
    const x2 = toPos.x;
    const y2 = toPos.y + toPos.height / 2;
    const dx = x2 - x1;
    const cx1 = x1 + dx * 0.5;
    const cy1 = y1;
    const cx2 = x2 - dx * 0.5;
    const cy2 = y2;
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  }

  // Inter-tier reverse (right-to-left) routing
  const x1 = fromPos.x;
  const y1 = fromPos.y + fromPos.height / 2;
  const x2 = toPos.x + toPos.width;
  const y2 = toPos.y + toPos.height / 2;
  const dx = x1 - x2;
  const cx1 = x1 - dx * 0.5;
  const cy1 = y1;
  const cx2 = x2 + dx * 0.5;
  const cy2 = y2;
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

export const TOPOLOGY_CONNECTIONS: TopologyConnection[] = [
  // Tier 1 -> Tier 2 (Client -> Edge)
  { id: 'conn_web_waf', from: 'node_web', to: 'node_waf', label: 'HTTPS / TLS 1.3 Proxy' },
  { id: 'conn_pwa_waf', from: 'node_pwa', to: 'node_waf', label: 'Service Worker Sync' },
  { id: 'conn_terminal_waf', from: 'node_terminal', to: 'node_waf', label: 'CLI Remote RPC' },
  { id: 'conn_web_recaptcha', from: 'node_web', to: 'node_recaptcha', label: 'v3 Score Challenge' },

  // Tier 2 -> Tier 3 (Edge -> Core Services)
  { id: 'conn_waf_server_actions', from: 'node_waf', to: 'node_server_actions', label: 'Shielded Ingress' },
  { id: 'conn_waf_auth', from: 'node_waf', to: 'node_auth', label: 'OAuth PKCE Handshake' },
  { id: 'conn_recaptcha_server_actions', from: 'node_recaptcha', to: 'node_server_actions', label: 'Bot Score Assertion' },

  // Tier 3 -> Tier 4 (Core Services -> Storage)
  { id: 'conn_server_actions_postgres', from: 'node_server_actions', to: 'node_postgres', label: 'Encrypted SQL / RLS' },
  { id: 'conn_server_actions_cache', from: 'node_server_actions', to: 'node_cache', label: 'L1 Cache Read' },
  { id: 'conn_server_actions_pgvector', from: 'node_server_actions', to: 'node_pgvector', label: 'Dense Embeddings Store' },
  { id: 'conn_auth_postgres', from: 'node_auth', to: 'node_postgres', label: 'User Schema & JWT Sessions' },
  { id: 'conn_admin_postgres', from: 'node_admin', to: 'node_postgres', label: 'Telemetry Aggregations' },
  { id: 'conn_cms_postgres', from: 'node_cms', to: 'node_postgres', label: 'Headless Content Store' },
  { id: 'conn_cms_cache', from: 'node_cms', to: 'node_cache', label: 'Purge On Publish' },
  { id: 'conn_booking_postgres', from: 'node_booking', to: 'node_postgres', label: 'Slot Locking' },

  // Tier 4 -> Tier 5 (Storage -> Cognitive AI)
  { id: 'conn_pgvector_retriever_rag', from: 'node_pgvector', to: 'node_retriever_rag', label: 'HNSW Nearest Neighbor Index' },
  { id: 'conn_postgres_retriever_rag', from: 'node_postgres', to: 'node_retriever_rag', label: 'Chunk Metadata Hydration' },
  { id: 'conn_cache_retriever_rag', from: 'node_cache', to: 'node_retriever_rag', label: 'Semantic Hit Bypassing' },
  { id: 'conn_postgres_docling_ocr', from: 'node_postgres', to: 'node_docling_ocr', label: 'Raw Asset Streaming' },
  { id: 'conn_pgvector_ai_agents', from: 'node_pgvector', to: 'node_ai_agents', label: 'Agent Ephemeral Memory' },
  { id: 'conn_postgres_ai_agents', from: 'node_postgres', to: 'node_ai_agents', label: 'Agent Tool Ledger' },
  { id: 'conn_retriever_rag_graphrag', from: 'node_retriever_rag', to: 'node_graphrag', label: 'Multi-Hop Entity Traversal' },

  // Tier 3 & Tier 5 -> Tier 6 (Services & Cognitive -> Commerce & Integrations)
  { id: 'conn_server_actions_razorpay', from: 'node_server_actions', to: 'node_razorpay', label: 'Checkout Webhook Gateway' },
  { id: 'conn_booking_razorpay', from: 'node_booking', to: 'node_razorpay', label: 'Deposit Escrow' },
  { id: 'conn_server_actions_resend', from: 'node_server_actions', to: 'node_resend', label: 'Transactional Mail' },
  { id: 'conn_auth_resend', from: 'node_auth', to: 'node_resend', label: 'Magic Link Dispatch' },
  { id: 'conn_server_actions_telemetry', from: 'node_server_actions', to: 'node_telemetry', label: 'Event Telemetry' },
  { id: 'conn_retriever_rag_telemetry', from: 'node_retriever_rag', to: 'node_telemetry', label: 'Inference Metrics' },
  { id: 'conn_ai_agents_resend', from: 'node_ai_agents', to: 'node_resend', label: 'Autonomous Outreach Dispatch' },
  { id: 'conn_ai_agents_razorpay', from: 'node_ai_agents', to: 'node_razorpay', label: 'Automated Invoicing' },
];

export function ArchitectureTopologyMap({
  selectedEngineId,
  selectedFeatureIds,
  allEngines,
  allFeatures,
  onAddFeature,
}: ArchitectureTopologyMapProps) {


  const [viewMode, setViewMode] = useState<'diagram' | 'matrix'>('diagram');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inspectedNode, setInspectedNode] = useState<TopologyNode | null>(null);

  const selectedEngine = useMemo(() => {
    return allEngines.find((e) => e.id === selectedEngineId) || allEngines[0];
  }, [allEngines, selectedEngineId]);

  // Topology node definitions
  const nodes: TopologyNode[] = useMemo(() => {
    return [
      // Tier 1: Client & Presentation
      {
        id: 'node_web',
        tierId: 'client',
        title: selectedEngine?.title || 'Next.js 16 Web Platform',
        subtitle: 'App Router & React 19',
        specs: selectedEngine?.techSpecs || 'Responsive CSS Modules, Framer Motion, SSR Hydration',
        slaInfo: '<50ms TTFB Edge Rendered • 100/100 Lighthouse Performance',
        isAlwaysActive: true,
      },
      {
        id: 'node_pwa',
        featureId: 'pwa',
        tierId: 'client',
        title: 'PWA Mobile Shell',
        subtitle: 'Service Worker & Offline',
        specs: 'Web App Manifest, Push Notifications, Offline Asset Caching',
        slaInfo: 'Instant Offline Cache • Installable Homescreen App',
        activeWhenFeature: ['pwa'],
      },
      {
        id: 'node_terminal',
        tierId: 'client',
        title: 'Hacker CLI Terminal',
        subtitle: 'Diagnostics Shell',
        specs: 'Interactive commands (/terminal), Mobile QR Payment Gateway',
        slaInfo: 'Sub-millisecond Local Shell Execution',
        isAlwaysActive: true,
      },

      // Tier 2: Edge & Security
      {
        id: 'node_waf',
        tierId: 'edge',
        title: 'Vercel Edge WAF',
        subtitle: 'Distributed Security',
        specs: 'L7 DDoS Shield, IP Rate Limiter, Header Telemetry Proxy',
        slaInfo: 'Global Anycast Network • Sub-10ms WAF Evaluation',
        isAlwaysActive: true,
      },
      {
        id: 'node_recaptcha',
        tierId: 'edge',
        title: 'reCAPTCHA v3 & Telemetry',
        subtitle: 'Bot Protection',
        specs: 'Score-based challenge, GDPR daily IP hashing telemetry',
        slaInfo: 'Invisible Score-Based Challenge • Zero Friction',
        isAlwaysActive: true,
      },

      // Tier 3: Core Application Services
      {
        id: 'node_server_actions',
        tierId: 'core',
        title: 'Next.js Server Handlers',
        subtitle: 'REST & RPC Endpoints',
        specs: 'TypeScript Edge Handlers, SSR Cache Revalidation',
        slaInfo: 'Zero Cold Start Edge Runtime',
        isAlwaysActive: true,
      },
      {
        id: 'node_auth',
        featureId: 'auth',
        tierId: 'core',
        title: 'User Auth & Sessions',
        subtitle: 'Google OAuth & PKCE',
        specs: 'Supabase Auth, Encrypted JWT Cookies, RLS Policies',
        slaInfo: 'Zero-Trust Session Tokens • AES-256 Vault Encryption',
        activeWhenFeature: ['auth'],
      },
      {
        id: 'node_admin',
        featureId: 'admin',
        tierId: 'core',
        title: 'Admin Command Center',
        subtitle: 'RBAC & Analytics',
        specs: 'High-speed Visitor Analytics, Lead CRM, Staff Permissions',
        slaInfo: 'Role-Gated Master Admin Cockpit',
        activeWhenFeature: ['admin'],
      },
      {
        id: 'node_cms',
        featureId: 'cms',
        tierId: 'core',
        title: 'Headless Markdown CMS',
        subtitle: 'Content Platform',
        specs: 'Markdown Engine, Instant Cache Purge API, Dynamic Posts',
        slaInfo: 'Instant Multi-CDN Cache Invalidation',
        activeWhenFeature: ['cms'],
      },
      {
        id: 'node_booking',
        featureId: 'booking',
        tierId: 'core',
        title: 'Booking & Scheduler',
        subtitle: 'Calendar Sync & Holds',
        specs: 'Google/iCal Sync, Availability Engine, Deposit Holds',
        slaInfo: 'Real-time Time-slot Locking',
        activeWhenFeature: ['booking'],
      },

      // Tier 4: Data & Vector Storage
      {
        id: 'node_postgres',
        tierId: 'data',
        title: 'Supabase PostgreSQL',
        subtitle: 'Relational Database',
        specs: 'Encrypted Postgres, Row-Level Security (RLS), Auto Backup',
        slaInfo: '99.99% Cloud Uptime • Point-in-Time Recovery',
        isAlwaysActive: true,
      },
      {
        id: 'node_pgvector',
        featureId: 'ai_rag',
        tierId: 'data',
        title: 'pgvector HNSW Store',
        subtitle: 'Dense Vector Index',
        specs: 'Hierarchical Navigable Small World (HNSW), Cosine Search',
        slaInfo: '<30ms Nearest Neighbor Semantic Lookups',
        activeWhenFeature: ['ai_rag', 'ai_agents'],
      },
      {
        id: 'node_cache',
        tierId: 'data',
        title: 'Redis Semantic Cache',
        subtitle: 'L1 Fast In-Memory',
        specs: 'Embedding Similarity Cache, Sub-100ms Exact Hit Return',
        slaInfo: '<80ms Semantic Cache Acceleration',
        isAlwaysActive: true,
      },

      // Tier 5: Cognitive AI Engine
      {
        id: 'node_retriever_rag',
        featureId: 'ai_rag',
        tierId: 'ai',
        title: 'Retriever Cognitive RAG',
        subtitle: 'Hybrid Vector + Sparse',
        specs: 'pgvector + BM25 + Cohere Rerank + Grounded Citations',
        slaInfo: '<450ms P95 Inference • Verified Citation Spans',
        activeWhenFeature: ['ai_rag'],
      },
      {
        id: 'node_docling_ocr',
        featureId: 'ai_vision_ocr',
        tierId: 'ai',
        title: 'Docling Layout OCR',
        subtitle: 'Vision PDF Extraction',
        specs: 'Layout-Aware Vision Parsing, Table-to-Markdown Pipeline',
        slaInfo: 'Accurate Multi-Column & Scanned PDF Ingestion',
        activeWhenFeature: ['ai_vision_ocr', 'ai_rag'],
      },
      {
        id: 'node_ai_agents',
        featureId: 'ai_agents',
        tierId: 'ai',
        title: 'Autonomous AI Agents',
        subtitle: 'Workflow Automation',
        specs: 'Multi-Agent Tool Calling, Web Crawling & API Actions',
        slaInfo: 'Continuous ReAct Consensus & Reflection Loops',
        activeWhenFeature: ['ai_agents'],
      },
      {
        id: 'node_graphrag',
        featureId: 'ai_rag',
        tierId: 'ai',
        title: 'GraphRAG Topology',
        subtitle: 'Entity Knowledge Graph',
        specs: 'Entity-Relation Extraction, Multi-Hop Graph Reasoning',
        slaInfo: 'Holistic Cross-Document Topology Synthesis',
        activeWhenFeature: ['ai_rag', 'ai_agents'],
      },

      // Tier 6: Integrations & Commerce
      {
        id: 'node_razorpay',
        featureId: 'payments',
        tierId: 'integrations',
        title: 'Razorpay / Stripe Escrow',
        subtitle: 'Payment Webhooks',
        specs: '50% Milestone Split, Automated Digital Invoices, Cards/UPI',
        slaInfo: 'PCI-DSS Compliant Hosted Payment Flow',
        activeWhenFeature: ['payments', 'commerce'],
      },
      {
        id: 'node_resend',
        featureId: 'email',
        tierId: 'integrations',
        title: 'Resend Transactional SMTP',
        subtitle: 'Automated Email Flows',
        specs: 'Branded Receipts, Contact Notifications, Event Triggers',
        slaInfo: '99.9% Inbound Inbox Deliverability',
        activeWhenFeature: ['email'],
      },
      {
        id: 'node_telemetry',
        tierId: 'integrations',
        title: 'Real-Time Telemetry',
        subtitle: 'Visitor Analytics & Audit',
        specs: 'Session Tracking, Performance Timing, Security Logs',
        slaInfo: 'GDPR-Compliant Real-Time Event Ledger',
        isAlwaysActive: true,
      },
    ];
  }, [selectedEngine]);


  // Compute active state for a given node
  const isNodeActive = useCallback((node: TopologyNode) => {
    if (node.isAlwaysActive) return true;
    if (node.activeWhenEngine && node.activeWhenEngine.includes(selectedEngineId)) return true;
    if (node.activeWhenFeature && node.activeWhenFeature.some((fId) => selectedFeatureIds.includes(fId))) return true;
    return false;
  }, [selectedEngineId, selectedFeatureIds]);

  const activeCount = nodes.filter(isNodeActive).length;

  const nodeActiveLookup = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const node of nodes) {
      map.set(node.id, isNodeActive(node));
    }
    return map;
  }, [nodes, isNodeActive]);

  const circuitLines = useMemo(() => {
    return TOPOLOGY_CONNECTIONS.map((connection) => {
      const fromPos = NODE_POSITIONS[connection.from];
      const toPos = NODE_POSITIONS[connection.to];
      if (!fromPos || !toPos) return null;

      const pathD = calculateBezierCircuitPath(fromPos, toPos);
      const active = Boolean(nodeActiveLookup.get(connection.from) && nodeActiveLookup.get(connection.to));

      return { connection, pathD, active };
    })
      .filter((line): line is { connection: TopologyConnection; pathD: string; active: boolean } => Boolean(line))
      .sort((a, b) => (a.active === b.active ? 0 : a.active ? 1 : -1));
  }, [nodeActiveLookup]);

  const renderSvgContent = () => (
    <svg
      viewBox="0 0 960 520"
      className={styles.svgCanvas}
      role="img"
      aria-label="Architecture Topology Circuit Blueprint"
    >
      <defs>
        <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Tier 1: Client Layer (X: 20, Width: 135) */}
      <rect x="20" y="20" width="135" height="480" className={styles.tierBackground} />
      <text x="30" y="45" className={styles.tierLabel}>1. CLIENT</text>

      {/* Tier 2: Edge Security (X: 175, Width: 135) */}
      <rect x="175" y="20" width="135" height="480" className={styles.tierBackground} />
      <text x="185" y="45" className={styles.tierLabel}>2. EDGE WAF</text>

      {/* Tier 3: Core Services (X: 330, Width: 145) */}
      <rect x="330" y="20" width="145" height="480" className={styles.tierBackground} />
      <text x="340" y="45" className={styles.tierLabel}>3. SERVICES</text>

      {/* Tier 4: Data & Vector (X: 495, Width: 140) */}
      <rect x="495" y="20" width="140" height="480" className={styles.tierBackground} />
      <text x="505" y="45" className={styles.tierLabel}>4. STORAGE</text>

      {/* Tier 5: Cognitive AI (X: 655, Width: 140) */}
      <rect x="655" y="20" width="140" height="480" className={styles.tierBackground} />
      <text x="665" y="45" className={styles.tierLabel}>5. COGNITIVE</text>

      {/* Tier 6: Integrations (X: 815, Width: 125) */}
      <rect x="815" y="20" width="125" height="480" className={styles.tierBackground} />
      <text x="825" y="45" className={styles.tierLabel}>6. COMMERCE</text>

      {/* Dynamic Dependency-Aware Circuit Connections */}
      <g className={styles.connectionsGroup}>
        {circuitLines.map(({ connection, pathD, active }) => (
          <path
            key={connection.id}
            id={connection.id}
            d={pathD}
            data-testid={`circuit-trace-${connection.id}`}
            data-active={active ? 'true' : 'false'}
            className={`${styles.connectionLine} ${active ? styles.connectionLineActive : ''}`}
          >
            {connection.label && <title>{`${connection.label} (${active ? 'Active Flow' : 'Dormant'})`}</title>}
          </path>
        ))}
      </g>

      {/* Render Node Cards in Tier Columns */}
      {nodes.map((node) => {
        const active = isNodeActive(node);
        const pos = NODE_POSITIONS[node.id] || { x: 30, y: 65, width: 115, height: 64 };
        const { x, y, width, height } = pos;

        return (
          <g
            key={node.id}
            className={styles.nodeCard}
            onClick={() => setInspectedNode(node)}
            role="button"
            tabIndex={0}
            aria-label={`${node.title} (${active ? 'Active' : 'Dormant'})`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setInspectedNode(node);
              }
            }}
          >
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              className={`${styles.nodeRect} ${active ? styles.nodeRectActive : styles.nodeRectDormant}`}
            />
            <text x={x + 8} y={y + 18} className={`${styles.nodeTitle} ${!active ? styles.nodeTitleDormant : ''}`}>
              {node.title.length > 15 ? `${node.title.slice(0, 14)}…` : node.title}
            </text>
            <text x={x + 8} y={y + 32} className={styles.nodeSubtitle}>
              {node.subtitle}
            </text>
            <text
              x={x + 8}
              y={y + 50}
              className={`${styles.nodeBadge} ${active ? styles.nodeBadgeActive : styles.nodeBadgeDormant}`}
            >
              {active ? '● IN BLUEPRINT' : '○ AVAILABLE'}
            </text>
          </g>
        );
      })}
    </svg>
  );

  return (
    <section className={styles.topologyContainer} aria-label="Architecture Topology Visualizer">
      {/* Top Header Bar */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <Network size={18} className={styles.titleIcon} />
          <span className={styles.titleText}>Live System Architecture Topology</span>
          <span className={styles.activeNodesPill}>
            {activeCount} of {nodes.length} Nodes Active
          </span>
        </div>

        <div className={styles.controlActions}>
          <button
            type="button"
            className={`${styles.modeToggleBtn} ${viewMode === 'diagram' ? styles.modeToggleBtnActive : ''}`}
            onClick={() => setViewMode('diagram')}
          >
            <Zap size={13} />
            Diagram
          </button>
          <button
            type="button"
            className={`${styles.modeToggleBtn} ${viewMode === 'matrix' ? styles.modeToggleBtnActive : ''}`}
            onClick={() => setViewMode('matrix')}
          >
            <Layers size={13} />
            Matrix View
          </button>
          <button
            type="button"
            className={styles.expandBtn}
            onClick={() => setIsFullscreen(true)}
            title="Expand Fullscreen Architecture Canvas"
            aria-label="Expand Fullscreen Architecture Canvas"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'diagram' ? (
        <div className={styles.diagramWrapper}>{renderSvgContent()}</div>
      ) : (
        <div className={styles.matrixGrid}>
          {TOPOLOGY_TIERS.map((tier) => {
            const tierNodes = nodes.filter((n) => n.tierId === tier.id);
            return (
              <div key={tier.id} className={styles.tierCard}>
                <div className={styles.tierCardHeader}>
                  <span className={styles.tierCardTitle}>{tier.label}</span>
                </div>
                <div className={styles.matrixNodeList}>
                  {tierNodes.map((node) => {
                    const active = isNodeActive(node);
                    const matchingFeature = allFeatures.find((f) => f.id === node.featureId);
                    return (
                      <div
                        key={node.id}
                        className={`${styles.matrixNodeItem} ${active ? styles.matrixNodeItemActive : ''}`}
                        onClick={() => setInspectedNode(node)}
                      >
                        <div className={styles.matrixNodeLeft}>
                          <span className={styles.matrixNodeName}>{node.title}</span>
                          <span className={styles.matrixNodeSpec}>{node.specs}</span>
                        </div>
                        <div className={styles.matrixNodeRight}>
                          {active ? (
                            <span className={styles.activeStatusTag}>● ACTIVE</span>
                          ) : matchingFeature && onAddFeature ? (
                            <button
                              type="button"
                              className={styles.quickAddBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddFeature(matchingFeature.id);
                              }}
                            >
                              <Plus size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
                              Add
                            </button>
                          ) : (
                            <span className={styles.nodeBadgeDormant}>DORMANT</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspected Node SLA Callout Tooltip */}
      {inspectedNode && (
        <div className={styles.inspectTooltip} role="status">
          <div className={styles.inspectLeft}>
            <span className={styles.inspectTitle}>
              {inspectedNode.title} • {isNodeActive(inspectedNode) ? '🟢 Active in Scope' : '⚪ Available Add-on'}
            </span>
            <span className={styles.inspectSla}>
              <strong>SLA &amp; Tech:</strong> {inspectedNode.slaInfo} ({inspectedNode.specs})
            </span>
          </div>
          <div className={styles.inspectRight}>
            {!isNodeActive(inspectedNode) && inspectedNode.featureId && onAddFeature && (
              <button
                type="button"
                className={styles.quickAddBtn}
                onClick={() => {
                  onAddFeature(inspectedNode.featureId!);
                  setInspectedNode(null);
                }}
              >
                <Plus size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Add Module
              </button>
            )}
            <button
              type="button"
              className={styles.closeInspectBtn}
              onClick={() => setInspectedNode(null)}
              aria-label="Dismiss inspector"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Modal View with Portal */}
      {isFullscreen && (
        <Portal>
          <div className={styles.fullscreenOverlay} role="dialog" aria-modal="true" aria-label="Fullscreen Architecture Topology">
            <div className={styles.fullscreenHeader}>
              <div className={styles.titleArea}>
                <Network size={18} className={styles.titleIcon} />
                <span className={styles.titleText}>Full System Architecture Blueprint ({selectedEngine.title})</span>
              </div>
              <button
                type="button"
                className={styles.expandBtn}
                onClick={() => setIsFullscreen(false)}
                aria-label="Close Fullscreen View"
              >
                <Minimize2 size={16} />
              </button>
            </div>
            <div className={styles.fullscreenBody}>{renderSvgContent()}</div>
          </div>
        </Portal>
      )}
    </section>
  );
}
