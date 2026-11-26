'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Users,
  Send,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  X,
  Lock,
  Zap,
  MessageSquare,
  Bot,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import Portal from '@/components/ui/Portal';
import styles from './admin.module.css';
import { OutreachQueueTab } from '@/components/admin/OutreachQueueTab';
import { ClientsLedgerTab } from '@/components/admin/ClientsLedgerTab';
import { IntakeLeadsTab } from '@/components/admin/IntakeLeadsTab';

export interface IntakeLeadRecord {
  id: string;
  draft_token: string;
  scope_code: string;
  company_name: string;
  contact_email: string;
  contact_phone?: string;
  project_goal?: string;
  target_audience?: string;
  base_engine_id: string;
  base_engine_title: string;
  selected_features?: string[];
  brand_asset_option?: string;
  maintenance_plan?: string;
  total_cost_inr: number;
  total_cost_usd: number;
  timeline?: string;
  status: string;
  chat_session_id?: string;
  chat_transcript?: Array<{ role: string; content: string; timestamp?: string }>;
  created_at: string;
  visitor_country?: string;
  model_used?: string;
  latency_ms?: number;
  agent_intent?: string;
  agent_reasoning?: string;
  turn_count?: number;
}

export interface Lead {
  id: string;
  lead_name: string;
  company: string;
  role: string;
  email: string;
  source_url: string;
  ai_generated_pitch: string;
  status: 'pending' | 'sent' | 'rejected';
  created_at: string;
}

export interface ClientRecord {
  id: string;
  scope_code: string;
  client_email?: string;
  email?: string;
  company_name: string;
  client_phone?: string;
  phone?: string;
  base_engine?: string;
  total_cost_inr?: number;
  total_cost_usd?: number;
  currency?: string;
  deposit_paid?: boolean;
  balance_paid?: boolean;
  is_fully_paid?: boolean;
  delivery_stage?: 'architecture' | 'engineering' | 'staging' | 'live';
  status?: string;
  maintenance_plan?: string;
  maintenance_status?: 'inactive' | 'active' | 'paused' | 'cancelled';
  maintenance_subscription_id?: string;
  maintenance_current_period_end?: string;
  onboarding_checklist?: Record<string, boolean | string>;
  deliverables?: {
    staging_url?: string;
    production_url?: string;
    github_repo?: string;
    figma_url?: string;
    signoff_pdf_url?: string;
  };
  change_orders?: Array<{
    id: string;
    scope_id: string;
    change_order_number: string;
    requested_by_email: string;
    added_features: string[];
    removed_features: string[];
    price_delta_inr: number;
    price_delta_usd: number;
    timeline_impact?: string;
    status: 'pending' | 'invoiced' | 'approved' | 'paid' | 'rejected';
    invoice_id?: string;
    created_at: string;
  }>;
  invoices?: Array<{
    id: string;
    invoice_number: string;
    amount: number;
    currency: string;
    payment_status: string;
    milestone_name: string;
    payment_url?: string;
    created_at: string;
  }>;
  created_at: string;
}

import { isAdminEmail } from '@/lib/auth';

interface PitchFormats {
  email: string;
  linkedin?: string;
  coverLetter?: string;
}

function parsePitchFormats(raw: string): PitchFormats {
  if (!raw) return { email: '' };
  try {
    if (raw.trim().startsWith('{')) {
      const parsed = JSON.parse(raw);
      if (parsed.email) {
        return {
          email: parsed.email || '',
          linkedin: parsed.linkedin || '',
          coverLetter: parsed.cover_letter || '',
        };
      }
    }
  } catch {
    // Fallback to raw text
  }
  return { email: raw };
}

export interface SubscriberRecord {
  id: string;
  tenantId: string;
  workspaceName: string;
  ownerEmail: string;
  planTier: string;
  isActive: boolean;
  isPaidSubscription: boolean;
  isExpired: boolean;
  trialDaysRemaining: number;
  razorpaySubscriptionId: string;
  monthlyTokenLimit: number;
  tokensUsedThisMonth: number;
  currentPeriodEnd: string | null;
  hasApiKey: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInvoiceRecord {
  id: string;
  scope_id?: string;
  invoice_number: string;
  amount: number;
  currency: string;
  payment_status: string;
  milestone_name: string;
  customer_email?: string;
  customer_name?: string;
  payment_url?: string;
  created_at: string;
}

export interface AdminScopingTraceRecord {
  id: string;
  session_id: string;
  scope_code?: string;
  turn_index: number;
  user_query: string;
  assistant_response: string;
  agent_intent?: string;
  agent_reasoning?: string;
  model_used?: string;
  latency_ms?: number;
  currency?: string;
  quote_inr?: number;
  quote_usd?: number;
  visitor_country?: string;
  user_email?: string;
  created_at: string;
}

export default function AdminControlCenter() {
  const { user, loading: authLoading, loginWithGoogle, logout, getAccessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'prospects' | 'clients' | 'subscribers' | 'leads'>('prospects');
  
  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [editingPitchId, setEditingPitchId] = useState<string | null>(null);
  const [editedPitchText, setEditedPitchText] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Scoping Intake Leads & Chats state
  const [intakeLeads, setIntakeLeads] = useState<IntakeLeadRecord[]>([]);
  const [scopingTraces, setScopingTraces] = useState<AdminScopingTraceRecord[]>([]);
  const [loadingIntakeLeads, setLoadingIntakeLeads] = useState(false);
  const [selectedLeadForDrawer, setSelectedLeadForDrawer] = useState<IntakeLeadRecord | null>(null);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [isSendingPitch, setIsSendingPitch] = useState(false);
  const [leadPitchDraft, setLeadPitchDraft] = useState<{
    subject: string;
    emailBody: string;
    keyPainPoints: string[];
  } | null>(null);
  const [hasCopiedProposal, setHasCopiedProposal] = useState(false);

  const fetchIntakeLeads = async () => {
    setLoadingIntakeLeads(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/admin/intake-leads', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setIntakeLeads(data.leads || []);
        if (Array.isArray(data.traces)) {
          setScopingTraces(data.traces);
        }
      }
    } catch (err) {
      console.error('Failed to fetch intake leads:', err);
    } finally {
      setLoadingIntakeLeads(false);
    }
  };

  // Clients state
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [allInvoices, setAllInvoices] = useState<AdminInvoiceRecord[]>([]);
  const [stageEdits, setStageEdits] = useState<Record<string, string>>({});
  const [paymentEdits, setPaymentEdits] = useState<
    Record<string, { deposit_paid: boolean; balance_paid: boolean }>
  >({});
  const [maintenanceEdits, setMaintenanceEdits] = useState<Record<string, string>>({});
  const [deliverableEdits, setDeliverableEdits] = useState<
    Record<string, { staging_url: string; production_url: string; github_repo: string; figma_url: string }>
  >({});
  const [savingScopeCode, setSavingScopeCode] = useState<string | null>(null);
  const [actionLoadingCoId, setActionLoadingCoId] = useState<string | null>(null);

  // Retriever SaaS Subscribers state
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/rag/admin-subscribers', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
      }
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const fetchClientScopes = async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/client/get-scopes?all=true', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.scopes || []);
        if (Array.isArray(data.allInvoices)) {
          setAllInvoices(data.allInvoices);
        }
      }
    } catch (err) {
      console.error('Failed to fetch client scopes:', err);
    }
  };

  const handleSaveScopeAdmin = async (scope: ClientRecord) => {
    setSavingScopeCode(scope.scope_code);
    try {
      const token = await getAccessToken();
      const newStage = stageEdits[scope.scope_code] || scope.delivery_stage || 'architecture';
      const payments = paymentEdits[scope.scope_code] || {
        deposit_paid: Boolean(scope.deposit_paid),
        balance_paid: Boolean(scope.balance_paid),
      };
      const maintStatus = maintenanceEdits[scope.scope_code] || scope.maintenance_status || 'inactive';
      const deliv = deliverableEdits[scope.scope_code] || {
        staging_url: scope.deliverables?.staging_url || '',
        production_url: scope.deliverables?.production_url || '',
        github_repo: scope.deliverables?.github_repo || '',
        figma_url: scope.deliverables?.figma_url || '',
      };
      const res = await fetch('/api/client/save-scope', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          scopeCode: scope.scope_code,
          companyName: scope.company_name,
          contactPhone: scope.client_phone || scope.phone || '',
          baseEngineTitle: scope.base_engine || 'Full-Stack Web Engine',
          currency: scope.currency || 'INR',
          deliveryStage: newStage,
          depositPaid: payments.deposit_paid,
          balancePaid: payments.balance_paid,
          isFullyPaid: payments.deposit_paid && payments.balance_paid,
          maintenanceStatus: maintStatus,
          deliverables: deliv,
        }),
      });
      if (res.ok) {
        setActionMessage({ text: `Updated milestone, payments & deliverables for Scope #${scope.scope_code}!` });
        await fetchClientScopes();
      } else {
        const err = await res.json().catch(() => ({}));
        setActionMessage({ text: err.error || 'Failed to update scope.', isError: true });
      }
    } catch {
      setActionMessage({ text: 'Network error updating client scope.', isError: true });
    } finally {
      setSavingScopeCode(null);
    }
  };

  const handleChangeOrderAction = async (changeOrderId: string, action: 'approve' | 'reject' | 'mark_paid') => {
    setActionLoadingCoId(changeOrderId);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/client/change-orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ changeOrderId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const actionLabel = action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Settled & Merged';
        setActionMessage({ text: `Change order #${data.changeOrder?.change_order_number || changeOrderId} ${actionLabel} successfully!` });
        await fetchClientScopes();
      } else {
        setActionMessage({ text: data.error || 'Failed to update change order.', isError: true });
      }
    } catch {
      setActionMessage({ text: 'Network error updating change order.', isError: true });
    } finally {
      setActionLoadingCoId(null);
    }
  };

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/outreach/get-leads', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (user && isAdminEmail(user.email)) {
      Promise.all([
        getAccessToken().then(token =>
          fetch('/api/outreach/get-leads', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }).then(r => r.ok ? r.json() : { leads: [] })
        ),
        getAccessToken().then(token =>
          fetch('/api/client/get-scopes?all=true', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }).then(r => r.ok ? r.json() : { scopes: [] })
        ),
        getAccessToken().then(token =>
          fetch('/api/rag/admin-subscribers', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }).then(r => r.ok ? r.json() : { subscribers: [] })
        ),
        getAccessToken().then(token =>
          fetch('/api/admin/intake-leads', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }).then(r => r.ok ? r.json() : { leads: [] })
        ),
      ]).then(([leadsData, clientsData, subsData, intakeData]) => {
        if (isMounted) {
          setLeads(leadsData.leads || []);
          setClients(clientsData.scopes || []);
          if (Array.isArray(clientsData.allInvoices)) {
            setAllInvoices(clientsData.allInvoices);
          }
          setSubscribers(subsData.subscribers || []);
          setIntakeLeads(intakeData.leads || []);
          if (Array.isArray(intakeData.traces)) {
            setScopingTraces(intakeData.traces);
          }
        }
      }).catch(err => {
        console.error('Failed to load admin data:', err);
      });
    }
    return () => { isMounted = false; };
  }, [user, getAccessToken]);

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  useEffect(() => {
    if (!selectedLeadForDrawer) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedLeadForDrawer(null);
        setLeadPitchDraft(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLeadForDrawer]);

  const handleGenerateLeadPitch = async (lead: IntakeLeadRecord) => {
    setIsGeneratingPitch(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/admin/draft-pitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ leadId: lead.id, action: 'draft' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.draft) {
        setLeadPitchDraft(data.draft);
      } else {
        setActionMessage({ text: data.error || 'Failed to generate proposal draft.', isError: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionMessage({ text: `Proposal generation error: ${msg}`, isError: true });
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handleSendLeadPitch = async () => {
    if (!selectedLeadForDrawer || !leadPitchDraft) return;
    setIsSendingPitch(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/admin/draft-pitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          leadId: selectedLeadForDrawer.id,
          action: 'send',
          subject: leadPitchDraft.subject,
          emailBody: leadPitchDraft.emailBody,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setActionMessage({ text: data.message || `Proposal dispatched to ${selectedLeadForDrawer.contact_email}!` });
        setSelectedLeadForDrawer((prev) => (prev ? { ...prev, status: 'contacted' } : null));
        fetchIntakeLeads();
      } else {
        setActionMessage({ text: data.error || 'Failed to send proposal.', isError: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionMessage({ text: `Proposal dispatch error: ${msg}`, isError: true });
    } finally {
      setIsSendingPitch(false);
    }
  };

  const handleCopyProposalToClipboard = async () => {
    if (!leadPitchDraft) return;
    const fullText = `Subject: ${leadPitchDraft.subject}\n\n${leadPitchDraft.emailBody}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setHasCopiedProposal(true);
      setTimeout(() => setHasCopiedProposal(false), 2500);
      setActionMessage({ text: 'Copied executive proposal to clipboard!' });
    } catch {
      setActionMessage({ text: 'Unable to write to clipboard.', isError: true });
    }
  };

  const handleGenerateProspects = async () => {
    setLoadingLeads(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/outreach/prospect', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setActionMessage({ text: data.message || 'Generated new prospect pitches!' });
        fetchLeads();
      } else {
        setActionMessage({ text: data.error || 'Failed to trigger AI prospector.', isError: true });
      }
    } catch {
      setActionMessage({ text: 'Network error triggering AI prospector.', isError: true });
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleDispatch = async (leadId: string, action: 'approve' | 'reject') => {
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/outreach/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          leadId,
          action,
          editedPitch: editingPitchId === leadId ? editedPitchText : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setActionMessage({ text: data.message || 'Action processed successfully' });
        setEditingPitchId(null);
        fetchLeads();
      } else {
        setActionMessage({ text: data.error || 'Failed to process dispatch action.', isError: true });
      }
    } catch {
      setActionMessage({ text: 'Network error processing dispatch action.', isError: true });
    }
  };

  if (authLoading) {
    return (
      <div className={styles.authCenterWrapper}>
        <p style={{ color: 'var(--color-text-muted)' }}>Verifying admin authentication credentials...</p>
      </div>
    );
  }

  // 1. Unauthenticated Login Gate
  if (!user) {
    return (
      <div className={styles.authCenterWrapper}>
        <div className={styles.authGateCard}>
          <div className={styles.authIconCircle}>
            <Lock size={24} />
          </div>
          <h2 className={styles.authTitle}>Restricted Admin Workspace</h2>
          <p className={styles.authSubtitle}>
            This workspace is protected. Sign in with your administrator Google account to access client ledgers and outreach controls.
          </p>
          <button
            onClick={() => loginWithGoogle('/admin')}
            className={styles.primaryBtn}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Sign in with Google OAuth
          </button>
        </div>
      </div>
    );
  }

  // 2. Non-Admin Access Denied Gate
  if (!isAdminEmail(user.email)) {
    return (
      <div className={styles.authCenterWrapper}>
        <div className={styles.authGateCard}>
          <div className={styles.authAlertCircle}>
            <ShieldAlert size={24} />
          </div>
          <h2 className={styles.authTitle}>403 Access Denied</h2>
          <p className={styles.authSubtitle}>
            Logged in as <strong>{user.email}</strong>. This email does not have administrator privileges for Prateeq Sharma Workspace.
          </p>
          <button onClick={logout} className={styles.secondaryBtn} style={{ width: '100%', justifyContent: 'center' }}>
            Sign Out &amp; Switch Account
          </button>
        </div>
      </div>
    );
  }

  // 3. Authorized Admin Control Center Dashboard
  const pendingLeads = leads.filter(l => l.status === 'pending');

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* Header Navigation */}
        <div className={styles.header}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/analytics" className={styles.backLink}>
              <ArrowLeft size={18} />
              <span>Public Visitor Analytics</span>
            </Link>
            <Link href="/dashboard?preview=client" className={styles.backLink}>
              <Users size={16} />
              <span>Preview Client Portal</span>
            </Link>
            <a
              href="https://admin.rag.prateeq.in"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.backLink}
              style={{ color: 'var(--pop-blue)', fontWeight: 600 }}
            >
              <Zap size={16} />
              <span>Retriever SaaS Portal (admin.rag.prateeq.in)</span>
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={styles.badge}>
              <ShieldCheck size={14} />
              <span>Admin Verified: {user.email}</span>
            </div>
            <button onClick={logout} className={styles.logoutBtn} aria-label="Sign Out" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className={styles.titleSection}>
          <h1 className={styles.title}>🛡️ Prateek Sharma Master Admin Control Center</h1>
          <p className={styles.subtitle}>
            Manage client proposals, active workspaces, Razorpay ledgers, and 24/7 autonomous outreach prospecting.
          </p>
        </div>

        {/* Workspace Tabs */}
        <div className={styles.tabContainer}>
          <button
            onClick={() => setActiveTab('prospects')}
            className={`${styles.tabBtn} ${activeTab === 'prospects' ? styles.tabActive : ''}`}
          >
            {activeTab === 'prospects' && (
              <m.span
                layoutId="adminTabPill"
                className={styles.tabPill}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <Sparkles size={16} style={{ position: 'relative', zIndex: 1 }} />
            <span style={{ position: 'relative', zIndex: 1 }}>Autonomous Outreach ({pendingLeads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`${styles.tabBtn} ${activeTab === 'clients' ? styles.tabActive : ''}`}
          >
            {activeTab === 'clients' && (
              <m.span
                layoutId="adminTabPill"
                className={styles.tabPill}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <Users size={16} style={{ position: 'relative', zIndex: 1 }} />
            <span style={{ position: 'relative', zIndex: 1 }}>Client Scopes &amp; Ledgers ({clients.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`${styles.tabBtn} ${activeTab === 'subscribers' ? styles.tabActive : ''}`}
          >
            {activeTab === 'subscribers' && (
              <m.span
                layoutId="adminTabPill"
                className={styles.tabPill}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <Zap size={16} style={{ position: 'relative', zIndex: 1 }} />
            <span style={{ position: 'relative', zIndex: 1 }}>⚡ Retriever Subscribers ({subscribers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`${styles.tabBtn} ${activeTab === 'leads' ? styles.tabActive : ''}`}
          >
            {activeTab === 'leads' && (
              <m.span
                layoutId="adminTabPill"
                className={styles.tabPill}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <MessageSquare size={16} style={{ position: 'relative', zIndex: 1 }} />
            <span style={{ position: 'relative', zIndex: 1 }}>💬 Scoping Leads &amp; Chats ({intakeLeads.length})</span>
          </button>
        </div>

        {actionMessage && (
          <div className={actionMessage.isError ? styles.errorMessageBanner : styles.messageBanner}>
            {actionMessage.isError ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Autonomous Prospecting */}
        {activeTab === 'prospects' && (
          <OutreachQueueTab {...{ handleGenerateProspects, loadingLeads, fetchLeads, pendingLeads, parsePitchFormats, editingPitchId, setEditingPitchId, editedPitchText, setEditedPitchText, handleDispatch }} />
        )}

        {activeTab === 'clients' && (
          <ClientsLedgerTab {...{ fetchClientScopes, clients, allInvoices, stageEdits, setStageEdits, paymentEdits, setPaymentEdits, maintenanceEdits, setMaintenanceEdits, deliverableEdits, setDeliverableEdits, savingScopeCode, handleSaveScopeAdmin, actionLoadingCoId, handleChangeOrderAction }} />
        )}

        {activeTab === 'subscribers' && (
          <div>
            <div className={styles.actionsBar}>
              <button
                onClick={fetchSubscribers}
                disabled={loadingSubscribers}
                className={styles.secondaryBtn}
              >
                <RefreshCw size={16} />
                <span>{loadingSubscribers ? 'Refreshing...' : 'Refresh Subscribers'}</span>
              </button>
            </div>

            {subscribers.length === 0 ? (
              <div className={styles.emptyState}>
                <Zap size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No Retriever Subscribers Yet</h3>
                <p className={styles.emptySubtitle}>
                  Workspaces and paying subscribers from /rag and /rag/app will automatically appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {subscribers.map((sub) => {
                  const isPaid = sub.isPaidSubscription;
                  const isExp = sub.isExpired;
                  const tierColor =
                    sub.planTier === 'business'
                      ? '#8b5cf6'
                      : sub.planTier === 'pro'
                      ? '#00E676'
                      : '#38bdf8';

                  return (
                    <div
                      key={sub.id || sub.tenantId}
                      className={styles.clientCard}
                      style={{ borderLeft: `4px solid ${tierColor}` }}
                    >
                      <div className={styles.cardHeader}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)' }}>
                              ⚡ {sub.workspaceName}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background: `${tierColor}20`,
                                color: tierColor,
                                border: `1px solid ${tierColor}60`,
                              }}
                            >
                              {sub.planTier}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                background: isExp ? 'rgba(239, 68, 68, 0.15)' : isPaid ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 179, 0, 0.15)',
                                color: isExp ? '#ef4444' : isPaid ? '#00E676' : '#FFB300',
                              }}
                            >
                              {isExp
                                ? '🔒 Expired / Cancelled'
                                : isPaid
                                ? '⚡ Paid Active'
                                : `⏱️ ${sub.trialDaysRemaining}d Trial Remaining`}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Owner: <strong style={{ color: 'var(--color-text)' }}>{sub.ownerEmail}</strong> • Tenant: <code style={{ fontSize: '0.75rem' }}>{sub.tenantId}</code>
                          </div>
                        </div>

                        <a
                          href="https://admin.rag.prateeq.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.secondaryBtn}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          <Zap size={13} />
                          <span>Open Retriever Admin</span>
                        </a>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.82rem' }}>
                        <div style={{ background: 'var(--surface-elevated)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.72rem' }}>MONTHLY TOKENS</span>
                          <strong>{Number(sub.tokensUsedThisMonth).toLocaleString()}</strong> / {Number(sub.monthlyTokenLimit).toLocaleString()}
                        </div>
                        <div style={{ background: 'var(--surface-elevated)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.72rem' }}>RAZORPAY SUB ID</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{sub.razorpaySubscriptionId || 'None (Free Trial)'}</span>
                        </div>
                        <div style={{ background: 'var(--surface-elevated)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.72rem' }}>API KEY PROVISIONED</span>
                          <span style={{ color: sub.hasApiKey ? '#00E676' : '#FFB300' }}>{sub.hasApiKey ? '✓ Stored (ret_live_...)' : 'Pending Minting'}</span>
                        </div>
                        <div style={{ background: 'var(--surface-elevated)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.72rem' }}>JOINED</span>
                          <span>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Scoping Leads & Copilot Chats */}
        {activeTab === 'leads' && (
          <IntakeLeadsTab {...{ fetchIntakeLeads, loadingIntakeLeads, intakeLeads, scopingTraces, setSelectedLeadForDrawer, setLeadPitchDraft }} />
        )}

        {/* Lead Chat Transcript Drawer Modal */}
        {selectedLeadForDrawer && (
          <Portal>
            <div
              className={styles.drawerOverlay}
              onClick={() => {
                setSelectedLeadForDrawer(null);
                setLeadPitchDraft(null);
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-title"
            >
              <div
                className={styles.drawerContainer}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.drawerHeader}>
                  <div>
                    <h3 id="drawer-title" className={styles.drawerTitle}>
                      <Bot size={18} />
                      <span>Copilot Scoping Session Transcript</span>
                    </h3>
                    <p className={styles.drawerSubtitle}>
                      {selectedLeadForDrawer.company_name || 'Anonymous'} • {selectedLeadForDrawer.contact_email} • Code: {selectedLeadForDrawer.scope_code}
                    </p>
                  </div>
                  <button
                    className={styles.drawerCloseBtn}
                    onClick={() => {
                      setSelectedLeadForDrawer(null);
                      setLeadPitchDraft(null);
                    }}
                    aria-label="Close chat transcript"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className={styles.drawerBody}>
                  {/* Lead Summary Bar */}
                  <div className={styles.leadDetailsSummary}>
                    <div className={styles.leadDetailItem}>
                      <span className={styles.leadDetailLabel}>ENGINE</span>
                      <span className={styles.leadDetailVal}>{selectedLeadForDrawer.base_engine_title || selectedLeadForDrawer.base_engine_id}</span>
                    </div>
                    <div className={styles.leadDetailItem}>
                      <span className={styles.leadDetailLabel}>ESTIMATE</span>
                      <span className={styles.leadDetailVal}>₹{Number(selectedLeadForDrawer.total_cost_inr || 0).toLocaleString()} / ${Number(selectedLeadForDrawer.total_cost_usd || 0).toLocaleString()}</span>
                    </div>
                    <div className={styles.leadDetailItem}>
                      <span className={styles.leadDetailLabel}>MODULES</span>
                      <span className={styles.leadDetailVal}>{(selectedLeadForDrawer.selected_features || []).length} active</span>
                    </div>
                    <div className={styles.leadDetailItem}>
                      <span className={styles.leadDetailLabel}>TIMELINE</span>
                      <span className={styles.leadDetailVal}>{selectedLeadForDrawer.timeline || '4-6 weeks'}</span>
                    </div>
                  </div>

                  {/* Cognitive Observability & Agent Reasoning */}
                  <div style={{
                    margin: '0.75rem 0',
                    padding: '0.75rem 1rem',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Bot size={15} />
                        <span>Cognitive Intelligence &amp; Agent Reasoning</span>
                      </strong>
                      <div style={{ display: 'flex', gap: '6px', fontSize: '0.72rem' }}>
                        {selectedLeadForDrawer.visitor_country && selectedLeadForDrawer.visitor_country !== 'Unknown' && (
                          <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}>
                            🌍 {selectedLeadForDrawer.visitor_country}
                          </span>
                        )}
                        {selectedLeadForDrawer.model_used && (
                          <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}>
                            🧠 {selectedLeadForDrawer.model_used}
                          </span>
                        )}
                        {selectedLeadForDrawer.latency_ms ? (
                          <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}>
                            ⏱️ {selectedLeadForDrawer.latency_ms}ms
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {selectedLeadForDrawer.agent_intent && (
                      <div style={{ marginBottom: '4px', color: 'var(--color-text)' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Classified Intent: </span>
                        <strong>{selectedLeadForDrawer.agent_intent}</strong>
                      </div>
                    )}

                    {selectedLeadForDrawer.agent_reasoning && (
                      <div style={{ color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                        <span style={{ color: 'var(--color-text)' }}>Rationale: </span>
                        {selectedLeadForDrawer.agent_reasoning}
                      </div>
                    )}
                  </div>

                  {/* 1-Click AI Executive Proposal Drafter */}
                  <div className={styles.proposalSection}>
                    <div className={styles.proposalSectionHeader}>
                      <div className={styles.proposalHeaderTitle}>
                        <Sparkles size={16} style={{ color: '#00E676' }} />
                        <span>AI Executive Proposal Drafter</span>
                      </div>
                      {!leadPitchDraft && (
                        <button
                          type="button"
                          className={styles.generateProposalBtn}
                          onClick={() => handleGenerateLeadPitch(selectedLeadForDrawer)}
                          disabled={isGeneratingPitch}
                        >
                          <Zap size={14} />
                          <span>{isGeneratingPitch ? 'Drafting Proposal with Gemini...' : '⚡ Generate AI Proposal Draft'}</span>
                        </button>
                      )}
                    </div>

                    {leadPitchDraft && (
                      <div className={styles.proposalCard}>
                        {leadPitchDraft.keyPainPoints && leadPitchDraft.keyPainPoints.length > 0 && (
                          <div className={styles.painPointsRow}>
                            <span className={styles.painPointsLabel}>Key Pain Points:</span>
                            {leadPitchDraft.keyPainPoints.map((pt, i) => (
                              <span key={i} className={styles.painPointPill}>
                                • {pt}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className={styles.proposalInputGroup}>
                          <label className={styles.proposalLabel}>Email Subject</label>
                          <input
                            type="text"
                            className={styles.proposalSubjectInput}
                            value={leadPitchDraft.subject}
                            onChange={(e) =>
                              setLeadPitchDraft((prev) =>
                                prev ? { ...prev, subject: e.target.value } : null
                              )
                            }
                          />
                        </div>

                        <div className={styles.proposalInputGroup}>
                          <label className={styles.proposalLabel}>Email Body (Editable)</label>
                          <textarea
                            className={styles.proposalTextarea}
                            rows={8}
                            value={leadPitchDraft.emailBody}
                            onChange={(e) =>
                              setLeadPitchDraft((prev) =>
                                prev ? { ...prev, emailBody: e.target.value } : null
                              )
                            }
                          />
                        </div>

                        <div className={styles.proposalActionRow}>
                          <button
                            type="button"
                            className={styles.copyProposalBtn}
                            onClick={handleCopyProposalToClipboard}
                          >
                            {hasCopiedProposal ? <Check size={14} /> : <Copy size={14} />}
                            <span>{hasCopiedProposal ? 'Copied to Clipboard!' : 'Copy Proposal'}</span>
                          </button>

                          {(!selectedLeadForDrawer.contact_email ||
                          !selectedLeadForDrawer.contact_email.includes('@') ||
                          selectedLeadForDrawer.contact_email.toLowerCase().endsWith('@unauthenticated.client')) ? (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                color: '#f59e0b',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                              }}
                            >
                              <span>⚠️ Unauthenticated prospect (Email dispatch disabled)</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className={styles.sendProposalBtn}
                              onClick={handleSendLeadPitch}
                              disabled={isSendingPitch}
                            >
                              <Send size={14} />
                              <span>{isSendingPitch ? 'Dispatching via Resend...' : `Send to ${selectedLeadForDrawer.contact_email}`}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className={styles.regenerateProposalBtn}
                            onClick={() => handleGenerateLeadPitch(selectedLeadForDrawer)}
                            disabled={isGeneratingPitch}
                          >
                            <RefreshCw size={13} className={isGeneratingPitch ? 'animate-spin' : ''} />
                            <span>Regenerate</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Messages */}
                  {(!selectedLeadForDrawer.chat_transcript || selectedLeadForDrawer.chat_transcript.length === 0) ? (
                    <div className={styles.emptyState}>
                      <p>No chat messages recorded for this lead session.</p>
                    </div>
                  ) : (
                    selectedLeadForDrawer.chat_transcript.map((msg, idx) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div key={idx} className={isUser ? styles.chatBubbleUser : styles.chatBubbleAssistant}>
                          <div className={styles.chatMetaRow}>
                            <span>{isUser ? '👤 Prospect' : '🤖 Scoping Copilot (Retriever)'}</span>
                            {msg.timestamp && (
                              <span>
                                <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div className={styles.chatBubbleText}>{msg.content}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </Portal>
        )}
      </div>
    </div>
  );
}
