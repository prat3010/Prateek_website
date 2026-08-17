'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  X,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Building2,
  Mail,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import styles from './outreach.module.css';

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

export default function OutreachControlDeck() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPitchId, setEditingPitchId] = useState<string | null>(null);
  const [editedPitchText, setEditedPitchText] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/outreach/get-leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleGenerateProspects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/outreach/prospect', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActionMessage(data.message || 'Generated new prospect pitches!');
        fetchLeads();
      }
    } catch {
      setActionMessage('Failed to trigger AI prospector.');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (leadId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/outreach/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const pendingLeads = leads.filter(l => l.status === 'pending');
  const sentLeads = leads.filter(l => l.status === 'sent');

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* Header Navigation */}
        <div className={styles.header}>
          <Link href="/admin/analytics" className={styles.backLink}>
            <ArrowLeft size={18} />
            <span>Return to Analytics</span>
          </Link>
          <div className={styles.badge}>
            <ShieldCheck size={14} color="#10B981" />
            <span>Human-in-the-Loop Safe (1-Click Deck)</span>
          </div>
        </div>

        {/* Title */}
        <div className={styles.titleSection}>
          <h1 className={styles.title}>🤖 Autonomous Lead Prospecting Control Deck</h1>
          <p className={styles.subtitle}>
            24/7 AI Prospector discovers target leads, analyzes company tech gaps, and drafts hyper-personalized pitches.
            Review and dispatch with a single click.
          </p>
        </div>

        {/* Actions Bar */}
        <div className={styles.actionsBar}>
          <button
            onClick={handleGenerateProspects}
            disabled={loading}
            className={styles.primaryBtn}
          >
            <Sparkles size={16} />
            <span>{loading ? 'Prospecting Web...' : 'Run AI Prospector (Generate 2 Leads)'}</span>
          </button>
          <button onClick={fetchLeads} className={styles.secondaryBtn}>
            <RefreshCw size={16} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {actionMessage && (
          <div className={styles.messageBanner}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Pending Approvals Queue */}
        <div className={styles.sectionHeader}>
          <h2>📬 Pending Approvals Queue ({pendingLeads.length})</h2>
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
                    <a
                      href={lead.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkIcon}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>

                <div className={styles.emailBadge}>
                  <Mail size={14} /> {lead.email}
                </div>

                {/* Pitch Text Box */}
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

                {/* Card Actions */}
                <div className={styles.cardFooter}>
                  {editingPitchId === lead.id ? (
                    <button
                      onClick={() => handleDispatch(lead.id, 'approve')}
                      className={styles.approveBtn}
                    >
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
                      <button
                        onClick={() => handleDispatch(lead.id, 'reject')}
                        className={styles.rejectBtn}
                      >
                        <X size={14} /> Dismiss
                      </button>
                      <button
                        onClick={() => handleDispatch(lead.id, 'approve')}
                        className={styles.approveBtn}
                      >
                        <Send size={14} /> 1-Click Approve &amp; Send
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dispatched History */}
        {sentLeads.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <div className={styles.sectionHeader}>
              <h2>🚀 Sent Pitches History ({sentLeads.length})</h2>
            </div>
            <div className={styles.queueGrid}>
              {sentLeads.map(lead => (
                <div key={lead.id} className={styles.card} style={{ opacity: 0.8 }}>
                  <h3 className={styles.leadName}>{lead.lead_name} — {lead.company}</h3>
                  <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>Sent to: {lead.email}</p>
                  <p className={styles.pitchText} style={{ marginTop: '8px' }}>{lead.ai_generated_pitch}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
