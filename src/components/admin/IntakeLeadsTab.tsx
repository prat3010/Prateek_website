'use client';

import React from 'react';
import {
  RefreshCw,
  MessageSquare,
  Bot,
} from 'lucide-react';
import styles from '@/app/admin/admin.module.css';


import type { AdminScopingTraceRecord, IntakeLeadRecord } from '@/app/admin/page';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function IntakeLeadsTab(props: any) {
  const {
    fetchIntakeLeads,
    loadingIntakeLeads,
    intakeLeads,
    scopingTraces,
    setSelectedLeadForDrawer,
    setLeadPitchDraft,
  } = props;
  return (
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
                {intakeLeads.map((lead: IntakeLeadRecord) => {
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
                            {lead.visitor_country && lead.visitor_country !== 'Unknown' && (
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'var(--color-text-muted)',
                              }}>
                                🌍 {lead.visitor_country}
                              </span>
                            )}
                            {lead.model_used && (
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'var(--color-text-muted)',
                              }}>
                                🧠 {lead.model_used}
                              </span>
                            )}
                            {lead.latency_ms ? (
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'var(--color-text-muted)',
                              }}>
                                ⏱️ {lead.latency_ms}ms
                              </span>
                            ) : null}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Email:{' '}
                            {lead.contact_email?.toLowerCase().endsWith('@unauthenticated.client') ? (
                              <span style={{ color: '#f59e0b', fontWeight: 600 }}>⚠️ Unauthenticated Prospect</span>
                            ) : (
                              <strong style={{ color: 'var(--color-text)' }}>{lead.contact_email}</strong>
                            )}
                            {lead.contact_phone && <span> • Phone: {lead.contact_phone}</span>}
                            <span> • Captured: {lead.created_at ? new Date(lead.created_at).toLocaleString() : 'Unknown'}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {hasTranscript ? (
                            <button
                              onClick={() => {
                                setSelectedLeadForDrawer(lead);
                                setLeadPitchDraft(null);
                              }}
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

            {/* AI Scoping Telemetry Traces (Observability for unattached / active copilot chats) */}
            {scopingTraces && scopingTraces.length > 0 && (
              <div style={{ marginTop: '2.5rem' }}>
                <h4 style={{ color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', marginBottom: '0.85rem' }}>
                  <Bot size={18} style={{ color: '#38bdf8' }} />
                  <span>Recent AI Scoping Telemetry Traces ({scopingTraces.length})</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {scopingTraces.slice(0, 15).map((tr: AdminScopingTraceRecord) => (
                    <div
                      key={tr.id}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                            {tr.user_email ? `👤 ${tr.user_email}` : `Session: ${tr.session_id.slice(0, 12)}...`}
                          </span>
                          {tr.scope_code && (
                            <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>[{tr.scope_code}]</span>
                          )}
                          {tr.visitor_country && (
                            <span style={{ color: 'var(--color-text-muted)' }}>🌍 {tr.visitor_country}</span>
                          )}
                          {tr.model_used && (
                            <span style={{ color: '#818cf8', fontSize: '0.72rem' }}>🧠 {tr.model_used}</span>
                          )}
                          {tr.latency_ms ? (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>⏱️ {tr.latency_ms}ms</span>
                          ) : null}
                        </div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                          {new Date(tr.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ color: '#cbd5e1', marginBottom: '4px' }}>
                        <strong style={{ color: '#38bdf8' }}>User:</strong> {tr.user_query}
                      </div>
                      {tr.assistant_response && (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', lineHeight: '1.4' }}>
                          <strong style={{ color: '#10b981' }}>Copilot:</strong> {tr.assistant_response.slice(0, 200)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
  );
}
