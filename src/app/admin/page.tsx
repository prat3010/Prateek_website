'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  email: string;
  company_name: string;
  phone: string;
  created_at: string;
}

import { isAdminEmail } from '@/lib/auth';

export default function AdminControlCenter() {
  const { user, loading: authLoading, loginWithGoogle, logout, getAccessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'prospects' | 'clients'>('prospects');
  
  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [editingPitchId, setEditingPitchId] = useState<string | null>(null);
  const [editedPitchText, setEditedPitchText] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Clients state
  const [clients, setClients] = useState<ClientRecord[]>([]);

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
          fetch('/api/client/get-scopes', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }).then(r => r.ok ? r.json() : { scopes: [] })
        )
      ]).then(([leadsData, clientsData]) => {
        if (isMounted) {
          setLeads(leadsData.leads || []);
          setClients(clientsData.scopes || []);
        }
      }).catch(err => {
        console.error('Failed to load admin data:', err);
      });
    }
    return () => { isMounted = false; };
  }, [user, getAccessToken]);

  const handleGenerateProspects = async () => {
    setLoadingLeads(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/outreach/prospect', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setActionMessage(data.message || 'Generated new prospect pitches!');
        fetchLeads();
      }
    } catch {
      setActionMessage('Failed to trigger AI prospector.');
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

      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        setEditingPitchId(null);
        fetchLeads();
      }
    } catch {
      setActionMessage('Failed to process dispatch action.');
    }
  };

  if (authLoading) {
    return (
      <div className={styles.wrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94A3B8' }}>Verifying admin authentication credentials...</p>
      </div>
    );
  }

  // 1. Unauthenticated Login Gate
  if (!user) {
    return (
      <div className={styles.wrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.card} style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ margin: '0 auto 16px', background: 'rgba(0, 102, 255, 0.1)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={24} color="#0066FF" />
          </div>
          <h2 style={{ fontSize: '20px', color: '#FFFFFF', margin: '0 0 8px' }}>Restricted Admin Workspace</h2>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 24px' }}>
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
      <div className={styles.wrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.card} style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ margin: '0 auto 16px', background: 'rgba(239, 68, 68, 0.1)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={24} color="#EF4444" />
          </div>
          <h2 style={{ fontSize: '20px', color: '#FFFFFF', margin: '0 0 8px' }}>403 Access Denied</h2>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 24px' }}>
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/analytics" className={styles.backLink}>
              <ArrowLeft size={18} />
              <span>Public Visitor Analytics</span>
            </Link>
            <a
              href="https://admin.rag.prateeq.in"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.backLink}
              style={{ color: '#38BDF8', fontWeight: 600 }}
            >
              <Zap size={16} />
              <span>Retriever SaaS Portal (admin.rag.prateeq.in)</span>
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={styles.badge}>
              <ShieldCheck size={14} color="#10B981" />
              <span>Admin Verified: {user.email}</span>
            </div>
            <button onClick={logout} className={styles.logoutBtn} title="Sign Out">
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
            <Sparkles size={16} />
            <span>Autonomous Outreach ({pendingLeads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`${styles.tabBtn} ${activeTab === 'clients' ? styles.tabActive : ''}`}
          >
            <Users size={16} />
            <span>Client Scopes &amp; Ledgers ({clients.length})</span>
          </button>
        </div>

        {actionMessage && (
          <div className={styles.messageBanner}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Tab 1: Autonomous Prospecting */}
        {activeTab === 'prospects' && (
          <div>
            <div className={styles.actionsBar}>
              <button onClick={handleGenerateProspects} disabled={loadingLeads} className={styles.primaryBtn}>
                <Sparkles size={16} />
                <span>{loadingLeads ? 'Prospecting Web...' : 'Run AI Prospector (Generate 2 Leads)'}</span>
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
                {pendingLeads.map(lead => (
                  <div key={lead.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h3 className={styles.leadName}>{lead.lead_name}</h3>
                        <p className={styles.leadMeta}>
                          <Building2 size={14} /> {lead.company} • {lead.role}
                        </p>
                      </div>
                      {lead.source_url && (
                        <a href={lead.source_url} target="_blank" rel="noopener noreferrer" className={styles.linkIcon}>
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
                          rows={6}
                        />
                      ) : (
                        <p className={styles.pitchText}>{lead.ai_generated_pitch}</p>
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
                              setEditedPitchText(lead.ai_generated_pitch);
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Client Scopes & Accounts */}
        {activeTab === 'clients' && (
          <div className={styles.queueGrid}>
            {clients.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No active client scopes found in Supabase database.</p>
              </div>
            ) : (
              clients.map(c => (
                <div key={c.id} className={styles.card}>
                  <h3 className={styles.leadName}>{c.company_name || 'Client Project'}</h3>
                  <p className={styles.leadMeta}>Email: {c.email}</p>
                  <p className={styles.leadMeta}>Created: {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
