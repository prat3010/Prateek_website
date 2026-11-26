'use client';

import React from 'react';
import {
  RefreshCw,
  Mail,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import styles from '@/app/admin/admin.module.css';


import type { AdminInvoiceRecord, ClientRecord } from '@/app/admin/page';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ClientsLedgerTab(props: any) {
  const {
    fetchClientScopes,
    clients,
    allInvoices,
    stageEdits,
    setStageEdits,
    paymentEdits,
    setPaymentEdits,
    maintenanceEdits,
    setMaintenanceEdits,
    deliverableEdits,
    setDeliverableEdits,
    savingScopeCode,
    handleSaveScopeAdmin,
    actionLoadingCoId,
    handleChangeOrderAction,
  } = props;
  return (
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
                clients.map((c: ClientRecord) => {
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
                              setPaymentEdits((prev: Record<string, unknown>) => ({
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
                              setPaymentEdits((prev: Record<string, unknown>) => ({
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
                              setMaintenanceEdits((prev: Record<string, unknown>) => ({ ...prev, [c.scope_code]: e.target.value }))
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
                              setStageEdits((prev: Record<string, unknown>) => ({ ...prev, [c.scope_code]: e.target.value }))
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
                              setDeliverableEdits((prev: Record<string, unknown>) => ({
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
                              setDeliverableEdits((prev: Record<string, unknown>) => ({
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
                              setDeliverableEdits((prev: Record<string, unknown>) => ({
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
                              setDeliverableEdits((prev: Record<string, unknown>) => ({
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
                            {c.invoices.map((inv: AdminInvoiceRecord) => (
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

            {/* Master Commercial Invoice Ledger */}
            {allInvoices && allInvoices.length > 0 && (
              <div style={{ marginTop: '2.5rem' }}>
                <h4 style={{ color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', marginBottom: '0.85rem' }}>
                  <span>🧾 Master Commercial Invoice Ledger ({allInvoices.length})</span>
                </h4>
                <div style={{ overflowX: 'auto', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.04)' }}>
                        <th style={{ padding: '8px 12px' }}>Invoice #</th>
                        <th style={{ padding: '8px 12px' }}>Customer / Email</th>
                        <th style={{ padding: '8px 12px' }}>Milestone / Purpose</th>
                        <th style={{ padding: '8px 12px' }}>Amount</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                        <th style={{ padding: '8px 12px' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allInvoices.map((inv: AdminInvoiceRecord) => (
                        <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#38bdf8' }}>{inv.invoice_number}</td>
                          <td style={{ padding: '8px 12px' }}>{inv.customer_email || inv.customer_name || 'Client'}</td>
                          <td style={{ padding: '8px 12px' }}>{inv.milestone_name || 'Standard Milestone'}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{inv.currency} {Number(inv.amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: inv.payment_status === 'paid' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                              color: inv.payment_status === 'paid' ? '#00E676' : '#eab308',
                            }}>
                              {inv.payment_status || 'issued'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                            {new Date(inv.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
  );
}
