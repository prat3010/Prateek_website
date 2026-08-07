'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { 
  LogOut, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  Zap, 
  Layers, 
  CreditCard, 
  CheckCircle2, 
  Edit3, 
  Plus, 
  Trash2, 
  UserCheck, 
  Save,
  Clock,
  Compass,
  FileCheck
} from 'lucide-react';
import { generateQuestionnairePDF } from '@/utils/pdfGenerator';
import resumeData from '@/data/resume.json';
import type { ResumeData } from '@/data/resume';
import styles from './dashboard.module.css';

interface ClientScope {
  id: string;
  scope_code: string;
  company_name: string;
  client_phone?: string;
  base_engine: string;
  features: string[];
  brand_asset: string;
  maintenance_plan: string;
  total_cost_inr: number;
  total_cost_usd: number;
  currency: string;
  timeline: string;
  status: string;
  delivery_stage?: 'architecture' | 'engineering' | 'staging' | 'live';
  deposit_paid: boolean;
  created_at: string;
}

export default function ClientDashboardPage() {
  const { user, loading, logout, loginWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'scopes' | 'invoices' | 'rag'>('scopes');
  const [editingScopeId, setEditingScopeId] = useState<string | null>(null);
  const [newFeatureInput, setNewFeatureInput] = useState('');

  // Profile setup state for pre-fetched Google details
  const [companyInputs, setCompanyInputs] = useState<Record<string, string>>({});
  const [phoneInputs, setPhoneInputs] = useState<Record<string, string>>({});

  // Lazy state initialization for scopes without cascading renders in useEffect
  const [scopes, setScopes] = useState<ClientScope[]>(() => {
    if (typeof window === 'undefined') return [];

    const pendingScopeRaw = localStorage.getItem('prateeq_pending_scope');
    if (!pendingScopeRaw) return [];

    try {
      const parsed = JSON.parse(pendingScopeRaw);
      const importedScope: ClientScope = {
        id: `scope-${Date.now()}`,
        scope_code: parsed.scopeCode || `SCOPE-${Math.floor(10000 + Math.random() * 90000)}`,
        company_name: parsed.companyName?.trim() || '',
        client_phone: parsed.contactPhone || '',
        base_engine: parsed.baseEngineTitle || 'Full-Stack Web Engine',
        features: parsed.selectedFeatures || [],
        brand_asset: parsed.brandAssetOption || 'Standard',
        maintenance_plan: parsed.maintenancePlan || 'Self-Managed (30-Day Warranty)',
        total_cost_inr: parsed.totalCostINR || 175000,
        total_cost_usd: parsed.totalCostUSD || 2500,
        currency: parsed.currency || 'INR',
        timeline: parsed.timeline || 'Standard Turnaround (2-4 Weeks)',
        status: 'Draft Proposal',
        delivery_stage: 'architecture',
        deposit_paid: false,
        created_at: new Date().toISOString(),
      };

      localStorage.removeItem('prateeq_pending_scope');
      return [importedScope];
    } catch (err) {
      console.warn('Failed to parse pending scope:', err);
      return [];
    }
  });

  const handleSaveProfile = (scopeId: string) => {
    const compName = companyInputs[scopeId]?.trim() || user?.user_metadata?.full_name || 'My Custom Project';
    const phone = phoneInputs[scopeId]?.trim() || '';

    setScopes((prev) =>
      prev.map((s) => {
        if (s.id !== scopeId) return s;
        const updated = { ...s, company_name: compName, client_phone: phone };

        if (user?.email) {
          fetch('/api/client/save-scope', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientEmail: user.email,
              scopeCode: s.scope_code,
              companyName: compName,
              contactPhone: phone,
              baseEngineTitle: s.base_engine,
              selectedFeatures: s.features,
              brandAssetOption: s.brand_asset,
              maintenancePlan: s.maintenance_plan,
              totalCostINR: s.total_cost_inr,
              totalCostUSD: s.total_cost_usd,
              currency: s.currency,
              timeline: s.timeline,
            }),
          }).catch((err) => console.warn('Save scope profile warning:', err));
        }

        return updated;
      })
    );
  };

  const handleDownloadPDF = async (scope: ClientScope) => {
    try {
      const isNoir = true;
      const currency = (scope.currency === 'USD' ? 'USD' : 'INR') as 'INR' | 'USD';
      await generateQuestionnairePDF(
        resumeData as unknown as ResumeData,
        {
          companyName: scope.company_name || user?.user_metadata?.full_name || 'Client Scope',
          contactEmail: user?.email || '',
          projectGoal: 'Web Architecture',
          targetAudience: 'Global',
          projectCategory: scope.base_engine,
          features: scope.features,
          assetsStatus: scope.brand_asset,
          maintenancePlan: scope.maintenance_plan,
          totalBuildCostINR: scope.total_cost_inr,
          totalBuildCostUSD: scope.total_cost_usd,
          timeline: scope.timeline,
        },
        isNoir,
        currency
      );
    } catch (pdfErr) {
      console.error('PDF export error:', pdfErr);
      alert('Could not generate PDF. Please try again.');
    }
  };

  const handleAddFeature = (scopeId: string) => {
    if (!newFeatureInput.trim()) return;
    setScopes((prev) =>
      prev.map((s) => {
        if (s.id !== scopeId) return s;
        return { ...s, features: [...s.features, newFeatureInput.trim()] };
      })
    );
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (scopeId: string, featureIndex: number) => {
    setScopes((prev) =>
      prev.map((s) => {
        if (s.id !== scopeId) return s;
        const updated = s.features.filter((_, idx) => idx !== featureIndex);
        return { ...s, features: updated };
      })
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading client workspace session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.authPromptContainer}>
        <div className={styles.authCard}>
          <ShieldCheck size={48} className={styles.authIcon} />
          <h1>Client Portal Workspace</h1>
          <p>Access your active project scopes, PDF briefs, payment portal, and managed AI services.</p>
          <button className="comic-btn comic-btn-blue" onClick={() => loginWithGoogle('/dashboard')}>
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardShell}>
      {/* Workspace Header */}
      <header className={styles.header}>
        <div className={styles.userInfo}>
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt="Profile"
              width={48}
              height={48}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarFallback}>{(user.email || 'C')[0].toUpperCase()}</div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 className={styles.userName}>{user.user_metadata?.full_name || 'Client Workspace'}</h1>
              <span className={styles.verifiedBadge}>● Verified Client</span>
            </div>
            <p className={styles.userEmail}>{user.email}</p>
          </div>
        </div>
        <button className="comic-btn comic-btn-outline" onClick={logout}>
          <LogOut size={14} style={{ marginRight: '0.4rem' }} /> Sign Out
        </button>
      </header>

      {/* Workspace Tabs */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'scopes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('scopes')}
        >
          <Layers size={16} /> Active Scopes ({scopes.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'invoices' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <CreditCard size={16} /> Invoices & Receipts
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'rag' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('rag')}
        >
          <Zap size={16} /> Managed RAG Services
        </button>
      </div>

      {/* Workspace Body */}
      <div className={styles.contentBody}>
        {activeTab === 'scopes' && (
          <div className={styles.sectionGrid}>
            {scopes.length === 0 ? (
              <div className={styles.emptyCard}>
                <p>No active project scopes found. Configure your architecture in our Instant Scoping Lab!</p>
                <a href="/scoping" className="comic-btn comic-btn-blue" style={{ marginTop: '1rem', display: 'inline-block' }}>
                  Open Scoping Lab
                </a>
              </div>
            ) : (
              scopes.map((s) => {
                const totalAmount = s.currency === 'INR' ? s.total_cost_inr : s.total_cost_usd;
                const depositAmount = Math.round(totalAmount * 0.5);
                const isEditing = editingScopeId === s.id;
                const needsProfileConfirmation = !s.company_name || s.company_name === 'My Custom Project';

                return (
                  <div key={s.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div>
                        <span className={styles.scopeBadge}>{s.scope_code}</span>
                        <h3 className={styles.companyName}>
                          {s.company_name || user.user_metadata?.full_name || 'My Custom Project'}
                        </h3>
                      </div>
                      <span className={`${styles.statusBadge} ${s.deposit_paid ? styles.statusPaid : styles.statusDraft}`}>
                        {s.deposit_paid ? 'DEPOSIT PAID (50%)' : 'DRAFT PROPOSAL'}
                      </span>
                    </div>

                    {/* Pre-fetched Profile Confirmation Banner */}
                    {needsProfileConfirmation && (
                      <div className={styles.profileConfirmBox}>
                        <div className={styles.profileConfirmHeader}>
                          <UserCheck size={18} />
                          <span>Confirm Client Details (Prefetched from Google Auth)</span>
                        </div>
                        <div className={styles.profileGrid}>
                          <div>
                            <label className={styles.inputLabel}>Name (Google Auth)</label>
                            <input
                              type="text"
                              disabled
                              readOnly
                              value={user.user_metadata?.full_name || 'Prefetched Client'}
                              className={styles.readOnlyInput}
                            />
                          </div>
                          <div>
                            <label className={styles.inputLabel}>Email (Google Auth)</label>
                            <input
                              type="email"
                              disabled
                              readOnly
                              value={user.email || ''}
                              className={styles.readOnlyInput}
                            />
                          </div>
                          <div>
                            <label className={styles.inputLabel}>Company / Project Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Acme Tech Labs"
                              value={companyInputs[s.id] ?? (s.company_name === 'My Custom Project' ? '' : s.company_name)}
                              onChange={(e) => setCompanyInputs({ ...companyInputs, [s.id]: e.target.value })}
                              className={styles.profileInput}
                            />
                          </div>
                          <div>
                            <label className={styles.inputLabel}>Phone / WhatsApp (Optional)</label>
                            <input
                              type="tel"
                              placeholder="+91 98765 43210"
                              value={phoneInputs[s.id] ?? (s.client_phone || '')}
                              onChange={(e) => setPhoneInputs({ ...phoneInputs, [s.id]: e.target.value })}
                              className={styles.profileInput}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          className="comic-btn comic-btn-blue"
                          style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
                          onClick={() => handleSaveProfile(s.id)}
                        >
                          <Save size={14} style={{ marginRight: '0.4rem' }} /> Confirm & Save Details
                        </button>
                      </div>
                    )}

                    {/* Milestone Progress Bar */}
                    <div className={styles.milestoneSection}>
                      <div className={styles.milestoneHeader}>
                        <Compass size={16} />
                        <span>Development Milestone Tracker</span>
                      </div>
                      <div className={styles.milestoneSteps}>
                        <div className={`${styles.milestoneStep} ${styles.stepActive}`}>
                          <span className={styles.stepDot}>1</span>
                          <span>Architecture & Specs</span>
                        </div>
                        <div className={`${styles.milestoneStep} ${s.deposit_paid ? styles.stepActive : ''}`}>
                          <span className={styles.stepDot}>2</span>
                          <span>Core Engineering</span>
                        </div>
                        <div className={styles.milestoneStep}>
                          <span className={styles.stepDot}>3</span>
                          <span>Staging & QA</span>
                        </div>
                        <div className={styles.milestoneStep}>
                          <span className={styles.stepDot}>4</span>
                          <span>Production Launch</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.orderDetails}>
                      <p className={styles.engineName}>
                        <strong>Base Engine Tier:</strong> {s.base_engine}
                      </p>
                      <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.2rem' }}>
                        <Clock size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                        Target Timeline: {s.timeline}
                      </p>

                      <div className={styles.featuresSection}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>Scope Features & Modules ({s.features.length}):</strong>
                          <button
                            type="button"
                            className={styles.editToggleBtn}
                            onClick={() => setEditingScopeId(isEditing ? null : s.id)}
                          >
                            <Edit3 size={14} /> {isEditing ? 'Done Editing' : 'Customize Features'}
                          </button>
                        </div>

                        {isEditing ? (
                          <div className={styles.editableFeaturesList}>
                            {s.features.map((feat, idx) => (
                              <div key={idx} className={styles.featureItemRow}>
                                <span>• {feat}</span>
                                <button
                                  type="button"
                                  className={styles.removeFeatureBtn}
                                  onClick={() => handleRemoveFeature(s.id, idx)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                            <div className={styles.addFeatureRow}>
                              <input
                                type="text"
                                className={styles.addFeatureInput}
                                placeholder="Add custom feature..."
                                value={newFeatureInput}
                                onChange={(e) => setNewFeatureInput(e.target.value)}
                              />
                              <button
                                type="button"
                                className={styles.addFeatureBtn}
                                onClick={() => handleAddFeature(s.id)}
                              >
                                <Plus size={14} /> Add
                              </button>
                            </div>
                          </div>
                        ) : (
                          <ul className={styles.featuresList}>
                            {s.features.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className={styles.costSummary}>
                        <div>
                          Total Investment: <strong>{s.currency === 'INR' ? `₹${s.total_cost_inr.toLocaleString('en-IN')}` : `$${s.total_cost_usd.toLocaleString('en-US')}`}</strong>
                        </div>
                        <div>
                          50% Scope Deposit: <strong className={styles.paidText}>{s.currency === 'INR' ? `₹${depositAmount.toLocaleString('en-IN')}` : `$${depositAmount.toLocaleString('en-US')}`}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className="comic-btn comic-btn-outline"
                        onClick={() => handleDownloadPDF(s)}
                      >
                        <Download size={15} style={{ marginRight: '0.4rem' }} /> PDF Brief
                      </button>

                      {s.deposit_paid ? (
                        <div className={styles.paidNotice}>
                          <CheckCircle2 size={16} /> 50% Deposit Locked — Development In Architecture
                        </div>
                      ) : (
                        <div className={styles.paymentContainer}>
                          <a
                            href={`mailto:prateeqsharma@gmail.com?subject=Confirming Scope ${s.scope_code}&body=Hi Prateek, I have finalized my scope ${s.scope_code} for ${s.company_name || 'my project'}. Total: ${s.currency === 'INR' ? `₹${totalAmount.toLocaleString('en-IN')}` : `$${totalAmount}`}. Let us proceed!`}
                            className="comic-btn comic-btn-blue"
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Zap size={15} style={{ marginRight: '0.4rem' }} /> Confirm Scope & Start Build
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className={styles.sectionGrid}>
            <div className={styles.tableCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FileCheck size={20} />
                <h3 style={{ margin: 0 }}>Itemized Invoices & Payment Ledger</h3>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Scope Ref</th>
                    <th>Gateway</th>
                    <th>Deposit Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scopes.map((s) => (
                    <tr key={s.id}>
                      <td>{new Date(s.created_at).toLocaleDateString()}</td>
                      <td><code>{s.scope_code}</code></td>
                      <td><span className={styles.gatewayBadge}>DIRECT / WIRE</span></td>
                      <td><strong>{s.currency === 'INR' ? `₹${Math.round(s.total_cost_inr * 0.5).toLocaleString('en-IN')}` : `$${Math.round(s.total_cost_usd * 0.5)}`}</strong></td>
                      <td>
                        <span className={s.deposit_paid ? styles.paidBadge : styles.pendingBadge}>
                          {s.deposit_paid ? 'PAID' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rag' && (
          <div className={styles.sectionGrid}>
            <div className={styles.ragCard}>
              <div className={styles.ragHeader}>
                <div>
                  <h3 className={styles.ragTitle}>Retriever AI SaaS Workspace</h3>
                  <span className={styles.planBadge}>Managed RAG Studio</span>
                </div>
                <a href="/rag/app" className="comic-btn comic-btn-blue">
                  🚀 Launch RAG App <ExternalLink size={14} />
                </a>
              </div>

              <div className={styles.ragMeta}>
                <p><strong>Tenant Email:</strong> <code>{user.email}</code></p>
                <p><strong>Status:</strong> <span className={styles.activeStatus}>● ACTIVE</span></p>
                <p><strong>RAG Features:</strong> Hybrid Search (BM25 + Dense Vectors), Semantic Caching, Citations</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
