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
  CheckCircle2,
} from 'lucide-react';
import Portal from '@/components/ui/Portal';
import type { BaseEngineItem, FeatureItem } from '@/data/resume';
import { formatPricePair, type Currency } from '@/lib/pricing';

import styles from './ArchitectureTopologyMap.module.css';

export interface TopologyNode {
  id: string;
  featureId?: string;
  tierId: 'visitor' | 'security' | 'commerce' | 'ai' | 'data';
  title: string;
  subtitle: string;
  laymanDesc: string;
  howItFits: string;
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

export const TOPOLOGY_TIERS = [
  {
    id: 'visitor',
    label: '1. Visitor & Customer Access',
    laymanSubtitle: 'Web, Mobile & Multi-Language Interfaces',
    description: 'How visitors and prospective customers discover, access, and experience your platform across all devices.',
  },
  {
    id: 'security',
    label: '2. Security & Core Platform',
    laymanSubtitle: 'Edge Speed, Spam Shield & Customer Portals',
    description: 'The foundation protecting your business: bank-grade encryption, bot defense, customer login, and staff admin.',
  },
  {
    id: 'commerce',
    label: '3. Business & Monetization',
    laymanSubtitle: 'Storefront, Payments, Booking & Academy',
    description: 'Turn visitors into paying clients: sell products, collect deposits, book appointments, and host courses.',
  },
  {
    id: 'ai',
    label: '4. AI Intelligence & Automation',
    laymanSubtitle: '24/7 AI Knowledge Base & Voice Agents',
    description: 'Scale operations without hiring: intelligent customer assistants, document scanners, and voice call agents.',
  },
  {
    id: 'data',
    label: '5. Data & Connected Tools',
    laymanSubtitle: 'Cloud Database, Automated Emails & CRM',
    description: 'Where your business information lives and syncs: encrypted database, email receipts, CRM deals, and webhooks.',
  },
] as const;

export interface TopologyConnection {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 5 Columns (Width: 175 each, Gap: 20, Canvas: 1000 x 510)
export const NODE_POSITIONS: Record<string, NodePosition> = {
  // Column 1: Visitor & Customer Access (X: 20)
  node_web: { x: 20, y: 72, width: 175, height: 68 },
  node_pwa: { x: 20, y: 156, width: 175, height: 68 },
  node_i18n: { x: 20, y: 240, width: 175, height: 68 },
  node_video: { x: 20, y: 324, width: 175, height: 68 },

  // Column 2: Security & Core Platform (X: 215)
  node_security: { x: 215, y: 72, width: 175, height: 68 },
  node_auth: { x: 215, y: 156, width: 175, height: 68 },
  node_admin: { x: 215, y: 240, width: 175, height: 68 },
  node_cms: { x: 215, y: 324, width: 175, height: 68 },

  // Column 3: Business & Monetization (X: 410)
  node_commerce: { x: 410, y: 72, width: 175, height: 68 },
  node_payments: { x: 410, y: 156, width: 175, height: 68 },
  node_booking: { x: 410, y: 240, width: 175, height: 68 },
  node_lms: { x: 410, y: 324, width: 175, height: 68 },

  // Column 4: AI Intelligence & Automation (X: 605)
  node_ai_rag: { x: 605, y: 72, width: 175, height: 68 },
  node_ai_vision: { x: 605, y: 156, width: 175, height: 68 },
  node_ai_voice: { x: 605, y: 240, width: 175, height: 68 },
  node_ai_agents: { x: 605, y: 324, width: 175, height: 68 },

  // Column 5: Data & Connected Tools (X: 800)
  node_database: { x: 800, y: 72, width: 175, height: 68 },
  node_email: { x: 800, y: 156, width: 175, height: 68 },
  node_crm: { x: 800, y: 240, width: 175, height: 68 },
  node_integrations: { x: 800, y: 324, width: 175, height: 68 },
  node_migration: { x: 800, y: 408, width: 175, height: 68 },
};

export function calculateBezierCircuitPath(fromPos: NodePosition, toPos: NodePosition): string {
  // Intra-tier same column outward gutter arc
  if (fromPos.x === toPos.x) {
    const x1 = fromPos.x + fromPos.width;
    const y1 = fromPos.y + fromPos.height / 2;
    const x2 = toPos.x + toPos.width;
    const y2 = toPos.y + toPos.height / 2;
    const arcOffset = 22;
    return `M ${x1} ${y1} C ${x1 + arcOffset} ${y1}, ${x2 + arcOffset} ${y2}, ${x2} ${y2}`;
  }

  // Inter-tier forward (left-to-right) routing
  if (toPos.x > fromPos.x) {
    const x1 = fromPos.x + fromPos.width;
    const y1 = fromPos.y + fromPos.height / 2;
    const x2 = toPos.x;
    const y2 = toPos.y + toPos.height / 2;
    const dx = x2 - x1;
    return `M ${x1} ${y1} C ${x1 + dx * 0.5} ${y1}, ${x2 - dx * 0.5} ${y2}, ${x2} ${y2}`;
  }

  // Inter-tier reverse (right-to-left) routing
  const x1 = fromPos.x;
  const y1 = fromPos.y + fromPos.height / 2;
  const x2 = toPos.x + toPos.width;
  const y2 = toPos.y + toPos.height / 2;
  const dx = x1 - x2;
  return `M ${x1} ${y1} C ${x1 - dx * 0.5} ${y1}, ${x2 + dx * 0.5} ${y2}, ${x2} ${y2}`;
}

export const TOPOLOGY_CONNECTIONS: TopologyConnection[] = [
  // Pillar 1 -> Pillar 2 (Visitor Access -> Security & Core Platform)
  { id: 'conn_web_security', from: 'node_web', to: 'node_security', label: 'Edge Ingress & Anti-DDoS Shield' },
  { id: 'conn_pwa_security', from: 'node_pwa', to: 'node_security', label: 'Mobile PWA Sync & Edge Cache' },
  { id: 'conn_i18n_security', from: 'node_i18n', to: 'node_security', label: 'Geo-Locale Ingress & SEO Routing' },
  { id: 'conn_video_security', from: 'node_video', to: 'node_security', label: 'Signed Video Streaming Pipeline' },

  // Pillar 2 -> Pillar 2 & 3 (Security -> Customer Logins, Admin, CMS, Commerce)
  { id: 'conn_security_auth', from: 'node_security', to: 'node_auth', label: 'Secure User Authentication' },
  { id: 'conn_security_admin', from: 'node_security', to: 'node_admin', label: 'Role-Gated Admin Access' },
  { id: 'conn_security_cms', from: 'node_security', to: 'node_cms', label: 'Headless Content Publishing' },
  { id: 'conn_auth_commerce', from: 'node_auth', to: 'node_commerce', label: 'Customer Account to Cart & Orders' },
  { id: 'conn_auth_booking', from: 'node_auth', to: 'node_booking', label: 'Authenticated Appointment Booking' },
  { id: 'conn_auth_lms', from: 'node_auth', to: 'node_lms', label: 'Student Enrollment & Progress Portal' },

  // Pillar 3 -> Pillar 3 & 5 (Commerce -> Payments, Invoicing, Email, Database)
  { id: 'conn_commerce_payments', from: 'node_commerce', to: 'node_payments', label: 'Checkout Cart to Payment Gateway' },
  { id: 'conn_booking_payments', from: 'node_booking', to: 'node_payments', label: 'Appointment Deposit Escrow' },
  { id: 'conn_lms_payments', from: 'node_lms', to: 'node_payments', label: 'Course Tuition Payment Checkout' },
  { id: 'conn_payments_email', from: 'node_payments', to: 'node_email', label: 'Automated Receipts & Invoices' },
  { id: 'conn_payments_database', from: 'node_payments', to: 'node_database', label: 'Encrypted Transaction Ledgers' },

  // Pillar 1 & 2 -> Pillar 4 (Web & Security -> AI & Automation)
  { id: 'conn_web_ai_rag', from: 'node_web', to: 'node_ai_rag', label: '24/7 AI Customer Knowledge Chat' },
  { id: 'conn_web_ai_voice', from: 'node_web', to: 'node_ai_voice', label: 'Real-Time WebRTC Voice Assistant' },
  { id: 'conn_ai_rag_database', from: 'node_ai_rag', to: 'node_database', label: 'Verified Document Vector Hydration' },
  { id: 'conn_ai_vision_database', from: 'node_ai_vision', to: 'node_database', label: 'Scanned Data Schema Ingestion' },
  { id: 'conn_ai_agents_integrations', from: 'node_ai_agents', to: 'node_integrations', label: 'Autonomous Tool & API Actions' },
  { id: 'conn_ai_agents_email', from: 'node_ai_agents', to: 'node_email', label: 'Autonomous Outreach & Alerts' },

  // Pillar 2 & 3 -> Pillar 5 (Core Platform -> Database, CRM, Integrations)
  { id: 'conn_auth_database', from: 'node_auth', to: 'node_database', label: 'User Schema & Row-Level Security' },
  { id: 'conn_cms_database', from: 'node_cms', to: 'node_database', label: 'Blog Posts & Case Study Storage' },
  { id: 'conn_admin_database', from: 'node_admin', to: 'node_database', label: 'Master Admin Data Queries' },
  { id: 'conn_crm_database', from: 'node_crm', to: 'node_database', label: 'Customer Lead Schema & Deals' },
  { id: 'conn_crm_integrations', from: 'node_crm', to: 'node_integrations', label: 'Slack Alerts & Zapier Sync' },
  { id: 'conn_migration_database', from: 'node_migration', to: 'node_database', label: 'Legacy Data Schema Import' },
];

export function ArchitectureTopologyMap({
  selectedEngineId,
  selectedFeatureIds,
  allEngines,
  allFeatures,
  currency = 'INR',
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
      // Pillar 1: Visitor & Customer Access
      {
        id: 'node_web',
        tierId: 'visitor',
        title: selectedEngine?.title || 'Web Application Platform',
        subtitle: selectedEngine?.tier || 'Core Web Foundation',
        laymanDesc: 'Ultra-fast, mobile-friendly web experience built to showcase your brand, engage visitors, and convert leads into paying customers.',
        howItFits: 'Acts as the primary entry point for all customer visits, rendering pages instantly from global edge servers.',
        specs: selectedEngine?.techSpecs || 'Next.js 16 App Router, React 19, Responsive CSS Modules, Global Edge SSR',
        slaInfo: '<50ms TTFB Edge Rendered • 100/100 Lighthouse Performance',
        isAlwaysActive: true,
      },
      {
        id: 'node_pwa',
        featureId: 'pwa',
        tierId: 'visitor',
        title: 'Installable Mobile App',
        subtitle: 'iOS & Android PWA',
        laymanDesc: 'Turns your web platform into an installable mobile app with home-screen launch, push notifications, and offline access without App Store fees.',
        howItFits: 'Syncs through your web core, allowing customers to install the app directly from their mobile browser.',
        specs: 'Web App Manifest, Service Worker Caching, Push Notifications, Offline Fallback Shell',
        slaInfo: 'Instant Offline Cache • Zero-Friction 1-Tap Mobile Install',
        activeWhenFeature: ['pwa'],
      },
      {
        id: 'node_i18n',
        featureId: 'i18n',
        tierId: 'visitor',
        title: 'Global Multi-Language',
        subtitle: 'Auto-Locales & Currencies',
        laymanDesc: 'Serves your website in multiple languages with automatic visitor location detection so international customers see native text and local currency.',
        howItFits: 'Detects visitor country at the edge and routes them to the correct language dictionary and currency rates.',
        specs: 'i18n Routing Dictionaries, Geo-IP Locale Detection, hreflang SEO Language Tags',
        slaInfo: 'Sub-5ms Edge Geo-Locale Routing • Global Multi-Currency',
        activeWhenFeature: ['i18n'],
      },
      {
        id: 'node_video',
        featureId: 'video',
        tierId: 'visitor',
        title: 'Video Streaming Hub',
        subtitle: 'Buffer-Free Video Player',
        laymanDesc: 'Fast, buffer-free video hosting and custom player for video courses, marketing product demos, and client onboarding tutorials.',
        howItFits: 'Delivers adaptive streaming through global video CDN nodes with signed URLs to prevent unauthorized downloads.',
        specs: 'Adaptive Bitrate HLS Player, Signed Playback URLs, Global Video CDN Pipeline',
        slaInfo: '99.99% Global CDN Delivery • Buffer-Free Adaptive Streaming',
        activeWhenFeature: ['video'],
      },

      // Pillar 2: Security & Core Platform
      {
        id: 'node_security',
        tierId: 'security',
        title: 'Security & Spam Shield',
        subtitle: 'SSL, DDoS & Anti-Bot',
        laymanDesc: 'Bank-grade SSL encryption, global DDoS protection, and invisible bot screening to keep your forms and checkout clean from automated spam.',
        howItFits: 'Wraps your entire application platform, filtering malicious bots before they ever reach your database or inbox.',
        specs: 'Global Anycast Edge, TLS 1.3 Encryption, reCAPTCHA v3 Score Challenge',
        slaInfo: 'Sub-10ms Edge Inspection • Invisible Frictionless Bot Screening',
        isAlwaysActive: true,
      },
      {
        id: 'node_auth',
        featureId: 'auth',
        tierId: 'security',
        title: 'User Accounts & Portal',
        subtitle: 'Google & Magic Links',
        laymanDesc: 'Allows customers to securely sign in via Google or Email Magic Links and access their private personal dashboards and order histories.',
        howItFits: 'Issues secure encrypted session tokens that protect customer data and govern access to private portals.',
        specs: 'Google OAuth 2.0 PKCE, Passwordless Magic Links, Row-Level Security (RLS)',
        slaInfo: 'Zero-Trust Session Tokens • AES-256 Cloud Vault Encryption',
        activeWhenFeature: ['auth'],
      },
      {
        id: 'node_admin',
        featureId: 'admin',
        tierId: 'security',
        title: 'Admin Command Center',
        subtitle: 'Staff Cockpit & RBAC',
        laymanDesc: 'A private internal command center for you and your team to monitor live traffic, view customer orders, and set staff role permissions.',
        howItFits: 'Connects directly to your database and services with strict role gates so only authorized staff can manage records.',
        specs: 'Real-Time Traffic Telemetry, Lead CRM, Role-Based Access Control (RBAC)',
        slaInfo: 'Role-Gated Master Admin Cockpit • Audit Trail Logging',
        activeWhenFeature: ['admin'],
      },
      {
        id: 'node_cms',
        featureId: 'cms',
        tierId: 'security',
        title: 'Content & Blog CMS',
        subtitle: 'Easy Article Manager',
        laymanDesc: 'An easy backend editor allowing you to write, edit, and publish blog articles, company announcements, and case studies without writing code.',
        howItFits: 'Stores your articles in the cloud database and purges CDN cache on-demand so new posts appear live instantly.',
        specs: 'Markdown Engine, Instant Cache Purge API, Dynamic SEO OpenGraph Tags',
        slaInfo: 'Instant Multi-CDN Cache Invalidation On Publish',
        activeWhenFeature: ['cms'],
      },

      // Pillar 3: Business & Monetization
      {
        id: 'node_commerce',
        featureId: 'commerce',
        tierId: 'commerce',
        title: 'Storefront & Cart',
        subtitle: 'Product Catalog & Orders',
        laymanDesc: 'A complete online store with product catalog, shopping cart, customer checkout flow, inventory tracking, and order history.',
        howItFits: 'Allows customers to browse products and build a cart, then hands off seamlessly to the Payment Gateway.',
        specs: 'Product Catalog Schema, Reactive Cart State, Inventory Management, Order Ledger',
        slaInfo: 'Instant Cart State Updates • Multi-Product Order Management',
        activeWhenFeature: ['commerce'],
      },
      {
        id: 'node_payments',
        featureId: 'payments',
        tierId: 'commerce',
        title: 'Payments & Invoicing',
        subtitle: 'Cards, UPI & Invoices',
        laymanDesc: 'Enables your platform to accept payments via Credit Cards, Apple Pay, UPI, or subscriptions with automatic digital tax receipts.',
        howItFits: 'Securely processes transactions via hosted checkout and triggers automated email receipts and database order updates.',
        specs: 'Hosted PCI-DSS Payment Webhooks, 1-Click Checkout, Recurring Billing & Invoicing',
        slaInfo: 'PCI-DSS Level 1 Compliant Checkout • Encrypted Webhook Verification',
        activeWhenFeature: ['payments', 'commerce'],
      },
      {
        id: 'node_booking',
        featureId: 'booking',
        tierId: 'commerce',
        title: 'Booking & Scheduler',
        subtitle: 'Live Calendar Sync',
        laymanDesc: 'Lets clients view real-time calendar availability, book appointments, and pay deposits online with automatic email reminders.',
        howItFits: 'Locks time slots to prevent double-booking, syncs with Google/iCal, and collects deposits through the Payment Gateway.',
        specs: 'Live Availability Engine, Google/iCal Sync, Real-time Slot Reservation, Deposit Escrow',
        slaInfo: 'Real-Time Double-Booking Prevention • Automated Cal Sync',
        activeWhenFeature: ['booking'],
      },
      {
        id: 'node_lms',
        featureId: 'lms',
        tierId: 'commerce',
        title: 'Course & LMS Academy',
        subtitle: 'Lessons & Certificates',
        laymanDesc: 'A gated learning academy where students enroll in courses, watch video lessons, track progress, and earn certificates upon completion.',
        howItFits: 'Gates video lessons behind customer accounts and sends completion data to student profiles.',
        specs: 'Modular Course Builder, Video Lesson Player, Student Progress Tracking, Certificates',
        slaInfo: 'Interactive Student Tracking • Gated Content Access',
        activeWhenFeature: ['lms'],
      },

      // Pillar 4: AI Intelligence & Automation
      {
        id: 'node_ai_rag',
        featureId: 'ai_rag',
        tierId: 'ai',
        title: 'AI Knowledge Base (RAG)',
        subtitle: '24/7 Question Answering',
        laymanDesc: 'An intelligent AI assistant trained exclusively on your business documents, FAQs, and PDFs that answers questions 24/7 with exact citations.',
        howItFits: 'Performs semantic vector searches over your indexed documents to give customers grounded answers without hallucinations.',
        specs: 'Hybrid Dense Vector + Keyword Search, Presigned Source Citations, Response Guardrails',
        slaInfo: '<450ms P95 Inference • Verified Citation Spans',
        activeWhenFeature: ['ai_rag'],
      },
      {
        id: 'node_ai_vision',
        featureId: 'ai_vision_ocr',
        tierId: 'ai',
        title: 'AI Document Scanner',
        subtitle: 'Vision PDF & OCR Engine',
        laymanDesc: 'Multimodal AI scanner that reads receipts, invoices, and PDF documents to automatically extract structured data and populate your database.',
        howItFits: 'Scans uploaded files and parses tables and key-value fields into clean JSON for instant database storage.',
        specs: 'Multimodal Vision API, Schema Validation, PDF/Image OCR Extraction Pipeline',
        slaInfo: 'Accurate Multi-Column & Scanned PDF Ingestion',
        activeWhenFeature: ['ai_vision_ocr', 'ai_rag'],
      },
      {
        id: 'node_ai_voice',
        featureId: 'ai_voice_agent',
        tierId: 'ai',
        title: 'Real-Time Voice AI',
        subtitle: 'Phone & Web Call Agent',
        laymanDesc: 'Conversational voice assistant that answers customer calls, handles support inquiries, and books appointments with natural human-like latency.',
        howItFits: 'Streams audio over low-latency WebRTC and triggers booking workflows directly into your calendar and CRM.',
        specs: 'LiveKit WebRTC Audio Pipeline, Real-Time STT/TTS, Webhook Appointment Booking',
        slaInfo: 'Sub-Second Conversational Voice Latency',
        activeWhenFeature: ['ai_voice_agent'],
      },
      {
        id: 'node_ai_agents',
        featureId: 'ai_agents',
        tierId: 'ai',
        title: 'Autonomous AI Agents',
        subtitle: 'Multi-Step Workflows',
        laymanDesc: 'AI workers that execute business tasks, search the web, call external APIs, and automate multi-step operational workflows on your behalf.',
        howItFits: 'Operates background automations, dispatching emails, querying your database, and integrating with third-party tools.',
        specs: 'Multi-Agent Tool Orchestration, Web Scraping Hooks, ReAct Decision Loops',
        slaInfo: 'Continuous ReAct Consensus & Reflection Loops',
        activeWhenFeature: ['ai_agents'],
      },

      // Pillar 5: Data & Connected Tools
      {
        id: 'node_database',
        tierId: 'data',
        title: 'Encrypted Cloud Database',
        subtitle: 'PostgreSQL & Backups',
        laymanDesc: 'Production cloud database storing your users, orders, and business data with encrypted daily backups and point-in-time disaster recovery.',
        howItFits: 'Acts as the single source of truth for your entire application, protected by strict Row-Level Security rules.',
        specs: 'Managed PostgreSQL 16, Row-Level Security (RLS), Encrypted Automated Backups',
        slaInfo: '99.99% Cloud Uptime • Point-in-Time Recovery',
        activeWhenEngine: ['saas'],
        activeWhenFeature: [
          'auth',
          'admin',
          'cms',
          'commerce',
          'booking',
          'lms',
          'crm',
          'ai_rag',
          'ai_agents',
          'ai_vision_ocr',
          'migration',
        ],
      },
      {
        id: 'node_email',
        featureId: 'email',
        tierId: 'data',
        title: 'Automated Emails',
        subtitle: 'Receipts & Notifications',
        laymanDesc: 'Delivers instant, beautifully branded email receipts, booking confirmations, and customer alerts automatically to client inboxes.',
        howItFits: 'Listens for payment, booking, and account events to trigger high-deliverability transactional emails.',
        specs: 'High-Deliverability Transactional Email API, Responsive HTML Templates, Delivery Tracking',
        slaInfo: '99.9% Inbound Inbox Deliverability',
        activeWhenFeature: ['email'],
      },
      {
        id: 'node_crm',
        featureId: 'crm',
        tierId: 'data',
        title: 'CRM & Lead Pipeline',
        subtitle: 'Deals & Contact History',
        laymanDesc: 'Visual pipeline to track prospective clients, deals, customer contact history, and team activity in one centralized dashboard.',
        howItFits: 'Captures leads from contact forms and checkout and displays them in a visual Kanban board with export tools.',
        specs: 'Kanban Deal Pipeline, Custom Lead Stages, Contact History, CSV Export Tools',
        slaInfo: 'Real-Time Sales Stage Pipeline',
        activeWhenFeature: ['crm'],
      },
      {
        id: 'node_integrations',
        featureId: 'integrations',
        tierId: 'data',
        title: 'Third-Party Integrations',
        subtitle: 'Slack, Zapier & Hooks',
        laymanDesc: 'Connects your platform to tools you already love — Slack channel alerts, Zapier automations, and outbound event webhooks.',
        howItFits: 'Broadcasts system events to third-party APIs whenever orders, leads, or bookings occur.',
        specs: 'Slack Channel Alerts, Zapier Connectors, Outbound Event Webhook Queue with Auto-Retries',
        slaInfo: 'Guaranteed Webhook Delivery with Auto-Retries',
        activeWhenFeature: ['integrations'],
      },
      {
        id: 'node_migration',
        featureId: 'migration',
        tierId: 'data',
        title: 'Legacy Data Migration',
        subtitle: 'Clean Import Pipeline',
        laymanDesc: 'Extracts, transforms, and imports your existing user accounts, articles, or legacy database cleanly into your new cloud platform.',
        howItFits: 'Runs secure ETL pipelines to validate, clean, and map legacy records into the new database schema.',
        specs: 'Automated ETL Pipeline, Data Cleansing, Schema Mapping & Relational Integrity Checks',
        slaInfo: 'Zero-Downtime Data Import • Schema Integrity Verification',
        activeWhenFeature: ['migration'],
      },
    ];
  }, [selectedEngine]);

  // Compute active state for a given node
  const isNodeActive = useCallback(
    (node: TopologyNode) => {
      if (node.isAlwaysActive) return true;
      if (node.activeWhenEngine && node.activeWhenEngine.includes(selectedEngineId)) return true;
      if (node.activeWhenFeature && node.activeWhenFeature.some((fId) => selectedFeatureIds.includes(fId))) return true;
      return false;
    },
    [selectedEngineId, selectedFeatureIds]
  );

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
      viewBox="0 0 1000 500"
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

      {/* Pillar 1: Visitor Access (X: 10, Width: 195) */}
      <rect x="10" y="15" width="195" height="470" className={styles.tierBackground} />
      <text x="20" y="38" className={styles.tierLabel}>1. VISITOR ACCESS</text>
      <text x="20" y="52" className={styles.tierSubtitleText}>Web, Mobile &amp; Global</text>

      {/* Pillar 2: Security & Core (X: 205, Width: 195) */}
      <rect x="205" y="15" width="195" height="470" className={styles.tierBackground} />
      <text x="215" y="38" className={styles.tierLabel}>2. SECURITY &amp; CORE</text>
      <text x="215" y="52" className={styles.tierSubtitleText}>Protection, Auth &amp; Admin</text>

      {/* Pillar 3: Commerce & Monetization (X: 400, Width: 195) */}
      <rect x="400" y="15" width="195" height="470" className={styles.tierBackground} />
      <text x="410" y="38" className={styles.tierLabel}>3. COMMERCE &amp; SALES</text>
      <text x="410" y="52" className={styles.tierSubtitleText}>Store, Payments &amp; Booking</text>

      {/* Pillar 4: AI & Automation (X: 595, Width: 195) */}
      <rect x="595" y="15" width="195" height="470" className={styles.tierBackground} />
      <text x="605" y="38" className={styles.tierLabel}>4. AI &amp; AUTOMATION</text>
      <text x="605" y="52" className={styles.tierSubtitleText}>Knowledge, Voice &amp; Vision</text>

      {/* Pillar 5: Data & Integrations (X: 790, Width: 195) */}
      <rect x="790" y="15" width="195" height="470" className={styles.tierBackground} />
      <text x="800" y="38" className={styles.tierLabel}>5. DATA &amp; WORKFLOWS</text>
      <text x="800" y="52" className={styles.tierSubtitleText}>Database, Email &amp; CRM</text>

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
            <title>{`${connection.label} (${active ? 'Active Data Flow' : 'Available Flow'})`}</title>
          </path>
        ))}
      </g>

      {/* Render Node Cards in Pillars */}
      {nodes.map((node) => {
        const active = isNodeActive(node);
        const pos = NODE_POSITIONS[node.id] || { x: 20, y: 72, width: 175, height: 68 };
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
            {/* Title */}
            <text x={x + 10} y={y + 20} className={`${styles.nodeTitle} ${!active ? styles.nodeTitleDormant : ''}`}>
              {node.title}
            </text>
            {/* Subtitle */}
            <text x={x + 10} y={y + 36} className={styles.nodeSubtitle}>
              {node.subtitle}
            </text>
            {/* Status Pill Badge */}
            <rect
              x={x + 10}
              y={y + 45}
              width={active ? 80 : 76}
              height={16}
              rx={3}
              className={active ? styles.nodeBadgeBgActive : styles.nodeBadgeBgDormant}
            />
            <text
              x={x + 15}
              y={y + 57}
              className={`${styles.nodeBadge} ${active ? styles.nodeBadgeActive : styles.nodeBadgeDormant}`}
            >
              {active ? '● IN SCOPE' : '○ ADD-ON'}
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
            {activeCount} of {nodes.length} Components Active
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

      {/* Non-Technical Client Blueprint Helper & Legend */}
      <div className={styles.blueprintHelperBar}>
        <div className={styles.legendGroup}>
          <span className={styles.legendItem}>
            <span className={styles.legendDotActive}>●</span> Included in Your Scope
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDotDormant}>○</span> Available Add-on
          </span>
          <span className={styles.legendItem}>
            <Zap size={12} className={styles.legendIcon} /> Live Security &amp; Data Flow
          </span>
        </div>
        <span className={styles.legendHint}>
          💡 Click any component to inspect what it delivers for your business
        </span>
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
                  <div className={styles.tierCardTitleGroup}>
                    <span className={styles.tierCardTitle}>{tier.label}</span>
                    <span className={styles.tierCardSubtitle}>{tier.laymanSubtitle}</span>
                  </div>
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
                          <div className={styles.matrixNodeTitleRow}>
                            <span className={styles.matrixNodeName}>{node.title}</span>
                            <span className={styles.matrixNodeSubtitle}>{node.subtitle}</span>
                          </div>
                          {node.laymanDesc && <p className={styles.matrixNodeLayman}>{node.laymanDesc}</p>}
                          <span className={styles.matrixNodeSpec}><strong>Tech:</strong> {node.specs}</span>
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
                              title={`Add ${matchingFeature.label} to scope`}
                            >
                              <Plus size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                              Add ({formatPricePair(matchingFeature.priceINR, matchingFeature.priceUSD, currency)})
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

      {/* Inspected Node Plain-English SLA Callout Tooltip */}
      {inspectedNode && (
        <div className={styles.inspectTooltip} role="status">
          <div className={styles.inspectLeft}>
            <div className={styles.inspectTitleRow}>
              <span className={styles.inspectTitle}>{inspectedNode.title}</span>
              <span
                className={`${styles.inspectStatusBadge} ${
                  isNodeActive(inspectedNode) ? styles.inspectStatusActive : styles.inspectStatusDormant
                }`}
              >
                {isNodeActive(inspectedNode) ? '● Active in Scope' : '○ Available Add-on'}
              </span>
            </div>
            {inspectedNode.laymanDesc && (
              <p className={styles.inspectLayman}>
                <strong>What it delivers:</strong> {inspectedNode.laymanDesc}
              </p>
            )}
            {inspectedNode.howItFits && (
              <p className={styles.inspectHowItFits}>
                <strong>System connection:</strong> {inspectedNode.howItFits}
              </p>
            )}
            <span className={styles.inspectSla}>
              <strong>Tech &amp; SLA:</strong> {inspectedNode.slaInfo} ({inspectedNode.specs})
            </span>
          </div>
          <div className={styles.inspectRight}>
            {!isNodeActive(inspectedNode) && inspectedNode.featureId && onAddFeature && (() => {
              const feat = allFeatures.find((f) => f.id === inspectedNode.featureId);
              const priceText = feat ? ` (${formatPricePair(feat.priceINR, feat.priceUSD, currency)})` : '';
              return (
                <button
                  type="button"
                  className={styles.quickAddBtn}
                  onClick={() => {
                    onAddFeature(inspectedNode.featureId!);
                    setInspectedNode(null);
                  }}
                  title={`Add ${inspectedNode.title} to scope`}
                >
                  <Plus size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Add Module{priceText}
                </button>
              );
            })()}
            {isNodeActive(inspectedNode) && (
              <span className={styles.activeCheckBadge}>
                <CheckCircle2 size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                In Blueprint
              </span>
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
