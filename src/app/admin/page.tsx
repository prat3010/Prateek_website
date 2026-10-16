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
} from 'lucide-react';
import styles from './admin.module.css';

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
  delivery_stage?: 'architecture' | 'engineering' | 'staging' | 'live';
  status?: string;
  onboarding_checklist?: Record<string, boolean | string>;
  deliverables?: {
    staging_url?: string;
    production_url?: string;
    github_repo?: string;
    figma_url?: string;
    signoff_pdf_url?: string;
  };
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
  const [activeTab, setActiveTab] = useState<'prospects' | 'clients' | 'subscribers'>('prospects');
  
  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [editingPitchId, setEditingPitchId] = useState<string | null>(null);
  const [editedPitchText, setEditedPitchText] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Clients state
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [stageEdits, setStageEdits] = useState<Record<string, string>>({});
  const [deliverableEdits, setDeliverableEdits] = useState<
    Record<string, { staging_url: string; production_url: string; github_repo: string; figma_url: string }>
  >({});
  const [savingScopeCode, setSavingScopeCode] = useState<string | null>(null);

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
          deliverables: deliv,
        }),
      });
      if (res.ok) {
        setActionMessage({ text: `Updated milestone & deliverables for Scope #${scope.scope_code}!` });
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
      ]).then(([leadsData, clientsData, subsData]) => {
        if (isMounted) {
          setLeads(leadsData.leads || []);
          setClients(clientsData.scopes || []);
          setSubscribers(subsData.subscribers || []);
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
                        <span className={styles.badge}>
                          {c.deposit_paid ? '✅ Deposit Paid' : '⏳ Pending Deposit'}
                        </span>
                      </div>

                      <div className={styles.emailBadge}>
                        <Mail size={14} /> {c.client_email || c.email || 'No email'}
                        {(c.client_phone || c.phone) ? ` • 📞 ${c.client_phone || c.phone}` : ''}
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
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            border: '1px solid var(--surface-glass-border)',
                            background: 'var(--surface-card)',
                            color: 'var(--color-text)',
                          }}
                        />
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
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            border: '1px solid var(--surface-glass-border)',
                            background: 'var(--surface-card)',
                            color: 'var(--color-text)',
                          }}
                        />
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
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            border: '1px solid var(--surface-glass-border)',
                            background: 'var(--surface-card)',
                            color: 'var(--color-text)',
                          }}
                        />
                      </div>

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
      </div>
    </div>
  );
}
