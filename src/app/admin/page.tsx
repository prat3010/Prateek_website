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
  Building2,
  Mail,
  ExternalLink,
  CheckCircle2,
  X,
  Lock,
  Zap,
  MessageSquare,
  Bot,
  Clock,
} from 'lucide-react';
import Portal from '@/components/ui/Portal';
import styles from './admin.module.css';

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
}

interface Lead {
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

interface ClientRecord {
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
  const [loadingIntakeLeads, setLoadingIntakeLeads] = useState(false);
  const [selectedLeadForDrawer, setSelectedLeadForDrawer] = useState<IntakeLeadRecord | null>(null);

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
      }
    } catch (err) {
      console.error('Failed to fetch intake leads:', err);
    } finally {
      setLoadingIntakeLeads(false);
    }
  };

  // Clients state
  const [clients, setClients] = useState<ClientRecord[]>([]);
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
          setSubscribers(subsData.subscribers || []);
          setIntakeLeads(intakeData.leads || []);
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLeadForDrawer]);

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
          <div>
            <div className={styles.actionsBar}>
              <button onClick={handleGenerateProspects} disabled={loadingLeads} className={styles.primaryBtn}>
                <Sparkles size={16} />
                <span>{loadingLeads ? 'Prospecting Web...' : 'Run AI Prospector'}</span>
              </button>
              <button onClick={fetchLeads} className={styles.secondaryBtn}>
                <RefreshCw size={16} />
                <span>Refresh Queue</span>
              </button>
            </div>

            {pendingLeads.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No pending pitches in queue. Click <strong>Run AI Prospector</strong> above to discover new leads!</p>
              </div>
            ) : (
              <div className={styles.queueGrid}>
                {pendingLeads.map(lead => {
                  const formats = parsePitchFormats(lead.ai_generated_pitch);
                  return (
                    <div key={lead.id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <div>
                          <h3 className={styles.leadName}>{lead.lead_name}</h3>
                          <p className={styles.leadMeta}>
                            <Building2 size={14} /> {lead.company} • {lead.role}
                          </p>
                        </div>
                        {lead.source_url && (
                          <a
                            href={lead.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.linkIcon}
                            aria-label={`Visit source website for ${lead.company}`}
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>

                      <div className={styles.emailBadge}>
                        <Mail size={14} /> {lead.email}
                      </div>

                      <div className={styles.pitchBox}>
                        {editingPitchId === lead.id ? (
                          <textarea
                            value={editedPitchText}
                            onChange={e => setEditedPitchText(e.target.value)}
                            className={styles.pitchTextarea}
                            aria-label="Edit pitch message text"
                            rows={6}
                          />
                        ) : (
                          <>
                            <p className={styles.pitchText}>{formats.email || lead.ai_generated_pitch}</p>
                            {formats.linkedin && (
                              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--surface-glass-border)' }}>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                  💼 LinkedIn Note ({formats.linkedin.length}/300):
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>
                                  {formats.linkedin}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className={styles.cardFooter}>
                        {editingPitchId === lead.id ? (
                          <button onClick={() => handleDispatch(lead.id, 'approve')} className={styles.approveBtn}>
                            <Send size={14} /> Save &amp; Dispatch Email
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingPitchId(lead.id);
                                setEditedPitchText(formats.email || lead.ai_generated_pitch);
                              }}
                              className={styles.editBtn}
                            >
                              Edit Pitch
                            </button>
                            <button onClick={() => handleDispatch(lead.id, 'reject')} className={styles.rejectBtn}>
                              <X size={14} /> Dismiss
                            </button>
                            <button onClick={() => handleDispatch(lead.id, 'approve')} className={styles.approveBtn}>
                              <Send size={14} /> 1-Click Approve &amp; Send
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Client Scopes & Accounts */}
        {activeTab === 'clients' && (
          <div>
            <div className={styles.actionsBar}>
              <button onClick={fetchClientScopes} className={styles.secondaryBtn}>
                <RefreshCw size={16} />
                <span>Refresh Client Scopes</span>
              </button>
            </div>
            <div className={styles.queueGrid}>
              {clients.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No active client scopes found in Supabase database.</p>
                </div>
              ) : (
                clients.map(c => {
                  const currentStage = stageEdits[c.scope_code] || c.delivery_stage || 'architecture';
                  const currentPayments = paymentEdits[c.scope_code] || {
                    deposit_paid: Boolean(c.deposit_paid),
                    balance_paid: Boolean(c.balance_paid),
                  };
                  const currentMaintStatus = maintenanceEdits[c.scope_code] ?? c.maintenance_status ?? 'inactive';
                  const currentDeliv = deliverableEdits[c.scope_code] || {
                    staging_url: c.deliverables?.staging_url || '',
                    production_url: c.deliverables?.production_url || '',
                    github_repo: c.deliverables?.github_repo || '',
                    figma_url: c.deliverables?.figma_url || '',
                  };
                  const checklist = c.onboarding_checklist || {};
                  const notes = Object.entries(checklist).filter(
                    ([k, v]) => k.endsWith('_note') && typeof v === 'string' && v.trim()
                  );

                  return (
                    <div key={c.id || c.scope_code} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <div>
                          <h3 className={styles.leadName}>
                            #{c.scope_code} — {c.company_name || 'Client Project'}
                          </h3>
                          <p className={styles.leadMeta}>
                            {c.base_engine || 'Custom Architecture'} •{' '}
                            {c.currency === 'USD'
                              ? `$${Number(c.total_cost_usd || 0).toLocaleString('en-US')}`
                              : `₹${Number(c.total_cost_inr || 0).toLocaleString('en-IN')}`}
                          </p>
                        </div>
                        <span
                          className={styles.badge}
                          style={{
                            background: (c.is_fully_paid || c.balance_paid)
                              ? 'rgba(34, 197, 94, 0.15)'
                              : c.deposit_paid
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(234, 179, 8, 0.15)',
                            borderColor: (c.is_fully_paid || c.balance_paid)
                              ? 'rgba(34, 197, 94, 0.35)'
                              : c.deposit_paid
                              ? 'rgba(56, 189, 248, 0.35)'
                              : 'rgba(234, 179, 8, 0.35)',
                            color: (c.is_fully_paid || c.balance_paid)
                              ? '#22c55e'
                              : c.deposit_paid
                              ? 'var(--color-accent)'
                              : '#eab308',
                          }}
                        >
                          {c.is_fully_paid || c.balance_paid
                            ? '✅ Fully Settled (100%)'
                            : c.deposit_paid
                            ? '🟢 Deposit Paid (50%)'
                            : '⏳ Pending Deposit'}
                        </span>
                      </div>

                      <div className={styles.emailBadge}>
                        <Mail size={14} /> {c.client_email || c.email || 'No email'}
                        {(c.client_phone || c.phone) ? ` • 📞 ${c.client_phone || c.phone}` : ''}
                      </div>

                      {/* Financial Milestones Override */}
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.6rem', padding: '0.5rem 0.75rem', background: 'var(--surface-elevated)', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--surface-glass-border)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--color-text)' }}>
                          <input
                            type="checkbox"
                            checked={currentPayments.deposit_paid}
                            onChange={e =>
                              setPaymentEdits(prev => ({
                                ...prev,
                                [c.scope_code]: { ...currentPayments, deposit_paid: e.target.checked },
                              }))
                            }
                          />
                          <span>Deposit Paid (50%)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--color-text)' }}>
                          <input
                            type="checkbox"
                            checked={currentPayments.balance_paid}
                            onChange={e =>
                              setPaymentEdits(prev => ({
                                ...prev,
                                [c.scope_code]: { ...currentPayments, balance_paid: e.target.checked },
                              }))
                            }
                          />
                          <span>Balance Paid (50%)</span>
                        </label>
                      </div>

                      {/* Maintenance Retainer State */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.6rem', padding: '0.55rem 0.75rem', background: 'var(--surface-elevated)', borderRadius: '6px', border: '1px solid var(--surface-glass-border)', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                            🛡️ Care Retainer: {c.maintenance_plan || 'Self-Managed'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              background: currentMaintStatus === 'active' ? 'rgba(34, 197, 94, 0.15)' : currentMaintStatus === 'paused' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                              color: currentMaintStatus === 'active' ? '#22c55e' : currentMaintStatus === 'paused' ? '#eab308' : 'var(--color-text-muted)',
                              border: `1px solid ${currentMaintStatus === 'active' ? 'rgba(34, 197, 94, 0.35)' : currentMaintStatus === 'paused' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
                            }}
                          >
                            {currentMaintStatus === 'active' ? '🟢 Active' : currentMaintStatus === 'paused' ? '⏸️ Paused' : currentMaintStatus === 'cancelled' ? '✕ Cancelled' : '⚪ Inactive'}
                          </span>
                        </div>
                        {c.maintenance_subscription_id && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                            Sub ID: {c.maintenance_subscription_id}
                            {c.maintenance_current_period_end ? ` • Renews: ${new Date(c.maintenance_current_period_end).toLocaleDateString()}` : ''}
                          </div>
                        )}
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.2rem' }}>
                          Retainer Status Override:
                          <select
                            value={currentMaintStatus}
                            onChange={e =>
                              setMaintenanceEdits(prev => ({ ...prev, [c.scope_code]: e.target.value }))
                            }
                            style={{
                              width: '100%',
                              marginTop: '0.2rem',
                              padding: '0.35rem',
                              borderRadius: '5px',
                              border: '1px solid var(--surface-glass-border)',
                              background: 'var(--surface-card)',
                              color: 'var(--color-text)',
                              fontSize: '0.75rem',
                            }}
                          >
                            <option value="inactive">Inactive / Unsubscribed</option>
                            <option value="active">Active (Paid Retainer)</option>
                            <option value="paused">Paused</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </label>
                      </div>

                      {notes.length > 0 && (
                        <div className={styles.pitchBox} style={{ marginTop: '0.5rem' }}>
                          <p style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            📋 Client Onboarding Links &amp; Notes:
                          </p>
                          {notes.map(([k, v]) => (
                            <p key={k} style={{ fontSize: '0.75rem', margin: '0.15rem 0', color: 'var(--color-text-muted)' }}>
                              <strong>{k.replace('_note', '')}:</strong> {String(v)}
                            </p>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                          Delivery Stage:
                          <select
                            value={currentStage}
                            onChange={e =>
                              setStageEdits(prev => ({ ...prev, [c.scope_code]: e.target.value }))
                            }
                            style={{
                              width: '100%',
                              marginTop: '0.25rem',
                              padding: '0.4rem',
                              borderRadius: '6px',
                              border: '1px solid var(--surface-glass-border)',
                              background: 'var(--surface-card)',
                              color: 'var(--color-text)',
                            }}
                          >
                            <option value="architecture">Phase 1: Architecture Blueprint</option>
                            <option value="engineering">Phase 2: Core Engineering</option>
                            <option value="staging">Phase 3: Staging &amp; QA</option>
                            <option value="live">Phase 4: Live in Production</option>
                          </select>
                        </label>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input
                            type="url"
                            placeholder="Staging Preview URL (https://...)"
                            value={currentDeliv.staging_url}
                            onChange={e =>
                              setDeliverableEdits(prev => ({
                                ...prev,
                                [c.scope_code]: { ...currentDeliv, staging_url: e.target.value },
                              }))
                            }
                            style={{
                              flex: 1,
                              padding: '0.4rem 0.6rem',
                              fontSize: '0.8rem',
                              borderRadius: '6px',
                              border: '1px solid var(--surface-glass-border)',
                              background: 'var(--surface-card)',
                              color: 'var(--color-text)',
                            }}
                          />
                          {currentDeliv.staging_url && (
                            <a
                              href={currentDeliv.staging_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.linkIcon}
                              title="Open Staging URL"
                              style={{ padding: '4px' }}
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input
                            type="url"
                            placeholder="Production Live URL (https://...)"
                            value={currentDeliv.production_url}
                            onChange={e =>
                              setDeliverableEdits(prev => ({
                                ...prev,
                                [c.scope_code]: { ...currentDeliv, production_url: e.target.value },
                              }))
                            }
                            style={{
                              flex: 1,
                              padding: '0.4rem 0.6rem',
                              fontSize: '0.8rem',
                              borderRadius: '6px',
                              border: '1px solid var(--surface-glass-border)',
                              background: 'var(--surface-card)',
                              color: 'var(--color-text)',
                            }}
                          />
                          {currentDeliv.production_url && (
                            <a
                              href={currentDeliv.production_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.linkIcon}
                              title="Open Production URL"
                              style={{ padding: '4px' }}
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input
                            type="url"
                            placeholder="GitHub Repo URL (https://github.com/...)"
                            value={currentDeliv.github_repo}
                            onChange={e =>
                              setDeliverableEdits(prev => ({
                                ...prev,
                                [c.scope_code]: { ...currentDeliv, github_repo: e.target.value },
                              }))
                            }
                            style={{
                              flex: 1,
                              padding: '0.4rem 0.6rem',
                              fontSize: '0.8rem',
                              borderRadius: '6px',
                              border: '1px solid var(--surface-glass-border)',
                              background: 'var(--surface-card)',
                              color: 'var(--color-text)',
                            }}
                          />
                          {currentDeliv.github_repo && (
                            <a
                              href={currentDeliv.github_repo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.linkIcon}
                              title="Open GitHub Repo"
                              style={{ padding: '4px' }}
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input
                            type="url"
                            placeholder="Figma Specs URL (https://figma.com/...)"
                            value={currentDeliv.figma_url}
                            onChange={e =>
                              setDeliverableEdits(prev => ({
                                ...prev,
                                [c.scope_code]: { ...currentDeliv, figma_url: e.target.value },
                              }))
                            }
                            style={{
                              flex: 1,
                              padding: '0.4rem 0.6rem',
                              fontSize: '0.8rem',
                              borderRadius: '6px',
                              border: '1px solid var(--surface-glass-border)',
                              background: 'var(--surface-card)',
                              color: 'var(--color-text)',
                            }}
                          />
                          {currentDeliv.figma_url && (
                            <a
                              href={currentDeliv.figma_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.linkIcon}
                              title="Open Figma Specs"
                              style={{ padding: '4px' }}
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Phase 2 Change Orders Section */}
                      {c.change_orders && c.change_orders.length > 0 && (
                        <div style={{ marginTop: '0.85rem', borderTop: '1px dashed var(--surface-glass-border)', paddingTop: '0.65rem' }}>
                          <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>
                            🔄 Phase 2 Change Orders ({c.change_orders.length}):
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {c.change_orders.map(co => {
                              const isPending = co.status === 'pending' || co.status === 'invoiced';
                              const isApproved = co.status === 'approved';
                              const isPaid = co.status === 'paid';
                              const isRejected = co.status === 'rejected';

                              return (
                                <div
                                  key={co.id}
                                  style={{
                                    background: 'var(--surface-elevated)',
                                    border: '1px solid var(--surface-glass-border)',
                                    borderRadius: '6px',
                                    padding: '0.5rem 0.65rem',
                                    fontSize: '0.78rem',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>#{co.change_order_number}</span>
                                    <span
                                      style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        background: isPaid ? 'rgba(34, 197, 94, 0.2)' : isApproved ? 'rgba(56, 189, 248, 0.2)' : isRejected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                        color: isPaid ? '#22c55e' : isApproved ? '#38bdf8' : isRejected ? '#ef4444' : '#eab308',
                                      }}
                                    >
                                      {co.status}
                                    </span>
                                  </div>
                                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                                    {co.added_features?.length > 0 && <span>+{co.added_features.join(', ')} • </span>}
                                    <strong>
                                      {c.currency === 'USD'
                                        ? `+$${Number(co.price_delta_usd || 0).toLocaleString('en-US')}`
                                        : `+₹${Number(co.price_delta_inr || 0).toLocaleString('en-IN')}`}
                                    </strong>
                                    {co.timeline_impact && ` (${co.timeline_impact})`}
                                  </div>
                                  {isPending && (
                                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleChangeOrderAction(co.id, 'approve')}
                                        disabled={actionLoadingCoId === co.id}
                                        style={{
                                          padding: '3px 8px',
                                          fontSize: '0.72rem',
                                          borderRadius: '4px',
                                          border: 'none',
                                          background: '#38bdf8',
                                          color: '#000',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        ✓ Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleChangeOrderAction(co.id, 'mark_paid')}
                                        disabled={actionLoadingCoId === co.id}
                                        style={{
                                          padding: '3px 8px',
                                          fontSize: '0.72rem',
                                          borderRadius: '4px',
                                          border: 'none',
                                          background: '#22c55e',
                                          color: '#000',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        💰 Mark Settled &amp; Merge
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleChangeOrderAction(co.id, 'reject')}
                                        disabled={actionLoadingCoId === co.id}
                                        style={{
                                          padding: '3px 8px',
                                          fontSize: '0.72rem',
                                          borderRadius: '4px',
                                          border: 'none',
                                          background: 'rgba(239, 68, 68, 0.2)',
                                          color: '#ef4444',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        ✕ Reject
                                      </button>
                                    </div>
                                  )}
                                  {isApproved && (
                                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleChangeOrderAction(co.id, 'mark_paid')}
                                        disabled={actionLoadingCoId === co.id}
                                        style={{
                                          padding: '3px 8px',
                                          fontSize: '0.72rem',
                                          borderRadius: '4px',
                                          border: 'none',
                                          background: '#22c55e',
                                          color: '#000',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        💰 Mark Settled &amp; Merge
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Invoices Ledger Summary */}
                      {c.invoices && c.invoices.length > 0 && (
                        <div style={{ marginTop: '0.65rem', borderTop: '1px dashed var(--surface-glass-border)', paddingTop: '0.5rem' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: '0 0 0.35rem 0', color: 'var(--color-text-muted)' }}>
                            🧾 Issued Invoices ({c.invoices.length}):
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {c.invoices.map(inv => (
                              <div
                                key={inv.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.72rem',
                                  background: 'var(--surface-elevated)',
                                  padding: '0.35rem 0.5rem',
                                  borderRadius: '4px',
                                }}
                              >
                                <span>
                                  <code>{inv.invoice_number}</code> ({inv.milestone_name})
                                </span>
                                <span style={{ fontWeight: 600, color: inv.payment_status === 'paid' ? '#22c55e' : '#eab308' }}>
                                  {inv.currency} {Number(inv.amount || 0).toLocaleString()} [{inv.payment_status.toUpperCase()}]
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={styles.cardFooter} style={{ marginTop: '0.75rem' }}>
                        <button
                          onClick={() => handleSaveScopeAdmin(c)}
                          disabled={savingScopeCode === c.scope_code}
                          className={styles.approveBtn}
                        >
                          <CheckCircle2 size={14} />{' '}
                          {savingScopeCode === c.scope_code
                            ? 'Saving...'
                            : 'Save Stage & Deliverables'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Retriever SaaS Subscribers */}
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
          <div>
            <div className={styles.actionsBar}>
              <button
                onClick={fetchIntakeLeads}
                disabled={loadingIntakeLeads}
                className={styles.secondaryBtn}
              >
                <RefreshCw size={16} />
                <span>{loadingIntakeLeads ? 'Refreshing...' : 'Refresh Leads & Chats'}</span>
              </button>
            </div>

            {intakeLeads.length === 0 ? (
              <div className={styles.emptyState}>
                <MessageSquare size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No Scoping Leads Captured Yet</h3>
                <p className={styles.emptySubtitle}>
                  Drafts, estimates, and AI copilot conversations started by prospective clients in /scoping will automatically appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {intakeLeads.map((lead) => {
                  const hasTranscript = Array.isArray(lead.chat_transcript) && lead.chat_transcript.length > 0;
                  const isSubmitted = lead.status === 'submitted' || lead.status === 'confirmed';

                  return (
                    <div
                      key={lead.id || lead.scope_code}
                      className={styles.clientCard}
                      style={{ borderLeft: `4px solid ${isSubmitted ? '#00E676' : '#38bdf8'}` }}
                    >
                      <div className={styles.cardHeader}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)' }}>
                              🏢 {lead.company_name || 'Anonymous Prospect'}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background: isSubmitted ? 'rgba(0, 230, 118, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                color: isSubmitted ? '#00E676' : '#38bdf8',
                                border: `1px solid ${isSubmitted ? 'rgba(0, 230, 118, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                              }}
                            >
                              {lead.status}
                            </span>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                              }}
                            >
                              Code: {lead.scope_code}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Email: <strong style={{ color: 'var(--color-text)' }}>{lead.contact_email}</strong>
                            {lead.contact_phone && <span> • Phone: {lead.contact_phone}</span>}
                            <span> • Captured: {lead.created_at ? new Date(lead.created_at).toLocaleString() : 'Unknown'}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {hasTranscript ? (
                            <button
                              onClick={() => setSelectedLeadForDrawer(lead)}
                              className={styles.leadChatBadge}
                            >
                              <Bot size={13} />
                              <span>💬 View Copilot Chat ({lead.chat_transcript?.length} msgs)</span>
                            </button>
                          ) : lead.chat_session_id ? (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                              Session: {lead.chat_session_id.slice(0, 8)}...
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', opacity: 0.7 }}>
                              No Chat History
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.82rem' }}>
                        <div style={{ background: 'var(--surface-elevated)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.72rem' }}>BASE ARCHITECTURE</span>
                          <strong>{lead.base_engine_title || lead.base_engine_id}</strong>
                        </div>
                        <div style={{ background: 'var(--surface-elevated)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.72rem' }}>ESTIMATED TOTAL</span>
                          <strong>₹{Number(lead.total_cost_inr || 0).toLocaleString()} / ${Number(lead.total_cost_usd || 0).toLocaleString()}</strong>
                        </div>
                        <div style={{ background: 'var(--surface-elevated)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.72rem' }}>ACTIVE FEATURES</span>
                          <span>{(lead.selected_features || []).length} module(s) selected</span>
                        </div>
                        <div style={{ background: 'var(--surface-elevated)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.72rem' }}>TIMELINE &amp; CARE</span>
                          <span>{lead.timeline || 'Standard'} • {lead.maintenance_plan || 'No Care'}</span>
                        </div>
                      </div>

                      {lead.project_goal && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'rgba(0,0,0,0.1)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                          <strong>Project Goal:</strong> {lead.project_goal}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Lead Chat Transcript Drawer Modal */}
        {selectedLeadForDrawer && (
          <Portal>
            <div
              className={styles.drawerOverlay}
              onClick={() => setSelectedLeadForDrawer(null)}
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
                    onClick={() => setSelectedLeadForDrawer(null)}
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
