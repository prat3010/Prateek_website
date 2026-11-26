'use client';

import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  RefreshCw,
  Building2,
  Mail,
  ExternalLink,
  X,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import styles from '@/app/admin/admin.module.css';


import type { Lead } from '@/app/admin/page';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OutreachQueueTab(props: any) {
  const {
    handleGenerateProspects,
    loadingLeads,
    fetchLeads,
    pendingLeads,
    approvedLeads = [],
    parsePitchFormats,
    editingPitchId,
    setEditingPitchId,
    editedPitchText,
    setEditedPitchText,
    handleDispatch,
  } = props;
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);

  const handleCopyPitch = async (leadId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLeadId(leadId);
      setTimeout(() => setCopiedLeadId((prev) => (prev === leadId ? null : prev)), 2000);
    } catch {
      // Clipboard unavailable
    }
  };
  return (
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
                {pendingLeads.map((lead: Lead) => {
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
                        <Mail size={14} /> {lead.email || 'No direct email — apply via source link'}
                        {lead.intent_source && <span> • {lead.intent_source}</span>}
                        {typeof lead.quality_score === 'number' && <span> • Score {lead.quality_score}</span>}
                        {lead.compensation && <span> • {lead.compensation}</span>}
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
                          <>
                            <button
                              onClick={() => setEditingPitchId(null)}
                              className={styles.editBtn}
                            >
                              Cancel
                            </button>
                            <button onClick={() => handleDispatch(lead.id, 'approve')} className={styles.approveBtn}>
                              <Send size={14} /> {lead.email ? 'Save & Dispatch Email' : 'Save & Approve for Manual Apply'}
                            </button>
                          </>
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
                              <Send size={14} /> {lead.email ? '1-Click Approve & Send' : 'Approve for Manual Apply'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {approvedLeads.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
                  Approved — Ready for Manual Apply ({approvedLeads.length})
                </h3>
                <div className={styles.queueGrid}>
                  {approvedLeads.map((lead: Lead) => {
                    const formats = parsePitchFormats(lead.ai_generated_pitch);
                    const pitchBody = formats.email || lead.ai_generated_pitch;
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
                              aria-label={`Open application link for ${lead.company}`}
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                        <div className={styles.pitchBox}>
                          <p className={styles.pitchText}>{pitchBody}</p>
                        </div>
                        <div className={styles.cardFooter}>
                          <button
                            onClick={() => handleCopyPitch(lead.id, pitchBody)}
                            className={styles.editBtn}
                          >
                            {copiedLeadId === lead.id ? <Check size={14} /> : <Copy size={14} />}
                            {copiedLeadId === lead.id ? ' Copied' : ' Copy Pitch'}
                          </button>
                          <button onClick={() => handleDispatch(lead.id, 'reject')} className={styles.rejectBtn}>
                            <X size={14} /> Dismiss
                          </button>
                          <button onClick={() => handleDispatch(lead.id, 'mark_sent')} className={styles.approveBtn}>
                            <CheckCircle2 size={14} /> Mark Applied
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
  );
}
